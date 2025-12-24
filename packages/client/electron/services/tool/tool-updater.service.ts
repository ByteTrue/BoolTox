/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 工具更新服务
 *
 * 职责：
 * 1. 检查已安装工具的更新
 * 2. 对比本地版本和在线版本
 * 3. 提供更新功能
 */

import semver from 'semver';
import { createLogger } from '../../utils/logger.js';
import { toolManager } from './tool-manager.js';
import { gitOpsService } from '../git-ops.service.js';
import { toolInstaller } from './tool-installer.js';

const logger = createLogger('ToolUpdater');

export interface ToolUpdateInfo {
  toolId: string;
  currentVersion: string;
  latestVersion: string;
  changelog?: string;
  downloadUrl?: string;
  hash?: string;
  size?: number;
}

export class ToolUpdaterService {
  private lastCheckTime: number = 0;
  private checkInterval = 24 * 60 * 60 * 1000; // 24 小时

  /**
   * 检查所有工具的更新
   */
  async checkUpdates(): Promise<ToolUpdateInfo[]> {
    try {
      logger.info('Checking tool updates...');

      // 获取在线工具列表
      const registry = await gitOpsService.getToolRegistry();
      const onlineTools = registry.tools || [];

      // 获取已安装工具
      const installedTools = toolManager.getAllTools();

      const updates: ToolUpdateInfo[] = [];

      for (const installed of installedTools) {
        // 跳过开发工具
        if (installed.isDev) {
          continue;
        }

        const online = onlineTools.find((t) => t.id === installed.id);
        if (!online) {
          logger.debug(`Tool ${installed.id} not found in online registry`);
          continue;
        }

        const currentVersion = installed.manifest.version;
        const latestVersion = online.version;

        // 使用 semver 比较版本
        try {
          if (semver.gt(latestVersion, currentVersion)) {
            updates.push({
              toolId: installed.id,
              currentVersion,
              latestVersion,
              changelog: online.changelog,
              downloadUrl: online.downloadUrl,
              hash: online.hash,
              size: online.size,
            });

            logger.info(`Update available for ${installed.id}: ${currentVersion} → ${latestVersion}`);
          }
        } catch {
          logger.warn(`Failed to compare versions for ${installed.id}: ${currentVersion} vs ${latestVersion}`);
        }
      }

      this.lastCheckTime = Date.now();
      logger.info(`Found ${updates.length} tool updates`);

      return updates;
    } catch (error) {
      logger.error('Failed to check tool updates:', error);
      return [];
    }
  }

  /**
   * 更新单个工具
   */
  async updateTool(toolId: string): Promise<void> {
    try {
      logger.info(`Updating tool: ${toolId}`);

      // 获取在线工具信息
      const registry = await gitOpsService.getToolRegistry();
      const tool = (registry.tools || []).find((t) => t.id === toolId);

      if (!tool) {
        throw new Error(`工具 ${toolId} 在工具市场中未找到`);
      }

      // 先卸载旧版本
      logger.info(`Uninstalling old version of ${toolId}`);
      await toolInstaller.uninstallTool(toolId);

      // 安装新版本
      logger.info(`Installing new version of ${toolId}: ${tool.version}`);
      await toolInstaller.installTool(tool);

      logger.info(`Tool ${toolId} updated successfully`);
    } catch (error) {
      logger.error(`Failed to update tool ${toolId}:`, error);
      throw error;
    }
  }

  /**
   * 批量更新工具
   */
  async updateAllTools(toolIds: string[]): Promise<{ success: string[]; failed: string[] }> {
    const success: string[] = [];
    const failed: string[] = [];

    for (const toolId of toolIds) {
      try {
        await this.updateTool(toolId);
        success.push(toolId);
      } catch (error) {
        logger.error(`Failed to update tool ${toolId}:`, error);
        failed.push(toolId);
      }
    }

    logger.info(`Batch update completed: ${success.length} success, ${failed.length} failed`);

    return { success, failed };
  }

  /**
   * 获取上次检查时间
   */
  getLastCheckTime(): number {
    return this.lastCheckTime;
  }
}

export const toolUpdater = new ToolUpdaterService();
