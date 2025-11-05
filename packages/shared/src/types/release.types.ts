/**
 * Release channel enum
 */
export enum ReleaseChannel {
  STABLE = 'STABLE',
  BETA = 'BETA',
  ALPHA = 'ALPHA',
}

/**
 * Platform enum
 */
export enum Platform {
  WINDOWS = 'WINDOWS',
  MACOS = 'MACOS',
  LINUX = 'LINUX',
}

/**
 * Architecture enum
 */
export enum Arch {
  X64 = 'X64',
  ARM64 = 'ARM64',
}

/**
 * Release asset
 */
export interface ReleaseAsset {
  id: string;
  releaseId: string;
  platform: Platform;
  architecture: Arch;
  downloadUrl: string;
  checksum: string;
  signature: string | null;
  sizeBytes: bigint | number;
}

/**
 * Release
 */
export interface Release {
  id: string;
  version: string;
  channel: ReleaseChannel;
  notes: string | null;
  mandatory: boolean;
  rolloutPercent: number;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  assets?: ReleaseAsset[];
}

/**
 * Check update request params
 */
export interface CheckUpdateParams {
  version: string;
  platform: Platform;
  architecture: Arch;
  channel: ReleaseChannel;
}

/**
 * Check update response
 */
export interface CheckUpdateResponse {
  updateAvailable: boolean;
  release: Release & { asset: ReleaseAsset } | null;
}

/**
 * Create release request
 */
export interface CreateReleaseRequest {
  version: string;
  channel: ReleaseChannel;
  notes?: string;
  mandatory?: boolean;
  rolloutPercent?: number;
  assets: Array<{
    platform: Platform;
    architecture: Arch;
    downloadUrl: string;
    checksum: string;
    signature?: string;
    sizeBytes: number;
  }>;
}

/**
 * Sync GitHub release request
 */
export interface SyncGitHubReleaseRequest {
  repository: string;
  tag: string;
}