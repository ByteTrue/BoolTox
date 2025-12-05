/**
 * 插件安装器
 * 从 packages/client/electron/services/plugin/plugin-installer.ts 迁移
 * 去除 Electron API，使用纯 Node.js 实现
 */

import { EventEmitter } from 'eventemitter3';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';
import fetch from 'node-fetch';

/**
 * 安装进度
 */
export interface PluginInstallProgress {
  stage: 'downloading' | 'verifying' | 'extracting' | 'complete';
  percent: number;
  message: string;
}

/**
 * 插件注册表条目
 */
export interface PluginRegistryEntry {
  id: string;
  version: string;
  downloadUrl: string;
  hash?: string;
  size?: number;
}

/**
 * 安装选项
 */
export interface PluginInstallOptions {
  /** 插件来源 */
  source: string;
  /** 安装类型 */
  type: 'url' | 'local';
  /** SHA-256 哈希（可选） */
  hash?: string;
  /** 进度回调 */
  onProgress?: (progress: PluginInstallProgress) => void;
}

/**
 * 插件安装器
 */
export class PluginInstaller extends EventEmitter {
  private pluginsDir: string;
  private tempDir: string;
  private downloadingPlugins = new Map<string, AbortController>();

  constructor(config: { pluginsDir?: string; tempDir?: string } = {}) {
    super();

    const dataDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '/tmp',
      '.booltox'
    );

