import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockPrismaClient } from '../../../__tests__/mockData/prisma.mock';

// Mock prisma - must be before imports that use it
vi.mock('../../../common/prisma.service', () => ({
  prisma: mockPrismaClient,
}));

import { announcementsService } from '../announcements.service';

describe('AnnouncementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listAnnouncements', () => {
    it('应该返回公告列表和分页信息', async () => {
      const mockAnnouncements = [
        {
          id: 'ann1',
          title: 'Test Announcement 1',
          content: 'Content 1',
          type: 'ANNOUNCEMENT',
          priority: 0,
          status: 'PUBLISHED',
          publishAt: new Date('2024-01-01'),
          expireAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
        {
          id: 'ann2',
          title: 'Test Announcement 2',
          content: 'Content 2',
          type: 'UPDATE',
          priority: 5,
          status: 'PUBLISHED',
          publishAt: new Date('2024-01-02'),
          expireAt: null,
          createdAt: new Date('2024-01-02'),
          updatedAt: new Date('2024-01-02'),
        },
      ];

      mockPrismaClient.announcement.findMany.mockResolvedValue(mockAnnouncements as any);
      mockPrismaClient.announcement.count.mockResolvedValue(2);

      const result = await announcementsService.listAnnouncements({
        page: 1,
        limit: 10,
        sortBy: 'publishAt',
        sortOrder: 'desc',
      });

      expect(result.items).toHaveLength(2);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });

    it('应该支持类型过滤', async () => {
      mockPrismaClient.announcement.findMany.mockResolvedValue([]);
      mockPrismaClient.announcement.count.mockResolvedValue(0);

      await announcementsService.listAnnouncements({
        type: 'UPDATE',
        page: 1,
        limit: 10,
        sortBy: 'publishAt',
        sortOrder: 'desc',
      });

      expect(mockPrismaClient.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ type: 'UPDATE' }),
        })
      );
    });

    it('应该支持状态过滤', async () => {
      mockPrismaClient.announcement.findMany.mockResolvedValue([]);
      mockPrismaClient.announcement.count.mockResolvedValue(0);

      await announcementsService.listAnnouncements({
        status: 'PUBLISHED',
        page: 1,
        limit: 10,
        sortBy: 'publishAt',
        sortOrder: 'desc',
      });

      expect(mockPrismaClient.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'PUBLISHED' }),
        })
      );
    });
  });

  describe('getActiveAnnouncements', () => {
    it('应该返回所有活跃的公告', async () => {
      const mockActiveAnnouncements = [
        {
          id: 'ann1',
          title: 'Active Announcement',
          content: 'Content',
          type: 'ANNOUNCEMENT',
          priority: 10,
          status: 'PUBLISHED',
          publishAt: new Date('2024-01-01'),
          expireAt: null,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01'),
        },
      ];

      mockPrismaClient.announcement.findMany.mockResolvedValue(mockActiveAnnouncements as any);

      const result = await announcementsService.getActiveAnnouncements();

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('PUBLISHED');
      expect(mockPrismaClient.announcement.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
          }),
          orderBy: [{ priority: 'desc' }, { publishAt: 'desc' }],
        })
      );
    });
  });

  describe('getAnnouncementById', () => {
    it('应该返回指定 ID 的公告', async () => {
      const mockAnnouncement = {
        id: 'ann1',
        title: 'Test Announcement',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'PUBLISHED',
        publishAt: new Date('2024-01-01'),
        expireAt: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockAnnouncement as any);

      const result = await announcementsService.getAnnouncementById('ann1');

      expect(result.id).toBe('ann1');
      expect(result.title).toBe('Test Announcement');
    });

    it('如果公告不存在应该抛出错误', async () => {
      mockPrismaClient.announcement.findUnique.mockResolvedValue(null);

      await expect(announcementsService.getAnnouncementById('nonexistent')).rejects.toThrow(
        'Announcement not found'
      );
    });
  });

  describe('createAnnouncement', () => {
    it('应该创建新公告', async () => {
      const mockInput = {
        title: 'New Announcement',
        content: 'New Content',
        type: 'ANNOUNCEMENT' as const,
        priority: 5,
      };

      const mockCreatedAnnouncement = {
        id: 'new-ann',
        ...mockInput,
        status: 'DRAFT',
        publishAt: null,
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.announcement.create.mockResolvedValue(mockCreatedAnnouncement as any);

      const result = await announcementsService.createAnnouncement(mockInput);

      expect(result.id).toBe('new-ann');
      expect(result.title).toBe('New Announcement');
      expect(mockPrismaClient.announcement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: 'New Announcement',
            content: 'New Content',
          }),
        })
      );
    });
  });

  describe('updateAnnouncement', () => {
    it('应该更新现有公告', async () => {
      const mockExistingAnnouncement = {
        id: 'ann1',
        title: 'Old Title',
        content: 'Old Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'DRAFT',
        publishAt: null,
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedAnnouncement = {
        ...mockExistingAnnouncement,
        title: 'Updated Title',
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockExistingAnnouncement as any);
      mockPrismaClient.announcement.update.mockResolvedValue(mockUpdatedAnnouncement as any);

      const result = await announcementsService.updateAnnouncement('ann1', {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
      expect(mockPrismaClient.announcement.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'ann1' },
          data: expect.objectContaining({ title: 'Updated Title' }),
        })
      );
    });
  });

  describe('deleteAnnouncement', () => {
    it('应该删除公告', async () => {
      const mockAnnouncement = {
        id: 'ann1',
        title: 'To Delete',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'DRAFT',
        publishAt: null,
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockAnnouncement as any);
      mockPrismaClient.announcement.delete.mockResolvedValue(mockAnnouncement as any);

      await announcementsService.deleteAnnouncement('ann1');

      expect(mockPrismaClient.announcement.delete).toHaveBeenCalledWith({
        where: { id: 'ann1' },
      });
    });
  });

  describe('publishAnnouncement', () => {
    it('应该发布草稿公告', async () => {
      const mockDraftAnnouncement = {
        id: 'ann1',
        title: 'Draft',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'DRAFT',
        publishAt: null,
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockPublishedAnnouncement = {
        ...mockDraftAnnouncement,
        status: 'PUBLISHED',
        publishAt: new Date(),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockDraftAnnouncement as any);
      mockPrismaClient.announcement.update.mockResolvedValue(mockPublishedAnnouncement as any);

      const result = await announcementsService.publishAnnouncement('ann1', {});

      expect(result.status).toBe('PUBLISHED');
      expect(result.publishAt).toBeTruthy();
    });

    it('如果公告已发布应该抛出错误', async () => {
      const mockPublishedAnnouncement = {
        id: 'ann1',
        title: 'Published',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'PUBLISHED',
        publishAt: new Date(),
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockPublishedAnnouncement as any);

      await expect(announcementsService.publishAnnouncement('ann1', {})).rejects.toThrow(
        'Announcement is already published'
      );
    });
  });

  describe('unpublishAnnouncement', () => {
    it('应该撤回已发布的公告', async () => {
      const mockPublishedAnnouncement = {
        id: 'ann1',
        title: 'Published',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'PUBLISHED',
        publishAt: new Date(),
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUnpublishedAnnouncement = {
        ...mockPublishedAnnouncement,
        status: 'DRAFT',
        publishAt: null,
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockPublishedAnnouncement as any);
      mockPrismaClient.announcement.update.mockResolvedValue(mockUnpublishedAnnouncement as any);

      const result = await announcementsService.unpublishAnnouncement('ann1');

      expect(result.status).toBe('DRAFT');
      expect(result.publishAt).toBeNull();
    });

    it('如果公告未发布应该抛出错误', async () => {
      const mockDraftAnnouncement = {
        id: 'ann1',
        title: 'Draft',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'DRAFT',
        publishAt: null,
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockDraftAnnouncement as any);

      await expect(announcementsService.unpublishAnnouncement('ann1')).rejects.toThrow(
        'Announcement is not published'
      );
    });
  });

  describe('expireAnnouncement', () => {
    it('应该将公告设置为过期', async () => {
      const mockAnnouncement = {
        id: 'ann1',
        title: 'Active',
        content: 'Content',
        type: 'ANNOUNCEMENT',
        priority: 0,
        status: 'PUBLISHED',
        publishAt: new Date(),
        expireAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockExpiredAnnouncement = {
        ...mockAnnouncement,
        status: 'EXPIRED',
        expireAt: new Date(),
      };

      mockPrismaClient.announcement.findUnique.mockResolvedValue(mockAnnouncement as any);
      mockPrismaClient.announcement.update.mockResolvedValue(mockExpiredAnnouncement as any);

      const result = await announcementsService.expireAnnouncement('ann1');

      expect(result.status).toBe('EXPIRED');
      expect(result.expireAt).toBeTruthy();
    });
  });
});