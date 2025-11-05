import { z } from 'zod';

/**
 * 平台枚举
 */
export const PlatformSchema = z.enum(['WINDOWS', 'MACOS', 'LINUX']);

/**
 * 架构枚举
 */
export const ArchSchema = z.enum(['X64', 'ARM64']);

/**
 * 发布渠道枚举
 */
export const ReleaseChannelSchema = z.enum(['STABLE', 'BETA', 'ALPHA']);

/**
 * 查询最新版本的参数验证
 */
export const CheckUpdateQuerySchema = z.object({
  version: z.string().min(1, 'Version is required'),
  platform: PlatformSchema,
  architecture: ArchSchema,
  channel: ReleaseChannelSchema,
});

export type CheckUpdateQuery = z.infer<typeof CheckUpdateQuerySchema>;

/**
 * 创建 Release Asset 的 Schema
 */
export const CreateReleaseAssetSchema = z.object({
  platform: PlatformSchema,
  architecture: ArchSchema,
  downloadUrl: z.string().url('Invalid download URL'),
  checksum: z.string().min(1, 'Checksum is required'),
  signature: z.string().optional(),
  sizeBytes: z.number().int().positive('Size must be positive'),
});

/**
 * 创建版本的数据验证
 */
export const CreateReleaseSchema = z.object({
  version: z.string().min(1, 'Version is required'),
  channel: ReleaseChannelSchema.default('STABLE'),
  notes: z.string().optional(),
  mandatory: z.boolean().default(false),
  rolloutPercent: z.number().int().min(0).max(100).default(100),
  assets: z.array(CreateReleaseAssetSchema).min(1, 'At least one asset is required'),
});

export type CreateReleaseInput = z.infer<typeof CreateReleaseSchema>;

/**
 * 更新版本的数据验证
 */
export const UpdateReleaseSchema = z.object({
  channel: ReleaseChannelSchema.optional(),
  notes: z.string().optional(),
  mandatory: z.boolean().optional(),
  rolloutPercent: z.number().int().min(0).max(100).optional(),
  publishedAt: z.string().datetime().optional(),
});

export type UpdateReleaseInput = z.infer<typeof UpdateReleaseSchema>;

/**
 * 同步 GitHub Release 的参数验证
 */
export const SyncGitHubReleaseSchema = z.object({
  tag: z.string().optional(),
  syncAll: z.boolean().default(false),
  limit: z.number().int().positive().max(50).default(10),
});

export type SyncGitHubReleaseInput = z.infer<typeof SyncGitHubReleaseSchema>;

/**
 * 列出所有版本的查询参数
 */
export const ListReleasesQuerySchema = z.object({
  channel: ReleaseChannelSchema.optional(),
  page: z.string().transform(Number).pipe(z.number().int().positive()).default('1'),
  limit: z.string().transform(Number).pipe(z.number().int().positive().max(100)).default('20'),
});

export type ListReleasesQuery = z.infer<typeof ListReleasesQuerySchema>;