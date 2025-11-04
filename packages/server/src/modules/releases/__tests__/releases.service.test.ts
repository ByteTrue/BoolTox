import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  mockPrismaClient,
  mockRelease,
  mockNewerRelease,
  mockReleaseWithoutAssets,
  mockRolloutRelease,
} from '../../../__tests__/mockData/prisma.mock';
import { AppError, ErrorCode } from '../../../common/error.handler';

// Mock prisma - must be before imports that use it
vi.mock('../../../common/prisma.service', () => ({
  prisma: mockPrismaClient,
}));

import { ReleasesService } from '../releases.service';

describe('ReleasesService', () => {
  let service: ReleasesService;

  beforeEach(() => {
    service = new ReleasesService();
    vi.clearAllMocks();
  });

  describe('getLatestRelease', () => {
    const query = {
      version: '0.9.0',
      platform: 'WINDOWS' as const,
      architecture: 'X64' as const,
      channel: 'STABLE' as const,
    };

    it('should return update available when newer version exists', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(mockRelease);

      const result = await service.getLatestRelease(query);

      expect(result.updateAvailable).toBe(true);
      expect(result.release).toBeDefined();
      expect(result.release?.version).toBe('1.0.0');
      expect(mockPrismaClient.release.findFirst).toHaveBeenCalledWith({
        where: {
          channel: 'STABLE',
          publishedAt: {
            not: null,
            lte: expect.any(Date),
          },
        },
        orderBy: {
          publishedAt: 'desc',
        },
        include: {
          assets: {
            where: {
              platform: 'WINDOWS',
              architecture: 'X64',
            },
          },
        },
      });
    });

    it('should return no update when already on latest version', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(mockRelease);

      const result = await service.getLatestRelease({
        ...query,
        version: '1.0.0',
      });

      expect(result.updateAvailable).toBe(false);
      expect(result.release).toBeNull();
    });

    it('should return no update when no matching release found', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(null);

      const result = await service.getLatestRelease(query);

      expect(result.updateAvailable).toBe(false);
      expect(result.release).toBeNull();
    });

    it('should return no update when release has no matching assets', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(mockReleaseWithoutAssets);

      const result = await service.getLatestRelease(query);

      expect(result.updateAvailable).toBe(false);
      expect(result.release).toBeNull();
    });

    it('should handle rollout percentage', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(mockRolloutRelease);

      const result = await service.getLatestRelease(query);

      // Result depends on hash of version, but should return boolean
      expect(typeof result.updateAvailable).toBe('boolean');
    });

    it('should convert BigInt sizeBytes to number', async () => {
      mockPrismaClient.release.findFirst.mockResolvedValueOnce(mockRelease);

      const result = await service.getLatestRelease(query);

      if (result.release) {
        expect(typeof result.release.asset.sizeBytes).toBe('number');
      }
    });
  });

  describe('createRelease', () => {
    const input = {
      version: '1.0.0',
      channel: 'STABLE' as const,
      notes: 'Initial release',
      mandatory: false,
      rolloutPercent: 100,
      assets: [
        {
          platform: 'WINDOWS' as const,
          architecture: 'X64' as const,
          downloadUrl: 'https://example.com/app.exe',
          checksum: 'abc123',
          sizeBytes: 52428800,
        },
      ],
    };

    it('should create a new release', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.release.create.mockResolvedValueOnce(mockRelease);

      const result = await service.createRelease(input);

      expect(result).toEqual(mockRelease);
      expect(mockPrismaClient.release.findUnique).toHaveBeenCalledWith({
        where: { version: '1.0.0' },
      });
      expect(mockPrismaClient.release.create).toHaveBeenCalled();
    });

    it('should throw error if release already exists', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValue(mockRelease);

      await expect(service.createRelease(input)).rejects.toThrow(AppError);
    });

    it('should convert asset sizeBytes to BigInt', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(null);
      mockPrismaClient.release.create.mockResolvedValueOnce(mockRelease);

      await service.createRelease(input);

      const createCall = mockPrismaClient.release.create.mock.calls[0][0];
      expect(typeof createCall.data.assets.create[0].sizeBytes).toBe('bigint');
    });
  });

  describe('updateRelease', () => {
    const id = 'release-123';
    const input = {
      channel: 'BETA' as const,
      notes: 'Updated notes',
      mandatory: true,
      rolloutPercent: 50,
      publishedAt: '2024-01-01T00:00:00Z',
    };

    it('should update an existing release', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(mockRelease);
      mockPrismaClient.release.update.mockResolvedValueOnce({
        ...mockRelease,
        ...input,
      });

      const result = await service.updateRelease(id, input);

      expect(result.channel).toBe('BETA');
      expect(mockPrismaClient.release.update).toHaveBeenCalledWith({
        where: { id },
        data: {
          channel: input.channel,
          notes: input.notes,
          mandatory: input.mandatory,
          rolloutPercent: input.rolloutPercent,
          publishedAt: new Date(input.publishedAt),
        },
        include: {
          assets: true,
        },
      });
    });

    it('should throw error if release not found', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(null);

      await expect(service.updateRelease(id, input)).rejects.toThrow(AppError);
      await expect(service.updateRelease(id, input)).rejects.toThrow('not found');
    });
  });

  describe('deleteRelease', () => {
    const id = 'release-123';

    it('should delete an existing release', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(mockRelease);
      mockPrismaClient.release.delete.mockResolvedValueOnce(mockRelease);

      await service.deleteRelease(id);

      expect(mockPrismaClient.release.delete).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should throw error if release not found', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(null);

      await expect(service.deleteRelease(id)).rejects.toThrow(AppError);
      await expect(service.deleteRelease(id)).rejects.toThrow('not found');
    });
  });

  describe('listReleases', () => {
    it('should list releases with pagination', async () => {
      const releases = [mockRelease, mockNewerRelease];
      mockPrismaClient.release.findMany.mockResolvedValueOnce(releases);
      mockPrismaClient.release.count.mockResolvedValueOnce(25);

      const result = await service.listReleases(undefined, 1, 20);

      expect(result.data).toEqual(releases);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 25,
        totalPages: 2,
      });
    });

    it('should filter by channel', async () => {
      mockPrismaClient.release.findMany.mockResolvedValueOnce([mockRelease]);
      mockPrismaClient.release.count.mockResolvedValueOnce(1);

      await service.listReleases('STABLE', 1, 20);

      expect(mockPrismaClient.release.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { channel: 'STABLE' },
        })
      );
    });

    it('should calculate correct pagination', async () => {
      mockPrismaClient.release.findMany.mockResolvedValueOnce([]);
      mockPrismaClient.release.count.mockResolvedValueOnce(47);

      const result = await service.listReleases(undefined, 2, 10);

      expect(result.pagination.totalPages).toBe(5);
      expect(mockPrismaClient.release.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });
  });

  describe('getReleaseById', () => {
    const id = 'release-123';

    it('should return release by ID', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(mockRelease);

      const result = await service.getReleaseById(id);

      expect(result).toEqual(mockRelease);
      expect(mockPrismaClient.release.findUnique).toHaveBeenCalledWith({
        where: { id },
        include: { assets: true },
      });
    });

    it('should throw error if release not found', async () => {
      mockPrismaClient.release.findUnique.mockResolvedValueOnce(null);

      await expect(service.getReleaseById(id)).rejects.toThrow(AppError);
      await expect(service.getReleaseById(id)).rejects.toThrow('not found');
    });
  });

  describe('hashVersion (rollout logic)', () => {
    it('should consistently hash versions for rollout', async () => {
      // Test that same version produces same hash result
      mockPrismaClient.release.findFirst.mockResolvedValue(mockRolloutRelease);

      const query = {
        version: '0.9.0',
        platform: 'WINDOWS' as const,
        architecture: 'X64' as const,
        channel: 'STABLE' as const,
      };

      const result1 = await service.getLatestRelease(query);
      const result2 = await service.getLatestRelease(query);

      // Same version should produce same result
      expect(result1.updateAvailable).toBe(result2.updateAvailable);
    });
  });

  describe('error handling', () => {
    it('should propagate AppError', async () => {
      mockPrismaClient.release.findUnique.mockRejectedValueOnce(
        new AppError(ErrorCode.DATABASE_ERROR, 'Database error', 500)
      );

      await expect(
        service.getReleaseById('test-id')
      ).rejects.toThrow(AppError);
    });

    it('should handle database errors in getLatestRelease', async () => {
      mockPrismaClient.release.findFirst.mockRejectedValueOnce(
        new Error('Database connection failed')
      );

      await expect(
        service.getLatestRelease({
          version: '1.0.0',
          platform: 'WINDOWS',
          architecture: 'X64',
          channel: 'STABLE',
        })
      ).rejects.toThrow();
    });
  });
});