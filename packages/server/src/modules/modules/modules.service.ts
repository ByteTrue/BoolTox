import { prisma } from '../../common/prisma.service';
import { logger } from '../../common/logger.service';
import { AppError, ErrorCode } from '../../common/error.handler';
import type {
  ModuleListQuery,
  CreateModuleInput,
  UpdateModuleInput,
  CreateModuleVersionInput,
} from './modules.schema';

/**
 * 模块市场业务逻辑服务
 */
export class ModulesService {
  /**
   * 获取模块列表（支持分页、搜索、过滤、排序）
   */
  async listModules(query: ModuleListQuery) {
    logger.info({ query }, 'Listing modules');

    try {
      const { category, search, featured, status, page, limit, sortBy, sortOrder } = query;

      // 构建查询条件
      const where: any = {};

      if (category) {
        where.category = category;
      }

      if (featured !== undefined) {
        where.featured = featured;
      }

      if (status) {
        where.status = status;
      }

      // 搜索条件
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { displayName: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { keywords: { has: search } },
        ];
      }

      // 排序条件
      const orderBy: any = {};
      orderBy[sortBy] = sortOrder;

      // 执行查询
      const [modules, total] = await Promise.all([
        prisma.module.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            author: true,
            category: true,
            keywords: true,
            currentVersion: true,
            downloads: true,
            rating: true,
            featured: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.module.count({ where }),
      ]);

      return {
        modules,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to list modules');
      throw error;
    }
  }

