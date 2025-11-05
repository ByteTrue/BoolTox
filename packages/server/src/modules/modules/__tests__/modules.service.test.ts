import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrismaClient,
  mockModule,
  mockModuleWithVersions,
  mockFeaturedModule,
  mockDeprecatedModule,
  mockModuleVersion,
  mockModuleVersionNew,
} from '../../../__tests__/mockData/prisma.mock';
import { AppError, ErrorCode } from '../../../common/error.handler';

// Mock prisma - must be before imports that use it
vi.mock('../../../common/prisma.service', () => ({
  prisma: mockPrismaClient,
}));

import { ModulesService } from '../modules.service';

describe('ModulesService', () => {
  let service: ModulesService;

  beforeEach(() => {
    service = new ModulesService();
    vi.clearAllMocks();
  });

  describe('listModules', () => {
    const query = {
      page: 1,
      limit: 10,
      sortBy: 'createdAt' as const,
      sortOrder: 'desc' as const,
    };

    it('should list modules with pagination', async () => {
      const modules = [mockModule, mockFeaturedModule];
      mockPrismaClient.module.findMany.mockResolvedValueOnce(modules);
      mockPrismaClient.module.count.mockResolvedValueOnce(25);

      const result = await service.listModules(query);

      expect(result.modules).toEqual(modules);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(3);
    });

    it('should filter by category', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.listModules({ ...query, category: 'Productivity' });

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ category: 'Productivity' }),
        })
      );
    });

    it('should filter by featured status', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockFeaturedModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.listModules({ ...query, featured: true });

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ featured: true }),
        })
      );
    });

    it('should filter by status', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.listModules({ ...query, status: 'ACTIVE' });

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      );
    });

    it('should search modules by keyword', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.listModules({ ...query, search: 'test' });

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.anything() }),
              expect.objectContaining({ displayName: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('should support different sort options', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.listModules({ ...query, sortBy: 'downloads', sortOrder: 'asc' });

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { downloads: 'asc' },
        })
      );
    });
  });

  describe('getModuleById', () => {
    const id = 'module-123';

    it('should return module with versions', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModuleWithVersions);

      const result = await service.getModuleById(id);

      expect(result).toEqual(mockModuleWithVersions);
      expect(mockPrismaClient.module.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: {
          versions: {
            orderBy: { publishedAt: 'desc' },
            take: 10,
          },
        },
      });
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.getModuleById(id)).rejects.toThrow(AppError);
      await expect(service.getModuleById(id)).rejects.toThrow('not found');
    });
  });

  describe('getModuleVersions', () => {
    const id = 'module-123';

    it('should return all versions for a module', async () => {
      const versions = [mockModuleVersion, mockModuleVersionNew];
      mockPrismaClient.module.findUnique.mockResolvedValueOnce({ id });
      mockPrismaClient.moduleVersion.findMany.mockResolvedValueOnce(versions);

      const result = await service.getModuleVersions(id);

      expect(result).toEqual(versions);
      expect(mockPrismaClient.moduleVersion.findMany).toHaveBeenCalledWith({
        where: { moduleId: id },
        orderBy: { publishedAt: 'desc' },
      });
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.getModuleVersions(id)).rejects.toThrow(AppError);
    });
  });

  describe('incrementDownloadCount', () => {
    const id = 'module-123';

    it('should increment download count', async () => {
      const updatedModule = { ...mockModule, downloads: 101 };
      mockPrismaClient.module.update.mockResolvedValueOnce(updatedModule);

      const result = await service.incrementDownloadCount(id);

      expect(result.downloads).toBe(101);
      expect(mockPrismaClient.module.update).toHaveBeenCalledWith({
        where: { id },
        data: { downloads: { increment: 1 } },
        select: { id: true, downloads: true },
      });
    });
  });

  describe('searchModules', () => {
    const keyword = 'test';

    it('should search active modules by keyword', async () => {
      const modules = [mockModule];
      mockPrismaClient.module.findMany.mockResolvedValueOnce(modules);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      const result = await service.searchModules(keyword);

      expect(result.modules).toEqual(modules);
      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'ACTIVE',
            OR: expect.any(Array),
          }),
        })
      );
    });

    it('should filter search by category', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([mockModule]);
      mockPrismaClient.module.count.mockResolvedValueOnce(1);

      await service.searchModules(keyword, 'Productivity');

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'Productivity',
          }),
        })
      );
    });

    it('should sort by featured and downloads', async () => {
      mockPrismaClient.module.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.module.count.mockResolvedValueOnce(0);

      await service.searchModules(keyword);

      expect(mockPrismaClient.module.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ featured: 'desc' }, { downloads: 'desc' }],
        })
      );
    });
  });

  describe('getModuleDownloadUrl', () => {
    const id = 'module-123';

    it('should return download info for latest version', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(mockModuleVersion);

      const result = await service.getModuleDownloadUrl(id);

      expect(result.module.id).toBe(id);
      expect(result.version.version).toBe('1.0.0');
      expect(typeof result.version.sizeBytes).toBe('number');
    });

    it('should return download info for specific version', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(mockModuleVersionNew);

      const result = await service.getModuleDownloadUrl(id, '1.1.0');

      expect(result.version.version).toBe('1.1.0');
      expect(mockPrismaClient.moduleVersion.findUnique).toHaveBeenCalledWith({
        where: {
          moduleId_version: {
            moduleId: id,
            version: '1.1.0',
          },
        },
      });
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.getModuleDownloadUrl(id)).rejects.toThrow(AppError);
    });

    it('should throw error if module is not active', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValue(mockDeprecatedModule);

      await expect(service.getModuleDownloadUrl(mockDeprecatedModule.id)).rejects.toThrow(
        AppError
      );
    });

    it('should throw error if version not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(null);

      await expect(service.getModuleDownloadUrl(id, '2.0.0')).rejects.toThrow(AppError);
    });

    it('should convert BigInt sizeBytes to number', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(mockModuleVersion);

      const result = await service.getModuleDownloadUrl(id);

      expect(typeof result.version.sizeBytes).toBe('number');
    });
  });

  describe('createModule', () => {
    const input = {
      name: 'new-module',
      displayName: 'New Module',
      description: 'A brand new module for testing',
      author: 'Test Author',
      category: 'Utility',
      keywords: ['new', 'utility'],
      currentVersion: '1.0.0',
      featured: false,
    };

    it('should create a new module', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.module.create.mockResolvedValueOnce(mockModule);

      const result = await service.createModule(input);

      expect(result).toEqual(mockModule);
      expect(mockPrismaClient.module.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: input.name,
          status: 'ACTIVE',
        }),
      });
    });

    it('should throw error if module name already exists', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValue(mockModule);

      await expect(service.createModule(input)).rejects.toThrow(AppError);
    });
  });

  describe('updateModule', () => {
    const id = 'module-123';
    const input = {
      displayName: 'Updated Module',
      description: 'Updated description',
      featured: true,
    };

    it('should update an existing module', async () => {
      const updatedModule = { ...mockModule, ...input };
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.module.update.mockResolvedValueOnce(updatedModule);

      const result = await service.updateModule(id, input);

      expect(result.displayName).toBe('Updated Module');
      expect(mockPrismaClient.module.update).toHaveBeenCalledWith({
        where: { id },
        data: input,
      });
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateModule(id, input)).rejects.toThrow(AppError);
    });
  });

  describe('deleteModule', () => {
    const id = 'module-123';

    it('should delete an existing module', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.module.delete.mockResolvedValueOnce(mockModule);

      await service.deleteModule(id);

      expect(mockPrismaClient.module.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteModule(id)).rejects.toThrow(AppError);
    });
  });

  describe('createModuleVersion', () => {
    const moduleId = 'module-123';
    const input = {
      version: '1.1.0',
      changelog: 'New features added',
      bundleUrl: 'https://example.com/module-1.1.0.js',
      checksum: 'def456',
      sizeBytes: 2097152,
      minAppVersion: '1.0.0',
    };

    it('should create a new module version', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.moduleVersion.create.mockResolvedValueOnce(mockModuleVersionNew);
      mockPrismaClient.module.update.mockResolvedValueOnce({
        ...mockModule,
        currentVersion: '1.1.0',
      });

      const result = await service.createModuleVersion(moduleId, input);

      expect(result).toEqual(mockModuleVersionNew);
      expect(mockPrismaClient.module.update).toHaveBeenCalledWith({
        where: { id: moduleId },
        data: { currentVersion: input.version },
      });
    });

    it('should convert sizeBytes to BigInt', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.moduleVersion.create.mockResolvedValueOnce(mockModuleVersionNew);
      mockPrismaClient.module.update.mockResolvedValueOnce(mockModule);

      await service.createModuleVersion(moduleId, input);

      const createCall = mockPrismaClient.moduleVersion.create.mock.calls[0][0];
      expect(typeof createCall.data.sizeBytes).toBe('bigint');
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.createModuleVersion(moduleId, input)).rejects.toThrow(AppError);
    });

    it('should throw error if version already exists', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValue(mockModule);
      mockPrismaClient.moduleVersion.findUnique.mockResolvedValue(mockModuleVersion);

      await expect(service.createModuleVersion(moduleId, input)).rejects.toThrow(AppError);
    });
  });

  describe('getModuleStats', () => {
    const id = 'module-123';

    it('should return module statistics', async () => {
      const moduleWithCount = {
        ...mockModule,
        _count: { versions: 5 },
      };
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(moduleWithCount);

      const result = await service.getModuleStats(id);

      expect(result.id).toBe(id);
      expect(result.downloads).toBe(100);
      expect(result.rating).toBe(4.5);
      expect(result.versionCount).toBe(5);
    });

    it('should throw error if module not found', async () => {
      mockPrismaClient.module.findUnique.mockResolvedValueOnce(null);

      await expect(service.getModuleStats(id)).rejects.toThrow(AppError);
    });
  });

  describe('error handling', () => {
    it('should propagate AppError', async () => {
      mockPrismaClient.module.findUnique.mockRejectedValueOnce(
        new AppError(ErrorCode.DATABASE_ERROR, 'Database error', 500)
      );

      await expect(service.getModuleById('test-id')).rejects.toThrow(AppError);
    });

    it('should handle database errors in listModules', async () => {
      mockPrismaClient.module.findMany.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(
        service.listModules({
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })
      ).rejects.toThrow();
    });
  });
});