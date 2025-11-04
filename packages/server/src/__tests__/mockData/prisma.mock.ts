import { vi } from 'vitest';

/**
 * Mock Prisma Client for testing
 */
export const mockPrismaClient = {
  release: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  releaseAsset: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  module: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  moduleVersion: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  announcement: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  clientLog: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
  },
  $transaction: vi.fn((callback) => callback(mockPrismaClient)),
};

/**
 * Export as prismaMock for compatibility
 */
export const prismaMock = mockPrismaClient;

/**
 * Mock Release data
 */
export const mockRelease = {
  id: 'release-123',
  version: '1.0.0',
  channel: 'STABLE',
  notes: 'Initial release',
  mandatory: false,
  rolloutPercent: 100,
  publishedAt: new Date('2024-01-01T00:00:00Z'),
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
  assets: [
    {
      id: 'asset-123',
      releaseId: 'release-123',
      platform: 'WINDOWS',
      architecture: 'X64',
      downloadUrl: 'https://example.com/app.exe',
      checksum: 'abc123',
      signature: null,
      sizeBytes: BigInt(52428800),
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
};

export const mockReleaseWithoutAssets = {
  ...mockRelease,
  assets: [],
};

export const mockNewerRelease = {
  ...mockRelease,
  id: 'release-456',
  version: '1.1.0',
  publishedAt: new Date('2024-02-01T00:00:00Z'),
  assets: [
    {
      ...mockRelease.assets[0],
      id: 'asset-456',
      releaseId: 'release-456',
    },
  ],
};

export const mockBetaRelease = {
  ...mockRelease,
  id: 'release-beta',
  version: '1.2.0-beta.1',
  channel: 'BETA',
  assets: [
    {
      ...mockRelease.assets[0],
      id: 'asset-beta',
      releaseId: 'release-beta',
    },
  ],
};

export const mockRolloutRelease = {
  ...mockRelease,
  id: 'release-rollout',
  version: '1.3.0',
  rolloutPercent: 50,
  assets: [
    {
      ...mockRelease.assets[0],
      id: 'asset-rollout',
      releaseId: 'release-rollout',
    },
  ],
};
/**
 * Mock Module data
 */
export const mockModule = {
  id: 'module-123',
  name: 'test-module',
  displayName: 'Test Module',
  description: 'A test module for unit testing',
  author: 'Test Author',
  category: 'Productivity',
  keywords: ['test', 'productivity'],
  currentVersion: '1.0.0',
  downloads: 100,
  rating: 4.5,
  featured: false,
  status: 'ACTIVE',
  createdAt: new Date('2024-01-01T00:00:00Z'),
  updatedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockModuleWithVersions = {
  ...mockModule,
  versions: [
    {
      id: 'version-123',
      moduleId: 'module-123',
      version: '1.0.0',
      changelog: 'Initial release',
      bundleUrl: 'https://example.com/test-module-1.0.0.js',
      checksum: 'abc123',
      sizeBytes: BigInt(1048576),
      minAppVersion: '0.9.0',
      publishedAt: new Date('2024-01-01T00:00:00Z'),
    },
  ],
};

export const mockFeaturedModule = {
  ...mockModule,
  id: 'module-456',
  name: 'featured-module',
  displayName: 'Featured Module',
  featured: true,
  downloads: 1000,
  rating: 5.0,
};

export const mockDeprecatedModule = {
  ...mockModule,
  id: 'module-789',
  name: 'deprecated-module',
  displayName: 'Deprecated Module',
  status: 'DEPRECATED',
};

export const mockModuleVersion = {
  id: 'version-123',
  moduleId: 'module-123',
  version: '1.0.0',
  changelog: 'Initial release',
  bundleUrl: 'https://example.com/test-module-1.0.0.js',
  checksum: 'abc123',
  sizeBytes: BigInt(1048576),
  minAppVersion: '0.9.0',
  publishedAt: new Date('2024-01-01T00:00:00Z'),
};

export const mockModuleVersionNew = {
  ...mockModuleVersion,
  id: 'version-456',
  version: '1.1.0',
  changelog: 'Added new features',
  publishedAt: new Date('2024-02-01T00:00:00Z'),
};