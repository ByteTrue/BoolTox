import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { modulesService } from './modules.service';
import { sendSuccess, sendPaginated } from '../../common/response.util';
import {
  ModuleListQuerySchema,
  ModuleIdParamSchema,
  ModuleDownloadParamSchema,
  ModuleDownloadQuerySchema,
  ModuleSearchQuerySchema,
  CreateModuleSchema,
  UpdateModuleSchema,
  CreateModuleVersionSchema,
} from './modules.schema';
import { logger } from '../../common/logger.service';
import { authenticateAdmin } from '../../common/middleware/auth.middleware';
import { authorizePermissions } from '../../common/middleware/rbac.middleware';
import { PermissionCode } from '@booltox/shared';

/**
 * 注册模块相关路由
 */
export async function registerModulesRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/modules - 获取模块列表
   */
  fastify.get('/api/modules', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = ModuleListQuerySchema.parse(request.query);
      const result = await modulesService.listModules(query);

      return sendPaginated(reply, result.modules, result.total, result.page, result.limit);
    } catch (error) {
      logger.error({ error }, 'Failed to list modules');
      throw error;
    }
  });

  /**
   * GET /api/modules/search - 搜索模块
   */
  fastify.get('/api/modules/search', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = ModuleSearchQuerySchema.parse(request.query);
      const result = await modulesService.searchModules(
        query.keyword,
        query.category,
        query.page,
        query.limit
      );

      return sendPaginated(reply, result.modules, result.total, result.page, result.limit);
    } catch (error) {
      logger.error({ error }, 'Failed to search modules');
      throw error;
    }
  });

  /**
   * GET /api/modules/:id - 获取模块详情
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/modules/:id',
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        const module = await modulesService.getModuleById(id);

        return sendSuccess(reply, module);
      } catch (error) {
        logger.error({ error }, 'Failed to get module');
        throw error;
      }
    }
  );

  /**
   * GET /api/modules/:id/versions - 获取模块所有版本
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/modules/:id/versions',
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        const versions = await modulesService.getModuleVersions(id);

        return sendSuccess(reply, versions);
      } catch (error) {
        logger.error({ error }, 'Failed to get module versions');
        throw error;
      }
    }
  );

  /**
   * GET /api/modules/:id/stats - 获取模块统计信息
   */
  fastify.get<{ Params: { id: string } }>(
    '/api/modules/:id/stats',
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        const stats = await modulesService.getModuleStats(id);

        return sendSuccess(reply, stats);
      } catch (error) {
        logger.error({ error }, 'Failed to get module stats');
        throw error;
      }
    }
  );

  /**
   * POST /api/modules/:id/download - 获取模块下载信息并增加下载计数
   */
  fastify.post<{ Params: { id: string }; Querystring: { version?: string } }>(
    '/api/modules/:id/download',
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleDownloadParamSchema.parse(request.params);
        const { version } = ModuleDownloadQuerySchema.parse(request.query);

        // 获取下载信息
        const downloadInfo = await modulesService.getModuleDownloadUrl(id, version);

        // 增加下载计数
        await modulesService.incrementDownloadCount(id);

        return sendSuccess(reply, downloadInfo);
      } catch (error) {
        logger.error({ error }, 'Failed to process download');
        throw error;
      }
    }
  );

  /**
   * POST /api/modules - 创建模块（管理端）
   */
  fastify.post(
    '/api/modules',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.MODULE_WRITE)],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const input = CreateModuleSchema.parse(request.body);
        const module = await modulesService.createModule(input);

        return sendSuccess(reply, module, 201);
      } catch (error) {
        logger.error({ error }, 'Failed to create module');
        throw error;
      }
    }
  );

  /**
   * PATCH /api/modules/:id - 更新模块（管理端）
   */
  fastify.patch<{ Params: { id: string } }>(
    '/api/modules/:id',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.MODULE_WRITE)],
    },
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        const input = UpdateModuleSchema.parse(request.body);
        const module = await modulesService.updateModule(id, input);

        return sendSuccess(reply, module);
      } catch (error) {
        logger.error({ error }, 'Failed to update module');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/modules/:id - 删除模块（管理端）
   */
  fastify.delete<{ Params: { id: string } }>(
    '/api/modules/:id',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.MODULE_WRITE)],
    },
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        await modulesService.deleteModule(id);

        return sendSuccess(reply, { message: 'Module deleted successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to delete module');
        throw error;
      }
    }
  );

  /**
   * POST /api/modules/:id/versions - 创建模块版本（管理端）
   */
  fastify.post<{ Params: { id: string } }>(
    '/api/modules/:id/versions',
    {
      preHandler: [authenticateAdmin, authorizePermissions(PermissionCode.MODULE_WRITE)],
    },
    async (request, reply: FastifyReply) => {
      try {
        const { id } = ModuleIdParamSchema.parse(request.params);
        const input = CreateModuleVersionSchema.parse(request.body);
        const version = await modulesService.createModuleVersion(id, input);

        return sendSuccess(reply, version, 201);
      } catch (error) {
        logger.error({ error }, 'Failed to create module version');
        throw error;
      }
    }
  );

  logger.info('Modules routes registered');
}
