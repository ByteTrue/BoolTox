import crypto from 'crypto';
import { env } from '../../config/env.config';
import { logger } from '../../common/logger.service';
import type { GitHubRelease, PlatformArchInfo } from './github.types';

/**
 * GitHub API 交互服务
 */
export class GitHubService {
  private readonly baseUrl = 'https://api.github.com';
  private readonly owner: string;
  private readonly repo: string;
  private readonly token?: string;

  constructor() {
    this.owner = env.GITHUB_OWNER;
    this.repo = env.GITHUB_REPO;
    this.token = env.GITHUB_TOKEN;
  }

  /**
   * 获取请求头
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'BoolTox-Server',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * 检查 Rate Limit
   */
  private async checkRateLimit(response: Response): Promise<void> {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining && parseInt(remaining) < 10) {
      logger.warn({
        remaining,
        reset: reset ? new Date(parseInt(reset) * 1000).toISOString() : null,
      }, 'GitHub API rate limit is low');
    }
  }

  /**
   * 发起 GitHub API 请求
   */
  private async fetchGitHub<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      await this.checkRateLimit(response);

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${response.status} ${response.statusText} - ${error}`);
      }

      return await response.json() as T;
    } catch (error) {
      logger.error({ error, url }, 'Failed to fetch from GitHub API');
      throw error;
    }
  }

  /**
   * 获取最新 Release
   */
  async getLatestRelease(): Promise<GitHubRelease> {
    logger.info({ owner: this.owner, repo: this.repo }, 'Fetching latest release from GitHub');
    
    const release = await this.fetchGitHub<GitHubRelease>(
      `/repos/${this.owner}/${this.repo}/releases/latest`
    );

    logger.info({ tag: release.tag_name }, 'Got latest release');
    return release;
  }

  /**
   * 按 tag 获取 Release
   */
  async getReleaseByTag(tag: string): Promise<GitHubRelease> {
    logger.info({ owner: this.owner, repo: this.repo, tag }, 'Fetching release by tag from GitHub');
    
    const release = await this.fetchGitHub<GitHubRelease>(
      `/repos/${this.owner}/${this.repo}/releases/tags/${tag}`
    );

    logger.info({ tag: release.tag_name }, 'Got release by tag');
    return release;
  }

  /**
   * 列出所有 Release
   */
  async listReleases(perPage: number = 30, page: number = 1): Promise<GitHubRelease[]> {
    logger.info({ owner: this.owner, repo: this.repo, perPage, page }, 'Listing releases from GitHub');
    
    const releases = await this.fetchGitHub<GitHubRelease[]>(
      `/repos/${this.owner}/${this.repo}/releases?per_page=${perPage}&page=${page}`
    );

    logger.info({ count: releases.length }, 'Got releases list');
    return releases;
  }

  /**
   * 下载 Asset（用于计算 checksum）
   */
  async downloadAsset(downloadUrl: string): Promise<Buffer> {
    logger.info({ downloadUrl }, 'Downloading asset for checksum calculation');
    
    try {
      const response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'BoolTox-Server',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to download asset: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      logger.error({ error, downloadUrl }, 'Failed to download asset');
      throw error;
    }
  }

  /**
   * 计算 SHA256 校验和
   */
  calculateChecksum(buffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * 下载并计算 Asset 的 checksum
   */
  async downloadAndCalculateChecksum(downloadUrl: string): Promise<string> {
    const buffer = await this.downloadAsset(downloadUrl);
    const checksum = this.calculateChecksum(buffer);
    
    logger.info({ downloadUrl, checksum }, 'Calculated asset checksum');
    return checksum;
  }

  /**
   * 解析文件名获取平台和架构信息
   */
  parseAssetPlatformArch(filename: string): PlatformArchInfo {
    const lowerFilename = filename.toLowerCase();
    
    let platform: PlatformArchInfo['platform'] = null;
    let architecture: PlatformArchInfo['architecture'] = null;

    // 解析平台
    if (lowerFilename.endsWith('.exe') || lowerFilename.includes('windows') || lowerFilename.includes('win')) {
      platform = 'WINDOWS';
    } else if (lowerFilename.endsWith('.dmg') || lowerFilename.endsWith('.pkg') || 
               lowerFilename.includes('macos') || lowerFilename.includes('darwin')) {
      platform = 'MACOS';
    } else if (lowerFilename.endsWith('.appimage') || lowerFilename.endsWith('.deb') || 
               lowerFilename.includes('linux')) {
      platform = 'LINUX';
    }

    // 解析架构
    if (lowerFilename.includes('arm64') || lowerFilename.includes('aarch64')) {
      architecture = 'ARM64';
    } else if (lowerFilename.includes('x64') || lowerFilename.includes('amd64') || 
               lowerFilename.includes('x86_64')) {
      architecture = 'X64';
    }

    return { platform, architecture };
  }

  /**
   * 检查 Release 是否为预发布版本
   */
  isPrerelease(release: GitHubRelease): boolean {
    return release.prerelease || release.draft;
  }

  /**
   * 从 tag 推断发布渠道
   */
  inferChannelFromTag(tag: string): 'STABLE' | 'BETA' | 'ALPHA' {
    const lowerTag = tag.toLowerCase();
    
    if (lowerTag.includes('alpha')) {
      return 'ALPHA';
    }
    
    if (lowerTag.includes('beta') || lowerTag.includes('rc')) {
      return 'BETA';
    }
    
    return 'STABLE';
  }

  /**
   * 清理版本号（移除 'v' 前缀）
   */
  cleanVersion(tag: string): string {
    return tag.startsWith('v') ? tag.substring(1) : tag;
  }
}

// 导出单例
export const githubService = new GitHubService();