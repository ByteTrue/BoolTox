import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';
import type { PluginRegistryEntry, PluginInstallProgress } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('PluginInstaller');

/**
 * 插件安装服务
 * 负责下载、验证、解压和安装插件
 */
export class PluginInstallerService {
  private pluginsDir: string;
  private tempDir: string;
  private downloadingPlugins = new Map<string, AbortController>();

  constructor() {
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    this.tempDir = path.join(app.getPath('temp'), 'booltox-plugin-downloads');
  }

  async init() {
    // 确保目录存在
    await fs.mkdir(this.pluginsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * 安装插件
   */
  async installPlugin(
    entry: PluginRegistryEntry,
    onProgress?: (progress: PluginInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    const { id, version, hash, downloadUrl } = entry;

    if (!downloadUrl) {
      throw new Error(`插件 ${id} 缺少下载地址`);
    }

    // 检查是否已在下载
    if (this.downloadingPlugins.has(id)) {
      throw new Error(`插件 ${id} 正在下载中`);
    }

    const pluginDir = path.join(this.pluginsDir, id);
    
    // 检查是否已安装
    const exists = await this.checkPluginExists(pluginDir);
    if (exists) {
      // TODO: 检查版本,支持更新
      throw new Error(`插件 ${id} 已安装`);
    }

    const abortController = new AbortController();
    this.downloadingPlugins.set(id, abortController);

    try {
      // 1. 下载
      this.reportProgress(onProgress, window, {
        stage: 'downloading',
        percent: 0,
        message: '正在下载插件包...',
      });

      const tempZipPath = path.join(this.tempDir, `${id}-${version}.zip`);
      await this.downloadFile(
        downloadUrl,
        tempZipPath,
        abortController.signal,
        (percent) => {
          this.reportProgress(onProgress, window, {
            stage: 'downloading',
            percent,
            message: `正在下载: ${percent.toFixed(1)}%`,
          });
        }
      );

      // 2. 验证哈希
      if (hash) {
        this.reportProgress(onProgress, window, {
          stage: 'verifying',
          percent: 80,
          message: '正在验证文件完整性...',
        });

        const fileHash = await this.calculateFileHash(tempZipPath);
        if (fileHash !== hash) {
          throw new Error('文件校验失败,可能已被篡改');
        }
      }

      // 3. 解压
      this.reportProgress(onProgress, window, {
        stage: 'extracting',
        percent: 85,
        message: '正在解压插件...',
      });

      await this.extractZip(tempZipPath, pluginDir);

      // 4. 验证manifest
      this.reportProgress(onProgress, window, {
        stage: 'installing',
        percent: 95,
        message: '正在安装插件...',
      });

      const manifestPath = path.join(pluginDir, 'manifest.json');
      await this.validateManifest(manifestPath, id);

      // 5. 清理临时文件
      await fs.unlink(tempZipPath).catch(() => {});

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      });

      logger.info(`[PluginInstaller] 插件安装成功: ${id}`);
      return pluginDir;
    } catch (error) {
      // 清理失败的安装
      await this.cleanup(pluginDir, id);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.reportProgress(onProgress, window, {
        stage: 'error',
        percent: 0,
        message: '安装失败',
        error: errorMessage,
      });

      throw error;
    } finally {
      this.downloadingPlugins.delete(id);
    }
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const pluginDir = path.join(this.pluginsDir, pluginId);
    
    const exists = await this.checkPluginExists(pluginDir);
    if (!exists) {
      throw new Error(`插件 ${pluginId} 未安装`);
    }

    await fs.rm(pluginDir, { recursive: true, force: true });
    logger.info(`[PluginInstaller] 插件已卸载: ${pluginId}`);
  }

  /**
   * 取消下载
   */
  cancelDownload(pluginId: string): void {
    const controller = this.downloadingPlugins.get(pluginId);
    if (controller) {
      controller.abort();
      this.downloadingPlugins.delete(pluginId);
    }
  }

  /**
   * 下载文件
   */
  private async downloadFile(
    url: string,
    outputPath: string,
    signal: AbortSignal,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const total = parseInt(response.headers.get('content-length') || '0', 10);
    let downloaded = 0;

    const writer = createWriteStream(outputPath);
    const reader = response.body?.getReader();

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        downloaded += value.length;
        writer.write(value);

        if (total && onProgress) {
          const percent = (downloaded / total) * 70; // 下载占70%进度
          onProgress(percent);
        }
      }

      writer.end();
      await new Promise<void>((resolve, reject) => {
        writer.on('finish', () => resolve());
        writer.on('error', reject);
      });
    } catch (error) {
      writer.destroy();
      await fs.unlink(outputPath).catch(() => {});
      throw error;
    }
  }

  /**
   * 计算文件SHA-256哈希
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  }

  /**
   * 解压ZIP文件
   */
  private async extractZip(zipPath: string, outputDir: string): Promise<void> {
    try {
      const zip = new AdmZip(zipPath);
      zip.extractAllTo(outputDir, true);
    } catch (error) {
      throw new Error(`解压失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 验证manifest.json
   */
  private async validateManifest(manifestPath: string, expectedId: string): Promise<void> {
    try {
      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(content);

      if (!manifest.id || !manifest.version || !manifest.name || !manifest.main) {
        throw new Error('manifest.json 缺少必需字段');
      }

      if (manifest.id !== expectedId) {
        throw new Error(`插件ID不匹配: 期望 ${expectedId}, 实际 ${manifest.id}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error('插件包中缺少 manifest.json');
      }
      throw error;
    }
  }

  /**
   * 检查插件是否存在
   */
  private async checkPluginExists(pluginDir: string): Promise<boolean> {
    try {
      await fs.access(pluginDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理失败的安装
   */
  private async cleanup(pluginDir: string, tempZipId: string): Promise<void> {
    // 删除插件目录
    await fs.rm(pluginDir, { recursive: true, force: true }).catch(() => {});
    
    // 删除临时ZIP文件
    const tempFiles = await fs.readdir(this.tempDir).catch(() => []);
    for (const file of tempFiles) {
      if (file.startsWith(tempZipId)) {
        await fs.unlink(path.join(this.tempDir, file)).catch(() => {});
      }
    }
  }

  /**
   * 报告进度
   */
  private reportProgress(
    callback: ((progress: PluginInstallProgress) => void) | undefined,
    window: BrowserWindow | undefined,
    progress: PluginInstallProgress
  ): void {
    if (callback) {
      callback(progress);
    }

    if (window && !window.isDestroyed()) {
      window.webContents.send('plugin:install-progress', progress);
    }
  }
}

export const pluginInstaller = new PluginInstallerService();