    this.pluginsDir = config.pluginsDir || path.join(dataDir, 'plugins');
    this.tempDir = config.tempDir || path.join(dataDir, 'temp');
  }

  /**
   * 初始化
   */
  async init(): Promise<void> {
    await fs.mkdir(this.pluginsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * 安装插件
   */
  async installPlugin(options: PluginInstallOptions): Promise<string> {
    await this.init();

    const { source, type, hash, onProgress } = options;

    if (type === 'url') {
      return this.installFromUrl(source, hash, onProgress);
    } else if (type === 'local') {
      return this.installFromLocal(source, hash, onProgress);
    } else {
      throw new Error(`Unsupported install type: ${type}`);
    }
  }

  /**
   * 从 URL 安装插件
   */
  private async installFromUrl(
    url: string,
    hash?: string,
    onProgress?: (progress: PluginInstallProgress) => void
  ): Promise<string> {
    // 生成临时文件名
    const filename = `plugin-${Date.now()}.zip`;
    const tempZipPath = path.join(this.tempDir, filename);

    const abortController = new AbortController();

    try {
      // 1. 下载
      onProgress?.({
        stage: 'downloading',
        percent: 0,
        message: '正在下载插件包...',
      });

      await this.downloadFile(url, tempZipPath, abortController.signal, (percent) => {
        onProgress?.({
          stage: 'downloading',
          percent,
          message: `正在下载: ${percent.toFixed(1)}%`,
        });
      });

      // 2. 验证哈希
      if (hash) {
        onProgress?.({
          stage: 'verifying',
          percent: 80,
          message: '正在验证文件完整性...',
        });

        const fileHash = await this.calculateFileHash(tempZipPath);
        if (fileHash !== hash) {
          throw new Error('文件校验失败，可能已被篡改');
        }
      }

      // 3. 解压并安装
      const pluginId = await this.extractAndInstall(tempZipPath, onProgress);

      // 4. 清理临时文件
      await fs.unlink(tempZipPath).catch(() => {});

      onProgress?.({
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      });

      this.emit('plugin-installed', { pluginId });
      return pluginId;
    } finally {
      this.downloadingPlugins.delete(tempZipPath);
    }
  }

  /**
   * 从本地文件安装插件
   */
  private async installFromLocal(
    filePath: string,
    hash?: string,
    onProgress?: (progress: PluginInstallProgress) => void
  ): Promise<string> {
    // 验证文件存在
    if (!existsSync(filePath)) {
      throw new Error(`文件不存在: ${filePath}`);
    }

    // 验证哈希
    if (hash) {
      onProgress?.({
        stage: 'verifying',
        percent: 10,
        message: '正在验证文件完整性...',
      });

      const fileHash = await this.calculateFileHash(filePath);
      if (fileHash !== hash) {
        throw new Error('文件校验失败');
      }
    }

    // 解压并安装
    const pluginId = await this.extractAndInstall(filePath, onProgress);

    onProgress?.({
      stage: 'complete',
      percent: 100,
      message: '安装完成',
    });

    this.emit('plugin-installed', { pluginId });
    return pluginId;
  }

  /**
   * 下载文件
   */
  private async downloadFile(
    url: string,
    destPath: string,
    signal: AbortSignal,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`下载失败: ${response.statusText}`);
    }

    const totalSize = parseInt(response.headers.get('content-length') || '0', 10);
    let downloadedSize = 0;

    const writer = createWriteStream(destPath);

    return new Promise((resolve, reject) => {
      response.body?.on('data', (chunk: Buffer) => {
        downloadedSize += chunk.length;
        writer.write(chunk);

        if (totalSize > 0) {
          const percent = (downloadedSize / totalSize) * 100;
          onProgress?.(Math.min(percent, 99));
        }
      });

      response.body?.on('end', () => {
        writer.end();
        resolve();
      });

      response.body?.on('error', (error: Error) => {
        writer.close();
        reject(error);
      });

      writer.on('error', reject);
    });
  }

  /**
   * 解压并安装插件
   */
  private async extractAndInstall(
    zipPath: string,
    onProgress?: (progress: PluginInstallProgress) => void
  ): Promise<string> {
    onProgress?.({
      stage: 'extracting',
      percent: 85,
      message: '正在解压插件...',
    });

    // 读取 ZIP 文件
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // 查找 manifest.json
    const manifestEntry = entries.find((e) => e.entryName.endsWith('manifest.json'));
    if (!manifestEntry) {
      throw new Error('插件包无效：缺少 manifest.json');
    }

    // 解析 manifest
    const manifestContent = manifestEntry.getData().toString('utf-8');
    const manifest = JSON.parse(manifestContent);
    const pluginId = manifest.id;

    if (!pluginId) {
      throw new Error('manifest.json 缺少 id 字段');
    }

    // 目标目录
    const pluginDir = path.join(this.pluginsDir, pluginId);

    // 检查是否已安装
    if (existsSync(pluginDir)) {
      // 删除旧版本
      await fs.rm(pluginDir, { recursive: true, force: true });
    }

    // 解压到目标目录
    await fs.mkdir(pluginDir, { recursive: true });
    zip.extractAllTo(pluginDir, true);

    onProgress?.({
      stage: 'extracting',
      percent: 95,
      message: '解压完成',
    });

    return pluginId;
  }

  /**
   * 卸载插件
   */
  async uninstallPlugin(pluginId: string): Promise<void> {
    const pluginDir = path.join(this.pluginsDir, pluginId);

    if (!existsSync(pluginDir)) {
      throw new Error(`插件不存在: ${pluginId}`);
    }

    // 删除插件目录
    await fs.rm(pluginDir, { recursive: true, force: true });

    // 删除插件虚拟环境
    const pluginEnvDir = path.join(
      path.dirname(this.pluginsDir),
      'plugin-envs',
      pluginId
    );
    if (existsSync(pluginEnvDir)) {
      await fs.rm(pluginEnvDir, { recursive: true, force: true });
    }

    this.emit('plugin-uninstalled', { pluginId });
  }

  /**
   * 计算文件 SHA-256 哈希
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
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
   * 取消下载
   */
  cancelDownload(pluginId: string): void {
    const controller = this.downloadingPlugins.get(pluginId);
    if (controller) {
      controller.abort();
      this.downloadingPlugins.delete(pluginId);
    }
  }
}

/**
 * 创建插件安装器单例
 */
let _pluginInstaller: PluginInstaller | null = null;

export function getPluginInstaller(config?: {
  pluginsDir?: string;
  tempDir?: string;
}): PluginInstaller {
  if (!_pluginInstaller) {
    _pluginInstaller = new PluginInstaller(config);
  }
  return _pluginInstaller;
}
