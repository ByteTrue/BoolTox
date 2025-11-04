import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { logsService } from './logs.service';
import { sendSuccess } from '../../common/response.util';
import {
  LogIngestRequestSchema,
  LogQueryParamsSchema,
  LogStatsQuerySchema,
  CleanupLogsSchema,
} from './logs.schema';
import { logger } from '../../common/logger.service';

/**
 * 注册日志相关路由
 */
export async function registerLogsRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/logs - 上传日志（客户端）
   */
  fastify.post('/api/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = LogIngestRequestSchema.parse(request.body);
      const result = await logsService.uploadLogs(data);
      return sendSuccess(reply, result, 201);
    } catch (error) {
      logger.error({ error }, 'Failed to upload logs');
      throw error;
    }
  });

  /**
   * GET /api/logs - 查询日志（管理端）
   */
  fastify.get('/api/logs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = LogQueryParamsSchema.parse(request.query);
      const result = await logsService.queryLogs(params);
      return sendSuccess(reply, result);
    } catch (error) {
      logger.error({ error }, 'Failed to query logs');
      throw error;
    }
  });

  /**
   * GET /api/logs/stats - 获取日志统计（管理端）
   */
  fastify.get('/api/logs/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = LogStatsQuerySchema.parse(request.query);
      const stats = await logsService.getLogStats(params);
      return sendSuccess(reply, stats);
    } catch (error) {
      logger.error({ error }, 'Failed to get log stats');
      throw error;
    }
  });

  /**
   * GET /api/logs/errors - 获取错误日志（管理端）
   */
  fastify.get('/api/logs/errors', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = LogQueryParamsSchema.parse(request.query);
      const result = await logsService.getErrorLogs(params);
      return sendSuccess(reply, result);
    } catch (error) {
      logger.error({ error }, 'Failed to get error logs');
      throw error;
    }
  });

  /**
   * GET /api/logs/client/:clientIdentifier - 获取特定客户端的最新日志
   */
  fastify.get(
    '/api/logs/client/:clientIdentifier',
    async (request: FastifyRequest<{ Params: { clientIdentifier: string } }>, reply: FastifyReply) => {
      try {
        const { clientIdentifier } = request.params;
        const limit = request.query && typeof request.query === 'object' && 'limit' in request.query
          ? Number(request.query.limit)
          : 100;
        const logs = await logsService.getLatestLogsByClient(clientIdentifier, limit);
        return sendSuccess(reply, logs);
      } catch (error) {
        logger.error({ error }, 'Failed to get logs by client');
        throw error;
      }
    }
  );

  /**
   * DELETE /api/logs/cleanup - 清理旧日志（管理端）
   */
  fastify.delete('/api/logs/cleanup', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = CleanupLogsSchema.parse(request.query);
      const result = await logsService.deleteOldLogs(params.days);
      return sendSuccess(reply, result);
    } catch (error) {
      logger.error({ error }, 'Failed to cleanup logs');
      throw error;
    }
  });

  logger.info('Logs routes registered');
}