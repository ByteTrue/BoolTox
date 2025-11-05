import { prisma } from '../../common/prisma.service';
import { logger } from '../../common/logger.service';
import { isNewer } from '../../common/version.util';
import { AppError, ErrorCode } from '../../common/error.handler';
import type { CheckUpdateQuery, CreateReleaseInput, UpdateReleaseInput } from './releases.schema';

/**
 * 发布版本业务逻辑服务
 */
export class ReleasesService {
  /**
   * 获取最新版本（客户端查询）
   */
  async getLatestRelease(query: CheckUpdateQuery) {
    logger.info({ query }, 'Checking for updates');

    try {
      // 查询符合条件的最新发布版本
      const release = await prisma.release.findFirst({
        where: {
          channel: query.channel,
          publishedAt: {
            not: null,
            lte: new Date(), // 已发布且发布时间不晚于当前时间
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          assets: {
            where: {
              platform: query.platform,
              architecture: query.architecture,
            },
          },
        },
      });

      // 如果没有找到发布版本或没有匹配的资产
      if (!release || release.assets.length === 0) {
        logger.info({ query }, 'No matching release found');
        return {
          updateAvailable: false,
          release: null,
        };
      }

      // 检查是否有更新
      const updateAvailable = isNewer(query.version, release.version);

      if (!updateAvailable) {
        logger.info({ currentVersion: query.version, latestVersion: release.version }, 'Already up to date');
        return {
          updateAvailable: false,
          release: null,
        };
      }

      // 检查灰度发布百分比
      if (release.rolloutPercent < 100) {
        // 简单的灰度逻辑：基于版本号哈希
        const hash = this.hashVersion(query.version);
        const userPercent = hash % 100;
        
        if (userPercent >= release.rolloutPercent) {
          logger.info(
            { 
              version: release.version, 
              rolloutPercent: release.rolloutPercent,
              userPercent 
            },
            'User not in rollout group'
          );
          return {
            updateAvailable: false,
            release: null,
          };
        }
      }

      logger.info(
        { currentVersion: query.version, newVersion: release.version },
        'Update available'
      );

      // 返回更新信息
      return {
        updateAvailable: true,
        release: {
          id: release.id,
          version: release.version,
          channel: release.channel,
          notes: release.notes,
          mandatory: release.mandatory,
          rolloutPercent: release.rolloutPercent,
          publishedAt: release.publishedAt?.toISOString() || null,
          asset: {
            id: release.assets[0].id,
            downloadUrl: release.assets[0].downloadUrl,
            checksum: release.assets[0].checksum,
            signature: release.assets[0].signature,
            sizeBytes: Number(release.assets[0].sizeBytes),
            platform: release.assets[0].platform,
            architecture: release.assets[0].architecture,
          },
        },
      };
    } catch (error) {
      logger.error({ error, query }, 'Failed to check for updates');
      throw error;
    }
  }

  /**
   * 简单哈希函数（用于灰度发布）
   */
  private hashVersion(version: string): number {
    let hash = 0;
    for (let i = 0; i < version.length; i++) {
      const char = version.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 创建发布版本
   */
  async createRelease(input: CreateReleaseInput) {
    logger.info({ version: input.version }, 'Creating release');

    try {
      // 检查版本是否已存在
      const existing = await prisma.release.findUnique({
        where: { version: input.version },
      });

      if (existing) {
        throw new AppError(ErrorCode.UNIQUE_CONSTRAINT, 'Release with this version already exists', 409);
      }

      // 创建发布版本及其资产
      const release = await prisma.release.create({
        data: {
          version: input.version,
          channel: input.channel,
          notes: input.notes,
          mandatory: input.mandatory,
          rolloutPercent: input.rolloutPercent,
          assets: {
            create: input.assets.map((asset) => ({
              platform: asset.platform,
              architecture: asset.architecture,
              downloadUrl: asset.downloadUrl,
              checksum: asset.checksum,
              signature: asset.signature,
              sizeBytes: BigInt(asset.sizeBytes),
            })),
          },
        },
        include: {
          assets: true,
        },
      });

      logger.info({ releaseId: release.id, version: release.version }, 'Release created');
      return release;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, input }, 'Failed to create release');
      throw error;
    }
  }

  /**
   * 更新发布版本
   */
  async updateRelease(id: string, input: UpdateReleaseInput) {
    logger.info({ releaseId: id }, 'Updating release');

    try {
      // 检查版本是否存在
      const existing = await prisma.release.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(ErrorCode.RELEASE_NOT_FOUND, 'Release not found', 404);
      }

      // 更新发布版本
      const release = await prisma.release.update({
        where: { id },
        data: {
          channel: input.channel,
          notes: input.notes,
          mandatory: input.mandatory,
          rolloutPercent: input.rolloutPercent,
          publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
        },
        include: {
          assets: true,
        },
      });

      logger.info({ releaseId: release.id, version: release.version }, 'Release updated');
      return release;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, releaseId: id }, 'Failed to update release');
      throw error;
    }
  }

  /**
   * 删除发布版本
   */
  async deleteRelease(id: string) {
    logger.info({ releaseId: id }, 'Deleting release');

    try {
      // 检查版本是否存在
      const existing = await prisma.release.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError(ErrorCode.RELEASE_NOT_FOUND, 'Release not found', 404);
      }

      // 删除发布版本（级联删除资产）
      await prisma.release.delete({
        where: { id },
      });

      logger.info({ releaseId: id }, 'Release deleted');
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, releaseId: id }, 'Failed to delete release');
      throw error;
    }
  }

  /**
   * 列出所有版本（管理端）
   */
  async listReleases(channel?: string, page: number = 1, limit: number = 20) {
    logger.info({ channel, page, limit }, 'Listing releases');

    try {
      const where: any = {};
      
      if (channel) {
        where.channel = channel;
      }

      const [releases, total] = await Promise.all([
        prisma.release.findMany({
          where,
          include: {
            assets: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.release.count({ where }),
      ]);

      return {
        data: releases,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error({ error }, 'Failed to list releases');
      throw error;
    }
  }

  /**
   * 获取单个版本详情
   */
  async getReleaseById(id: string) {
    logger.info({ releaseId: id }, 'Getting release by ID');

    try {
      const release = await prisma.release.findUnique({
        where: { id },
        include: {
          assets: true,
        },
      });

      if (!release) {
        throw new AppError(ErrorCode.RELEASE_NOT_FOUND, 'Release not found', 404);
      }

      return release;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error({ error, releaseId: id }, 'Failed to get release');
      throw error;
    }
  }
}

// 导出单例
export const releasesService = new ReleasesService();