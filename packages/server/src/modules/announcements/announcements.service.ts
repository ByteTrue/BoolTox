import { prisma } from '../../common/prisma.service';
import { logger } from '../../common/logger.service';
import { AppError, ErrorCode } from '../../common/error.handler';
import type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
  AnnouncementListQuery,
  PublishAnnouncementInput,
} from './announcements.schema';

/**
 * 公告服务
 */
export class AnnouncementsService {
  /**
   * 获取公告列表（带分页和过滤）
   */
  async listAnnouncements(query: AnnouncementListQuery) {
    const { type, status, page, limit, sortBy, sortOrder } = query;
    const skip = (page - 1) * limit;

    try {
      const where: any = {};
      if (type) where.type = type;
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        prisma.announcement.findMany({
          where,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
        }),
        prisma.announcement.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(
        { count: items.length, total, page, totalPages, filters: { type, status } },
        'Listed announcements'
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
      logger.error({ error, query }, 'Failed to list announcements');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to list announcements', 500);
    }
  }

  /**
   * 获取活跃公告（客户端使用）
   */
  async getActiveAnnouncements() {
    try {
      const now = new Date();
      const announcements = await prisma.announcement.findMany({
        where: {
          status: 'PUBLISHED',
          OR: [{ expireAt: null }, { expireAt: { gte: now } }],
          publishAt: { lte: now },
        },
        orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
      });

      logger.info({ count: announcements.length }, 'Retrieved active announcements');
      return announcements;
    } catch (error) {
      logger.error({ error }, 'Failed to get active announcements');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get active announcements', 500);
    }
  }

  /**
   * 根据 ID 获取公告详情
   */
  async getAnnouncementById(id: string) {
    try {
      const announcement = await prisma.announcement.findUnique({
        where: { id },
      });

      if (!announcement) {
        throw new AppError(ErrorCode.NOT_FOUND, 'Announcement not found', 404);
      }

      logger.info({ id }, 'Retrieved announcement');
      return announcement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to get announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to get announcement', 500);
    }
  }

  /**
   * 创建公告
   */
  async createAnnouncement(data: CreateAnnouncementInput) {
    try {
      const announcement = await prisma.announcement.create({
        data: {
          title: data.title,
          content: data.content,
          type: data.type,
          priority: data.priority,
          publishAt: data.publishAt ? new Date(data.publishAt) : null,
          expireAt: data.expireAt ? new Date(data.expireAt) : null,
        },
      });

      logger.info({ id: announcement.id, title: announcement.title }, 'Created announcement');
      return announcement;
    } catch (error) {
      logger.error({ error, data }, 'Failed to create announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to create announcement', 500);
    }
  }

  /**
   * 更新公告
   */
  async updateAnnouncement(id: string, data: UpdateAnnouncementInput) {
    try {
      // 检查公告是否存在
      await this.getAnnouncementById(id);

      const updateData: any = {};
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.type !== undefined) updateData.type = data.type;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.publishAt !== undefined) {
        updateData.publishAt = data.publishAt ? new Date(data.publishAt) : null;
      }
      if (data.expireAt !== undefined) {
        updateData.expireAt = data.expireAt ? new Date(data.expireAt) : null;
      }

      const announcement = await prisma.announcement.update({
        where: { id },
        data: updateData,
      });

      logger.info({ id, title: announcement.title }, 'Updated announcement');
      return announcement;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id, data }, 'Failed to update announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to update announcement', 500);
    }
  }

  /**
   * 删除公告
   */
  async deleteAnnouncement(id: string): Promise<void> {
    try {
      // 检查公告是否存在
      await this.getAnnouncementById(id);

      await prisma.announcement.delete({
        where: { id },
      });

      logger.info({ id }, 'Deleted announcement');
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to delete announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to delete announcement', 500);
    }
  }

  /**
   * 发布公告
   */
  async publishAnnouncement(id: string, data: PublishAnnouncementInput) {
    try {
      // 检查公告是否存在
      const announcement = await this.getAnnouncementById(id);

      if (announcement.status === 'PUBLISHED') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Announcement is already published', 400);
      }

      const publishAt = data.publishAt ? new Date(data.publishAt) : new Date();

      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          status: 'PUBLISHED',
          publishAt,
        },
      });

      logger.info({ id, publishAt }, 'Published announcement');
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id, data }, 'Failed to publish announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to publish announcement', 500);
    }
  }

  /**
   * 撤回公告
   */
  async unpublishAnnouncement(id: string) {
    try {
      // 检查公告是否存在
      const announcement = await this.getAnnouncementById(id);

      if (announcement.status !== 'PUBLISHED') {
        throw new AppError(ErrorCode.VALIDATION_ERROR, 'Announcement is not published', 400);
      }

      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          status: 'DRAFT',
          publishAt: null,
        },
      });

      logger.info({ id }, 'Unpublished announcement');
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to unpublish announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to unpublish announcement', 500);
    }
  }

  /**
   * 设置公告为过期
   */
  async expireAnnouncement(id: string) {
    try {
      // 检查公告是否存在
      await this.getAnnouncementById(id);

      const updated = await prisma.announcement.update({
        where: { id },
        data: {
          status: 'EXPIRED',
          expireAt: new Date(),
        },
      });

      logger.info({ id }, 'Expired announcement');
      return updated;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error({ error, id }, 'Failed to expire announcement');
      throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to expire announcement', 500);
    }
  }
}

export const announcementsService = new AnnouncementsService();