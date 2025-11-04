import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrismaClient } from '../../../__tests__/mockData/prisma.mock';

// Mock prisma - must be before imports that use it
vi.mock('../../../common/prisma.service', () => ({
  prisma: mockPrismaClient,
}));

import { logsService } from '../logs.service';

describe('LogsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadLogs', () => {
    it('应该成功上传日志', async () => {
      const mockRequest = {
        clientIdentifier: 'test-client-123',
        payload: Buffer.from(
          JSON.stringify([
            {
              level: 'INFO',
              namespace: 'app',
              message: 'Test log message',
              timestamp: Date.now(),
            },
          ])
        ).toString('base64'),
        metadata: {
          appVersion: '1.0.0',
          batchSize: 1,
          timestamp: Date.now(),
        },
      };

      mockPrismaClient.clientLog.createMany.mockResolvedValue({ count: 1 });

      const result = await logsService.uploadLogs(mockRequest);

      expect(result.received).toBe(1);
      expect(result.inserted).toBe(1);
      expect(mockPrismaClient.clientLog.createMany).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.arrayContaining([
            expect.objectContaining({
              clientIdentifier: 'test-client-123',
              level: 'INFO',
              namespace: 'app',
              message: 'Test log message',
            }),
          ]),
        })
      );
    });

    it('应该验证 checksum', async () => {
      const payload = JSON.stringify([
        {
          level: 'INFO',
          namespace: 'app',
          message: 'Test',
          timestamp: Date.now(),
        },
      ]);
      const base64Payload = Buffer.from(payload).toString('base64');
      const crypto = await import('crypto');
      const checksum = crypto.createHash('sha256').update(base64Payload).digest('hex');

      const mockRequest = {
        clientIdentifier: 'test-client',
        payload: base64Payload,
        checksum,
        metadata: {
          appVersion: '1.0.0',
          batchSize: 1,
          timestamp: Date.now(),
        },
      };

      mockPrismaClient.clientLog.createMany.mockResolvedValue({ count: 1 });

      const result = await logsService.uploadLogs(mockRequest);

      expect(result.received).toBe(1);
    });

    it('如果 checksum 不匹配应该抛出错误', async () => {
      const mockRequest = {
        clientIdentifier: 'test-client',
        payload: Buffer.from(JSON.stringify([{ level: 'INFO', namespace: 'app', message: 'Test', timestamp: Date.now() }])).toString('base64'),
        checksum: 'invalid-checksum',
        metadata: {
          appVersion: '1.0.0',
          batchSize: 1,
          timestamp: Date.now(),
        },
      };

      await expect(logsService.uploadLogs(mockRequest)).rejects.toThrow('Checksum mismatch');
    });

    it('如果 payload 格式无效应该抛出错误', async () => {
      const mockRequest = {
        clientIdentifier: 'test-client',
        payload: 'invalid-base64',
        metadata: {
          appVersion: '1.0.0',
          batchSize: 1,
          timestamp: Date.now(),
        },
      };

      await expect(logsService.uploadLogs(mockRequest)).rejects.toThrow();
    });
  });

  describe('queryLogs', () => {
    it('应该返回日志列表和分页信息', async () => {
      const mockLogs = [
        {
          id: 'log1',
          clientIdentifier: 'client1',
          level: 'INFO',
          namespace: 'app',
          message: 'Test message 1',
          args: null,
          context: null,
          appVersion: '1.0.0',
          platform: 'Windows',
          timestamp: new Date(),
          receivedAt: new Date(),
        },
        {
          id: 'log2',
          clientIdentifier: 'client1',
          level: 'ERROR',
          namespace: 'app',
          message: 'Test message 2',
          args: null,
          context: null,
          appVersion: '1.0.0',
          platform: 'Windows',
          timestamp: new Date(),
          receivedAt: new Date(),
        },
      ];

      mockPrismaClient.clientLog.findMany.mockResolvedValue(mockLogs as any);
      mockPrismaClient.clientLog.count.mockResolvedValue(2);

      const result = await logsService.queryLogs({
        page: 1,
        limit: 100,
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 100,
        total: 2,
        totalPages: 1,
      });
    });

    it('应该支持客户端 ID 过滤', async () => {
      mockPrismaClient.clientLog.findMany.mockResolvedValue([]);
      mockPrismaClient.clientLog.count.mockResolvedValue(0);

      await logsService.queryLogs({
        clientIdentifier: 'specific-client',
        page: 1,
        limit: 100,
        sortOrder: 'desc',
      });

      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            clientIdentifier: 'specific-client',
          }),
        })
      );
    });

    it('应该支持日志级别过滤', async () => {
      mockPrismaClient.clientLog.findMany.mockResolvedValue([]);
      mockPrismaClient.clientLog.count.mockResolvedValue(0);

      await logsService.queryLogs({
        level: 'ERROR',
        page: 1,
        limit: 100,
        sortOrder: 'desc',
      });

      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            level: 'ERROR',
          }),
        })
      );
    });

    it('应该支持时间范围过滤', async () => {
      mockPrismaClient.clientLog.findMany.mockResolvedValue([]);
      mockPrismaClient.clientLog.count.mockResolvedValue(0);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      await logsService.queryLogs({
        startDate,
        endDate,
        page: 1,
        limit: 100,
        sortOrder: 'desc',
      });

      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getLogStats', () => {
    it('应该返回日志统计信息', async () => {
      const mockLevelStats = [
        { level: 'INFO', _count: { id: 100 } },
        { level: 'ERROR', _count: { id: 10 } },
        { level: 'WARN', _count: { id: 5 } },
      ];

      const mockClientStats = [
        { clientIdentifier: 'client1', _count: { id: 80 } },
        { clientIdentifier: 'client2', _count: { id: 35 } },
      ];

      const mockNamespaceStats = [
        { namespace: 'app', _count: { id: 60 } },
        { namespace: 'module', _count: { id: 55 } },
      ];

      mockPrismaClient.clientLog.groupBy
        .mockResolvedValueOnce(mockLevelStats as any)
        .mockResolvedValueOnce(mockClientStats as any)
        .mockResolvedValueOnce(mockNamespaceStats as any);

      mockPrismaClient.clientLog.count.mockResolvedValue(115);

      const result = await logsService.getLogStats({});

      expect(result.total).toBe(115);
      expect(result.byLevel).toHaveLength(3);
      expect(result.byClient).toHaveLength(2);
      expect(result.byNamespace).toHaveLength(2);
    });

    it('应该支持时间范围过滤', async () => {
      mockPrismaClient.clientLog.groupBy.mockResolvedValue([]);
      mockPrismaClient.clientLog.count.mockResolvedValue(0);

      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';

      await logsService.getLogStats({ startDate, endDate });

      expect(mockPrismaClient.clientLog.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            receivedAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      );
    });
  });

  describe('getErrorLogs', () => {
    it('应该只返回错误级别的日志', async () => {
      const mockErrorLogs = [
        {
          id: 'log1',
          clientIdentifier: 'client1',
          level: 'ERROR',
          namespace: 'app',
          message: 'Error message',
          args: null,
          context: null,
          appVersion: '1.0.0',
          platform: 'Windows',
          timestamp: new Date(),
          receivedAt: new Date(),
        },
      ];

      mockPrismaClient.clientLog.findMany.mockResolvedValue(mockErrorLogs as any);
      mockPrismaClient.clientLog.count.mockResolvedValue(1);

      const result = await logsService.getErrorLogs({
        page: 1,
        limit: 100,
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(1);
      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            level: 'ERROR',
          }),
        })
      );
    });
  });

  describe('deleteOldLogs', () => {
    it('应该删除指定天数之前的日志', async () => {
      mockPrismaClient.clientLog.deleteMany.mockResolvedValue({ count: 50 });

      const result = await logsService.deleteOldLogs(30);

      expect(result.deleted).toBe(50);
      expect(mockPrismaClient.clientLog.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            receivedAt: {
              lt: expect.any(Date),
            },
          },
        })
      );
    });

    it('应该正确计算截止日期', async () => {
      mockPrismaClient.clientLog.deleteMany.mockResolvedValue({ count: 10 });

      await logsService.deleteOldLogs(7);

      const callArgs = mockPrismaClient.clientLog.deleteMany.mock.calls[0][0];
      const cutoffDate = callArgs.where.receivedAt.lt;
      const today = new Date();
      const expectedCutoff = new Date();
      expectedCutoff.setDate(today.getDate() - 7);

      // 允许 1 秒的误差
      expect(Math.abs(cutoffDate.getTime() - expectedCutoff.getTime())).toBeLessThan(1000);
    });
  });

  describe('getLatestLogsByClient', () => {
    it('应该返回特定客户端的最新日志', async () => {
      const mockLogs = [
        {
          id: 'log1',
          clientIdentifier: 'client1',
          level: 'INFO',
          namespace: 'app',
          message: 'Latest message',
          args: null,
          context: null,
          appVersion: '1.0.0',
          platform: 'Windows',
          timestamp: new Date(),
          receivedAt: new Date(),
        },
      ];

      mockPrismaClient.clientLog.findMany.mockResolvedValue(mockLogs as any);

      const result = await logsService.getLatestLogsByClient('client1', 50);

      expect(result).toHaveLength(1);
      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { clientIdentifier: 'client1' },
          orderBy: { timestamp: 'desc' },
          take: 50,
        })
      );
    });

    it('应该使用默认 limit 100', async () => {
      mockPrismaClient.clientLog.findMany.mockResolvedValue([]);

      await logsService.getLatestLogsByClient('client1');

      expect(mockPrismaClient.clientLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100,
        })
      );
    });
  });
});