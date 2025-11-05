import type {
  Release,
  ReleaseAsset,
  ReleaseChannel,
  Platform,
  Arch,
} from '@booltox/shared';

export interface ReleaseListResponse {
  items: Release[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ReleaseDetail = Release & {
  assets: ReleaseAsset[];
};

export interface ReleaseAssetInput {
  platform: Platform;
  architecture: Arch;
  downloadUrl: string;
  checksum: string;
  signature?: string;
  sizeBytes: number;
}

export interface CreateReleasePayload {
  version: string;
  channel: ReleaseChannel;
  notes?: string;
  mandatory?: boolean;
  rolloutPercent?: number;
  assets: ReleaseAssetInput[];
}

export interface UpdateReleasePayload {
  channel?: ReleaseChannel;
  notes?: string;
  mandatory?: boolean;
  rolloutPercent?: number;
  publishedAt?: string;
}

export type SyncGitHubReleaseMode = 'latest' | 'tag' | 'all';

export type SyncGitHubReleasePayload =
  | { mode: 'latest' }
  | { mode: 'tag'; tag: string }
  | { mode: 'all'; limit?: number };

export interface SyncGitHubReleaseResult {
  message: string;
  count?: number;
}
