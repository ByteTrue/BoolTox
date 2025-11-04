import { z } from 'zod';

/**
 * 日志级别枚举
 */
export const LogLevelEnum = z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']);

/**
 * 单条日志条目 Schema（解码前）
 */
export const DecodedLogEntrySchema = z.object({
  level: LogLevelEnum,
  namespace: z.string().min(1).max(200),
  message: z.string().min(1).max(10000),
  args: z.array(z.unknown()).optional(),
  context: z.record(z.unknown()).optional(),
  timestamp: z.number().int().positive(),
});

export type DecodedLogEntry = z.infer<typeof DecodedLogEntrySchema>;

/**
 * 日志上传元数据 Schema
 */
export const LogMetadataSchema = z.object({
  appVersion: z.string().min(1).max(50),
  mode: z.string().max(50).optional(),
  batchSize: z.number().int().positive().max(1000),
  userAgent: z.string().max(500).optional(),
  locale: z.string().max(20).optional(),
  timestamp: z.number().int().positive(),
});

export type LogMetadata = z.infer<typeof LogMetadataSchema>;

/**
 * 日志上传请求 Schema
 */
export const LogIngestRequestSchema = z.object({
  clientIdentifier: z.string().min(1).max(100),
  payload: z.string().min(1), // Base64 encoded
  checksum: z.string().optional(), // SHA-256
  metadata: LogMetadataSchema,
});

export type LogIngestRequest = z.infer<typeof LogIngestRequestSchema>;

/**
 * 日志查询参数 Schema
 */
export const LogQueryParamsSchema = z.object({
  clientIdentifier: z.string().optional(),
  level: LogLevelEnum.optional(),
  namespace: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type LogQueryParams = z.infer<typeof LogQueryParamsSchema>;

/**
 * 日志统计查询参数 Schema
 */
export const LogStatsQuerySchema = z.object({
  clientIdentifier: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type LogStatsQuery = z.infer<typeof LogStatsQuerySchema>;

/**
 * 清理旧日志参数 Schema
 */
export const CleanupLogsSchema = z.object({
  days: z.coerce.number().int().positive().min(1).max(365).default(30),
});

export type CleanupLogsInput = z.infer<typeof CleanupLogsSchema>;