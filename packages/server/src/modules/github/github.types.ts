/**
 * GitHub Release 相关类型定义
 */

/**
 * GitHub Release Asset
 */
export interface GitHubAsset {
  id: number;
  name: string;
  content_type: string;
  size: number;
  browser_download_url: string;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub Release
 */
export interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string;
  body: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: GitHubAsset[];
}

/**
 * 平台和架构信息
 */
export interface PlatformArchInfo {
  platform: 'WINDOWS' | 'MACOS' | 'LINUX' | null;
  architecture: 'X64' | 'ARM64' | null;
}

/**
 * 解析后的资产信息
 */
export interface ParsedAssetInfo extends PlatformArchInfo {
  asset: GitHubAsset;
  checksum?: string;
}