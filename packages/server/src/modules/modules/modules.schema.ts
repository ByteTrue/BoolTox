import { z } from 'zod';

/**
 * 模块状态枚举
 */
export const ModuleStatusEnum = z.enum(['ACTIVE', 'DEPRECATED', 'ARCHIVED']);

/**
 * 模块列表查询参数 Schema
 */
export const ModuleListQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  featured: z.coerce.boolean().optional(),
  status: ModuleStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['downloads', 'rating', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ModuleListQuery = z.infer<typeof ModuleListQuerySchema>;

/**
 * 模块详情参数 Schema
 */
export const ModuleIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type ModuleIdParam = z.infer<typeof ModuleIdParamSchema>;

/**
 * 模块下载参数 Schema
 */
export const ModuleDownloadParamSchema = z.object({
  id: z.string().cuid(),
});

export const ModuleDownloadQuerySchema = z.object({
  version: z.string().optional(),
});

export type ModuleDownloadParam = z.infer<typeof ModuleDownloadParamSchema>;
export type ModuleDownloadQuery = z.infer<typeof ModuleDownloadQuerySchema>;

/**
 * 模块搜索查询参数 Schema
 */
export const ModuleSearchQuerySchema = z.object({
  keyword: z.string().min(1, 'Search keyword is required'),
  category: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type ModuleSearchQuery = z.infer<typeof ModuleSearchQuerySchema>;

/**
 * 创建模块 Schema
 */
export const CreateModuleSchema = z.object({
  name: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Name must be lowercase alphanumeric with hyphens'),
  displayName: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  author: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  keywords: z.array(z.string().min(1).max(50)).min(1).max(10),
  currentVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (x.y.z)'),
  featured: z.boolean().default(false),
});

export type CreateModuleInput = z.infer<typeof CreateModuleSchema>;

/**
 * 更新模块 Schema
 */
export const UpdateModuleSchema = z.object({
  displayName: z.string().min(1).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  author: z.string().min(1).max(200).optional(),
  category: z.string().min(1).max(100).optional(),
  keywords: z.array(z.string().min(1).max(50)).min(1).max(10).optional(),
  currentVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (x.y.z)').optional(),
  featured: z.boolean().optional(),
  status: ModuleStatusEnum.optional(),
});

export type UpdateModuleInput = z.infer<typeof UpdateModuleSchema>;

/**
 * 创建模块版本 Schema
 */
export const CreateModuleVersionSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (x.y.z)'),
  changelog: z.string().max(10000).optional(),
  bundleUrl: z.string().url(),
  checksum: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  minAppVersion: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must follow semver format (x.y.z)').optional(),
});

export type CreateModuleVersionInput = z.infer<typeof CreateModuleVersionSchema>;