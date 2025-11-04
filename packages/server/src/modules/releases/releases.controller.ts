import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { releasesService } from './releases.service';
import { syncService } from '../github/sync.service';
import { sendSuccess } from '../../common/response.util';
import { validateRequest } from '../../common/middleware/validate.middleware';
import { authenticateAdmin } from '../../common/middleware/auth.middleware';
import {
  CheckUpdateQuerySchema,
  CreateReleaseSchema,
  UpdateReleaseSchema,
  SyncGitHubReleaseSchema,
  ListReleasesQuerySchema,
} from './releases.schema';

/**
 * 注册 Releases 公共路由
 */
export async function registerPublicReleasesRoutes(app: FastifyInstance) {
  /**
   * GET /api/public/releases/latest
   * 客户端查询最新版本
   */
  app.get(
    '/latest',
    {
      preHandler: validateRequest(CheckUpdateQuerySchema, 'query'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as any;
      const result = await releasesService.getLatestRelease(query);
      return sendSuccess(reply, result);
    }
  );
}

/**
 * 注册 Releases 管理路由
 */
export async function registerAdminReleasesRoutes(app: FastifyInstance) {
  // 所有管理路由都需要认证
  app.addHook('preHandler', authenticateAdmin);

  /**
   * GET /api/admin/releases
   * 列出所有版本
   */
  app.get(
    '/',
    {
      preHandler: validateRequest(ListReleasesQuerySchema, 'query'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = request.query as any;
      const result = await releasesService.listReleases(
        query.channel,
        query.page,
        query.limit
      );
      return sendSuccess(reply, result);
    }
  );

  /**
   * GET /api/admin/releases/:id
   * 获取单个版本详情
   */
  app.get(
    '/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const result = await releasesService.getReleaseById(id);
      return sendSuccess(reply, result);
    }
  );

  /**
   * POST /api/admin/releases
   * 创建版本
   */
  app.post(
    '/',
    {
      preHandler: validateRequest(CreateReleaseSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      const result = await releasesService.createRelease(body);
      return sendSuccess(reply, result, 201);
    }
  );

  /**
   * PUT /api/admin/releases/:id
   * 更新版本
   */
  app.put(
    '/:id',
    {
      preHandler: validateRequest(UpdateReleaseSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const body = request.body as any;
      const result = await releasesService.updateRelease(id, body);
      return sendSuccess(reply, result);
    }
  );

  /**
   * DELETE /api/admin/releases/:id
   * 删除版本
   */
  app.delete(
    '/:id',
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      await releasesService.deleteRelease(id);
      return sendSuccess(reply, { message: 'Release deleted successfully' });
    }
  );

  /**
   * POST /api/admin/releases/sync-github
   * 手动同步 GitHub Release
   */
  app.post(
    '/sync-github',
    {
      preHandler: validateRequest(SyncGitHubReleaseSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;

      if (body.tag) {
        // 同步指定 tag 的 release
        await syncService.syncReleaseByTag(body.tag);
        return sendSuccess(reply, {
          message: `Successfully synced release ${body.tag}`,
        });
      } else if (body.syncAll) {
        // 同步所有 releases
        const count = await syncService.syncAllReleases(body.limit);
        return sendSuccess(reply, {
          message: `Successfully synced ${count} releases`,
          count,
        });
      } else {
        // 同步最新 release
        await syncService.syncLatestRelease();
        return sendSuccess(reply, {
          message: 'Successfully synced latest release',
        });
      }
    }
  );
}