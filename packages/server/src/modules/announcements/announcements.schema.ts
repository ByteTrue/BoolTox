import { z } from 'zod';

/**
 * 公告类型枚举
 */
export const AnnouncementTypeEnum = z.enum([
  'ANNOUNCEMENT',
  'UPDATE',
  'NOTICE',
  'MAINTENANCE',
]);

/**
 * 公告状态枚举
 */
export const AnnouncementStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'EXPIRED']);

/**
 * 公告列表查询参数 Schema
 */
export const AnnouncementListQuerySchema = z.object({
  type: AnnouncementTypeEnum.optional(),
  status: AnnouncementStatusEnum.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['priority', 'publishAt', 'createdAt', 'updatedAt']).default('publishAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type AnnouncementListQuery = z.infer<typeof AnnouncementListQuerySchema>;

/**
 * 公告 ID 参数 Schema
 */
export const AnnouncementIdParamSchema = z.object({
  id: z.string().cuid(),
});

export type AnnouncementIdParam = z.infer<typeof AnnouncementIdParamSchema>;

/**
 * 创建公告 Schema
 */
export const CreateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  type: AnnouncementTypeEnum.default('ANNOUNCEMENT'),
  priority: z.number().int().min(0).max(100).default(0),
  publishAt: z.string().datetime().optional(),
  expireAt: z.string().datetime().optional(),
});

export type CreateAnnouncementInput = z.infer<typeof CreateAnnouncementSchema>;

/**
 * 更新公告 Schema
 */
export const UpdateAnnouncementSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  type: AnnouncementTypeEnum.optional(),
  priority: z.number().int().min(0).max(100).optional(),
  publishAt: z.string().datetime().optional().nullable(),
  expireAt: z.string().datetime().optional().nullable(),
});

export type UpdateAnnouncementInput = z.infer<typeof UpdateAnnouncementSchema>;

/**
 * 发布公告 Schema
 */
export const PublishAnnouncementSchema = z.object({
  publishAt: z.string().datetime().optional(),
});

export type PublishAnnouncementInput = z.infer<typeof PublishAnnouncementSchema>;