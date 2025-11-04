import { prisma } from '../../common/prisma.service';
import { logger } from '../../common/logger.service';
import { AppError, ErrorCode } from '../../common/error.handler';
import type {
  LogIngestRequest,
  LogQueryParams,
  LogStatsQuery,
  DecodedLogEntry,
} from './logs.schema';
import { createHash } from 'crypto';

/**
 * 日志服务
 */
export class LogsService {
  /**
   * 批量上传日志
   */
  async uploadLogs(request: LogIngestRequest): Promise<{ received: number; inserted: number }> {
    try {
      // 验证 checksum（如果提供）
      if (request.checksum) {
        const calculatedChecksum = createHash('sha256').update(request.payload).digest('hex');
        if (calculatedChecksum !== request.checksum) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, 'Checksum mismatch', 400);
        }
      }

      // 解码 Base64 payload
      let decodedPayload: DecodedLogEntry[];
      try {
        const jsonString = Buffer.from(request.payload, 'base64').toString('utf-8');
        decodedPayload = JSON.parse(jsonString);
      } catch (error) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid payload format', 400);
      }

      // 验证批次大小
      if (decodedPayload.length !== request.metadata.batchSize) {
        logger.warn(
          { expected: request.metadata.batchSize, actual: decodedPayload.length },
          'Batch size mismatch'
        );
      }

      // 批量插入日志
      const logEntries = decodedPayload.map((entry) => ({
        clientIdentifier: request.clientIdentifier,
        level: entry.level,
        namespace: entry.namespace,
        message: entry.message,
        args: entry.args ? JSON.parse(JSON.stringify(entry.args)) : null,
        context: entry.context ? JSON.parse(JSON.stringify(entry.context)) : null,
        appVersion: request.metadata.appVersion,
        platform: request.metadata.userAgent || null,
        timestamp: new Date(entry.timestamp),
      }));

      const result = await prisma.clientLog.createMany({
        data: logEntries,
        skipDuplicates: true,
      });

      logger.info(
        {
          clientIdentifier: request.clientIdentifier,
          received: decodedPayload.length,
          inserted: result.count,
        },
        'Uploaded client logs'
      );

      return {
        received: decodedPayload.length,
        inserted: result.count,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, clientIdentifier: request.clientIdentifier }, 'Failed to upload logs');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to upload logs', 500);
    }
  }

  /**
   * 查询日志（带分页和过滤）
   */
  async queryLogs(params: LogQueryParams) {
    const { clientIdentifier, level, namespace, startDate, endDate, page, limit, sortOrder } =
      params;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};

      if (clientIdentifier) where.clientIdentifier = clientIdentifier;
      if (level) where.level = level;
      if (namespace) where.namespace = { contains: namespace, mode: 'insensitive' };
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const [items, total] = await Promise.all([
        prisma.clientLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { timestamp: sortOrder },
        }),
        prisma.clientLog.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(
        { count: items.length, total, page, totalPages, filters: params },
        'Queried client logs'
      );

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to query logs');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to query logs', 500);
    }
  }

  /**
   * 获取日志统计
   */
  async getLogStats(params: LogStatsQuery) {
    const { clientIdentifier, startDate, endDate } = params;

    try {
      const where: any = {};

      if (clientIdentifier) where.clientIdentifier = clientIdentifier;
      if (startDate || endDate) {
        where.receivedAt = {};
        if (startDate) where.receivedAt.gte = new Date(startDate);
        if (endDate) where.receivedAt.lte = new Date(endDate);
      }

      // 按级别统计
      const levelStats = await prisma.clientLog.groupBy({
        by: ['level'],
        where,
        _count: { id: true },
      });

      // 按客户端统计
      const clientStats = await prisma.clientLog.groupBy({
        by: ['clientIdentifier'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // 按命名空间统计
      const namespaceStats = await prisma.clientLog.groupBy({
        by: ['namespace'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      });

      // 总数
      const total = await prisma.clientLog.count({ where });

      logger.info({ total, filters: params }, 'Retrieved log stats');

      return {
        total,
        byLevel: levelStats.map((s: any) => ({
          level: s.level,
          count: s._count.id,
        })),
        byClient: clientStats.map((s: any) => ({
          clientIdentifier: s.clientIdentifier,
          count: s._count.id,
        })),
        byNamespace: namespaceStats.map((s: any) => ({
          namespace: s.namespace,
          count: s._count.id,
        })),
      };
    } catch (error) {
      logger.error({ error, params }, 'Failed to get log stats');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get log stats', 500);
    }
  }

  /**
   * 获取错误日志
   */
  async getErrorLogs(params: LogQueryParams) {
    try {
      // 强制设置 level 为 ERROR
      const errorParams = { ...params, level: 'ERROR' as const };
      return await this.queryLogs(errorParams);
    } catch (error) {
      logger.error({ error, params }, 'Failed to get error logs');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get error logs', 500);
    }
  }

  /**
   * 清理旧日志
   */
  async deleteOldLogs(days: number): Promise<{ deleted: number }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await prisma.clientLog.deleteMany({
        where: {
          receivedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info({ days, cutoffDate, deleted: result.count }, 'Deleted old logs');

      return {
        deleted: result.count,
      };
    } catch (error) {
      logger.error({ error, days }, 'Failed to delete old logs');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete old logs', 500);
    }
  }

  /**
   * 获取特定客户端的最新日志
   */
  async getLatestLogsByClient(clientIdentifier: string, limit: number = 100) {
    try {
      const logs = await prisma.clientLog.findMany({
        where: { clientIdentifier },
        orderBy: { timestamp: 'desc' },
        take: limit,
      });

      logger.info({ clientIdentifier, count: logs.length }, 'Retrieved latest logs by client');

      return logs;
    } catch (error) {
      logger.error({ error, clientIdentifier }, 'Failed to get latest logs');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get latest logs', 500);
    }
  }
}

export const logsService = new LogsService();