  /**
   * 根据 ID 获取模块详情
   */
  async getModuleById(id: string) {
    logger.info({ moduleId: id }, 'Getting module by ID');

    try {
      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          versions: {
            orderBy: {
              publishedAt: 'desc',
            },
            take: 10, // 只返回最近 10 个版本
          },
        },
      });

      if (!module) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      return module;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id }, 'Failed to get module');
      throw error;
    }
  }

  /**
   * 获取模块的所有版本
   */
  async getModuleVersions(id: string) {
    logger.info({ moduleId: id }, 'Getting module versions');

    try {
      // 检查模块是否存在
      const module = await prisma.module.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!module) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      // 获取所有版本
      const versions = await prisma.moduleVersion.findMany({
        where: { moduleId: id },
        orderBy: {
          publishedAt: 'desc',
        },
      });

      return versions;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id }, 'Failed to get module versions');
      throw error;
    }
  }

  /**
   * 增加模块下载计数
   */
  async incrementDownloadCount(id: string) {
    logger.info({ moduleId: id }, 'Incrementing download count');

    try {
      const module = await prisma.module.update({
        where: { id },
        data: {
          downloads: {
            increment: 1,
          },
        },
        select: {
          id: true,
          downloads: true,
        },
      });

      return module;
    } catch (error) {
      logger.error({ error, moduleId: id }, 'Failed to increment download count');
      throw error;
    }
  }

  /**
   * 搜索模块
   */
  async searchModules(keyword: string, category?: string, page: number = 1, limit: number = 10) {
    logger.info({ keyword, category, page, limit }, 'Searching modules');

    try {
      // 构建搜索条件
      const where: any = {
        status: 'ACTIVE', // 只搜索活跃模块
        OR: [
          { name: { contains: keyword, mode: 'insensitive' } },
          { displayName: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { keywords: { has: keyword } },
        ],
      };

      if (category) {
        where.category = category;
      }

      // 执行搜索
      const [modules, total] = await Promise.all([
        prisma.module.findMany({
          where,
          orderBy: [
            { featured: 'desc' },
            { downloads: 'desc' },
          ],
          skip: (page - 1) * limit,
          take: limit,
          select: {
            id: true,
            name: true,
            displayName: true,
            description: true,
            author: true,
            category: true,
            keywords: true,
            currentVersion: true,
            downloads: true,
            rating: true,
            featured: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        prisma.module.count({ where }),
      ]);

      return {
        modules,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error({ error, keyword }, 'Failed to search modules');
      throw error;
    }
  }

  /**
   * 获取模块下载链接（指定版本或最新版本）
   */
  async getModuleDownloadUrl(id: string, version?: string) {
    logger.info({ moduleId: id, version }, 'Getting module download URL');

    try {
      // 检查模块是否存在
      const module = await prisma.module.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          currentVersion: true,
          status: true,
        },
      });

      if (!module) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      if (module.status !== 'ACTIVE') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Module is not available for download', 400);
      }

      // 查找指定版本或最新版本
      const targetVersion = version || module.currentVersion;
      const moduleVersion = await prisma.moduleVersion.findUnique({
        where: {
          moduleId_version: {
            moduleId: id,
            version: targetVersion,
          },
        },
      });

      if (!moduleVersion) {
        throw new AppError(ErrorCode.NOT_FOUND, `Module version ${targetVersion} not found`, 404);
      }

      return {
        module: {
          id: module.id,
          name: module.name,
          currentVersion: module.currentVersion,
        },
        version: {
          id: moduleVersion.id,
          version: moduleVersion.version,
          bundleUrl: moduleVersion.bundleUrl,
          checksum: moduleVersion.checksum,
          sizeBytes: Number(moduleVersion.sizeBytes),
          minAppVersion: moduleVersion.minAppVersion,
          changelog: moduleVersion.changelog,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id, version }, 'Failed to get download URL');
      throw error;
    }
  }

  /**
   * 创建模块（管理端）
   */
  async createModule(input: CreateModuleInput) {
    logger.info({ name: input.name }, 'Creating module');

    try {
      // 检查名称是否已存在
      const existing = await prisma.module.findUnique({
        where: { name: input.name },
      });

      if (existing) {
        throw new AppError(ErrorCode.UNIQUE_CONSTRAINT, 'Module with this name already exists', 409);
      }

      // 创建模块
      const module = await prisma.module.create({
        data: {
          name: input.name,
          displayName: input.displayName,
          description: input.description,
          author: input.author,
          category: input.category,
          keywords: input.keywords,
          currentVersion: input.currentVersion,
          featured: input.featured || false,
          status: 'ACTIVE',
        },
      });

      logger.info({ moduleId: module.id, name: module.name }, 'Module created');
      return module;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, input }, 'Failed to create module');
      throw error;
    }
  }

  /**
   * 更新模块（管理端）
   */
  async updateModule(id: string, input: UpdateModuleInput) {
    logger.info({ moduleId: id }, 'Updating module');

    try {
      // 检查模块是否存在
      const existing = await prisma.module.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      // 更新模块
      const module = await prisma.module.update({
        where: { id },
        data: input,
      });

      logger.info({ moduleId: module.id, name: module.name }, 'Module updated');
      return module;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id }, 'Failed to update module');
      throw error;
    }
  }

  /**
   * 删除模块（管理端）
   */
  async deleteModule(id: string) {
    logger.info({ moduleId: id }, 'Deleting module');

    try {
      // 检查模块是否存在
      const existing = await prisma.module.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      // 删除模块（级联删除版本）
      await prisma.module.delete({
        where: { id },
      });

      logger.info({ moduleId: id }, 'Module deleted');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id }, 'Failed to delete module');
      throw error;
    }
  }

  /**
   * 创建模块版本（管理端）
   */
  async createModuleVersion(moduleId: string, input: CreateModuleVersionInput) {
    logger.info({ moduleId, version: input.version }, 'Creating module version');

    try {
      // 检查模块是否存在
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      // 检查版本是否已存在
      const existingVersion = await prisma.moduleVersion.findUnique({
        where: {
          moduleId_version: {
            moduleId,
            version: input.version,
          },
        },
      });

      if (existingVersion) {
        throw new AppError(ErrorCode.UNIQUE_CONSTRAINT, 'Module version already exists', 409);
      }

      // 创建版本
      const version = await prisma.moduleVersion.create({
        data: {
          moduleId,
          version: input.version,
          changelog: input.changelog,
          bundleUrl: input.bundleUrl,
          checksum: input.checksum,
          sizeBytes: BigInt(input.sizeBytes),
          minAppVersion: input.minAppVersion,
        },
      });

      // 更新模块的当前版本
      await prisma.module.update({
        where: { id: moduleId },
        data: { currentVersion: input.version },
      });

      logger.info({ versionId: version.id, moduleId, version: version.version }, 'Module version created');
      return version;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId, input }, 'Failed to create module version');
      throw error;
    }
  }

  /**
   * 获取模块统计信息
   */
  async getModuleStats(id: string) {
    logger.info({ moduleId: id }, 'Getting module stats');

    try {
      const module = await prisma.module.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          downloads: true,
          rating: true,
          createdAt: true,
          _count: {
            select: {
              versions: true,
            },
          },
        },
      });

      if (!module) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Module not found', 404);
      }

      return {
        id: module.id,
        name: module.name,
        downloads: module.downloads,
        rating: module.rating,
        versionCount: module._count.versions,
        createdAt: module.createdAt,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, moduleId: id }, 'Failed to get module stats');
      throw error;
    }
  }
}

// 导出单例
export const modulesService = new ModulesService();