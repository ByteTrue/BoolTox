import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { announcementsService } from './announcements.service';
import { sendSuccess } from '../../common/response.util';
import {
  AnnouncementListQuerySchema,
  AnnouncementIdParamSchema,
  CreateAnnouncementSchema,
  UpdateAnnouncementSchema,
  PublishAnnouncementSchema,
} from './announcements.schema';
import { logger } from '../../common/logger.service';

/**
 * 注册公告相关路由
 */
export async function registerAnnouncementRoutes(fastify: FastifyInstance) {
  /**
   * GET /api/announcements - 获取公告列表（管理端）
   */
  fastify.get('/api/announcements', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = AnnouncementListQuerySchema.parse(request.query);
      const result = await announcementsService.listAnnouncements(query);
      return sendSuccess(reply, result);
    } catch (error) {
      logger.error({ error }, 'Failed to list announcements');
      throw error;
    }
  });

  /**
   * GET /api/announcements/active - 获取活跃公告（客户端）
   */
  fastify.get(
    '/api/announcements/active',
    async (_request: FastifyRequest, reply: FastifyReply) => {
      try {
        const announcements = await announcementsService.getActiveAnnouncements();
        return sendSuccess(reply, announcements);
      } catch (error) {
        logger.error({ error }, 'Failed to get active announcements');
        throw error;
      }
    }
  );

  /**
   * GET /api/announcements/:id - 获取公告详情
   */
  fastify.get(
    '/api/announcements/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        const announcement = await announcementsService.getAnnouncementById(id);
        return sendSuccess(reply, announcement);
      } catch (error) {
        logger.error({ error }, 'Failed to get announcement');
        throw error;
      }
    }
  );

  /**
   * POST /api/announcements - 创建公告（管理端）
   */
  fastify.post('/api/announcements', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = CreateAnnouncementSchema.parse(request.body);
      const announcement = await announcementsService.createAnnouncement(data);
      return sendSuccess(reply, announcement, 201);
    } catch (error) {
      logger.error({ error }, 'Failed to create announcement');
      throw error;
    }
  });

  /**
   * PATCH /api/announcements/:id - 更新公告（管理端）
   */
  fastify.patch(
    '/api/announcements/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        const data = UpdateAnnouncementSchema.parse(request.body);
        const announcement = await announcementsService.updateAnnouncement(id, data);
        return sendSuccess(reply, announcement);
      } catch (error) {
        logger.error({ error }, 'Failed to update announcement');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/announcements/:id - 删除公告（管理端）
   */
  fastify.delete(
    '/api/announcements/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        await announcementsService.deleteAnnouncement(id);
        return sendSuccess(reply, { message: 'Announcement deleted successfully' });
      } catch (error) {
        logger.error({ error }, 'Failed to delete announcement');
        throw error;
      }
    }
  );

  /**
   * POST /api/announcements/:id/publish - 发布公告（管理端）
   */
  fastify.post(
    '/api/announcements/:id/publish',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        const data = PublishAnnouncementSchema.parse(request.body || {});
        const announcement = await announcementsService.publishAnnouncement(id, data);
        return sendSuccess(reply, announcement);
      } catch (error) {
        logger.error({ error }, 'Failed to publish announcement');
        throw error;
      }
    }
  );

  /**
   * POST /api/announcements/:id/unpublish - 撤回公告（管理端）
   */
  fastify.post(
    '/api/announcements/:id/unpublish',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        const announcement = await announcementsService.unpublishAnnouncement(id);
        return sendSuccess(reply, announcement);
      } catch (error) {
        logger.error({ error }, 'Failed to unpublish announcement');
        throw error;
      }
    }
  );

  /**
   * POST /api/announcements/:id/expire - 设置公告为过期（管理端）
   */
  fastify.post(
    '/api/announcements/:id/expire',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const { id } = AnnouncementIdParamSchema.parse(request.params);
        const announcement = await announcementsService.expireAnnouncement(id);
        return sendSuccess(reply, announcement);
      } catch (error) {
        logger.error({ error }, 'Failed to expire announcement');
        throw error;
      }
    }
  );

  logger.info('Announcement routes registered');
}