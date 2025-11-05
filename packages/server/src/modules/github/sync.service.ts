import { prisma } from '../../common/prisma.service';
import { logger } from '../../common/logger.service';
import { githubService } from './github.service';
import type { GitHubRelease, ParsedAssetInfo } from './github.types';

/**
 * GitHub Release 同步服务
 */
export class SyncService {
  /**
   * 同步单个 Release
   */
  async syncReleaseFromGitHub(githubRelease: GitHubRelease): Promise<void> {
    logger.info({ tag: githubRelease.tag_name }, 'Starting to sync release from GitHub');

    try {
      // 跳过草稿版本
      if (githubRelease.draft) {
        logger.info({ tag: githubRelease.tag_name }, 'Skipping draft release');
        return;
      }

      // 清理版本号
      const version = githubService.cleanVersion(githubRelease.tag_name);
      
      // 推断发布渠道
      const channel = githubService.inferChannelFromTag(githubRelease.tag_name);

      // 检查版本是否已存在
      const existingRelease = await prisma.release.findUnique({
        where: { version },
        include: { assets: true },
      });

      if (existingRelease) {
        logger.info({ version }, 'Release already exists, skipping');
        return;
      }

      // 解析所有资产
      const parsedAssets: ParsedAssetInfo[] = [];
      
      for (const asset of githubRelease.assets) {
        const platformArch = githubService.parseAssetPlatformArch(asset.name);
        
        // 只处理识别出平台和架构的资产
        if (platformArch.platform && platformArch.architecture) {
          try {
            // 下载并计算 checksum
            const checksum = await githubService.downloadAndCalculateChecksum(
              asset.browser_download_url
            );
            
            parsedAssets.push({
              asset,
              platform: platformArch.platform,
              architecture: platformArch.architecture,
              checksum,
            });
          } catch (error) {
            logger.error(
              { error, assetName: asset.name },
              'Failed to download and calculate checksum for asset'
            );
            // 继续处理其他资产
          }
        } else {
          logger.debug(
            { assetName: asset.name },
            'Skipping asset with unrecognized platform/architecture'
          );
        }
      }

      // 如果没有可用的资产，跳过此版本
      if (parsedAssets.length === 0) {
        logger.warn({ version }, 'No valid assets found for release, skipping');
        return;
      }

      // 创建 Release 及其资产
      await prisma.release.create({
        data: {
          version,
          channel,
          notes: githubRelease.body || null,
          mandatory: false,
          rolloutPercent: 100,
          publishedAt: githubRelease.published_at ? new Date(githubRelease.published_at) : null,
          assets: {
            create: parsedAssets.map((parsed) => ({
              platform: parsed.platform!,
              architecture: parsed.architecture!,
              downloadUrl: parsed.asset.browser_download_url,
              checksum: parsed.checksum!,
              signature: null,
              sizeBytes: BigInt(parsed.asset.size),
            })),
          },
        },
      });

      logger.info(
        { version, channel, assetsCount: parsedAssets.length },
        'Successfully synced release from GitHub'
      );
    } catch (error) {
      logger.error(
        { error, tag: githubRelease.tag_name },
        'Failed to sync release from GitHub'
      );
      throw error;
    }
  }

  /**
   * 同步所有 Release
   */
  async syncAllReleases(limit: number = 10): Promise<number> {
    logger.info({ limit }, 'Starting to sync all releases from GitHub');

    try {
      // 获取 GitHub releases
      const githubReleases = await githubService.listReleases(limit);
      
      let syncedCount = 0;
      
      for (const githubRelease of githubReleases) {
        try {
          await this.syncReleaseFromGitHub(githubRelease);
          syncedCount++;
        } catch (error) {
          // 记录错误但继续处理其他 release
          logger.error(
            { error, tag: githubRelease.tag_name },
            'Failed to sync individual release, continuing with others'
          );
        }
      }

      logger.info({ total: githubReleases.length, synced: syncedCount }, 'Finished syncing releases');
      return syncedCount;
    } catch (error) {
      logger.error({ error }, 'Failed to sync releases from GitHub');
      throw error;
    }
  }

  /**
   * 同步最新 Release
   */
  async syncLatestRelease(): Promise<void> {
    logger.info('Starting to sync latest release from GitHub');

    try {
      const latestRelease = await githubService.getLatestRelease();
      await this.syncReleaseFromGitHub(latestRelease);
      logger.info('Finished syncing latest release');
    } catch (error) {
      logger.error({ error }, 'Failed to sync latest release from GitHub');
      throw error;
    }
  }

  /**
   * 按 tag 同步特定 Release
   */
  async syncReleaseByTag(tag: string): Promise<void> {
    logger.info({ tag }, 'Starting to sync release by tag from GitHub');

    try {
      const release = await githubService.getReleaseByTag(tag);
      await this.syncReleaseFromGitHub(release);
      logger.info({ tag }, 'Finished syncing release by tag');
    } catch (error) {
      logger.error({ error, tag }, 'Failed to sync release by tag from GitHub');
      throw error;
    }
  }
}

// 导出单例
export const syncService = new SyncService();