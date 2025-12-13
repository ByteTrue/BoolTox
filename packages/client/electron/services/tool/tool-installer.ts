/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import { createHash } from 'crypto';
import AdmZip from 'adm-zip';
import type { ToolRegistryEntry, ToolInstallProgress } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ToolInstaller');

/**
 * 工具安装服务
 * 负责下载、验证、解压和安装工具
 */
export class ToolInstallerService {
  private toolsDir: string;
  private tempDir: string;
  private downloadingTools = new Map<string, AbortController>();

  constructor() {
    this.toolsDir = path.join(app.getPath('userData'), 'tools');
    this.tempDir = path.join(app.getPath('temp'), 'booltox-tool-downloads');
  }

  async init() {
    // 确保目录存在
    await fs.mkdir(this.toolsDir, { recursive: true });
    await fs.mkdir(this.tempDir, { recursive: true });
  }

  /**
   * 安装工具
   */
  async installTool(
    entry: ToolRegistryEntry,
    onProgress?: (progress: ToolInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    // 新增：判断是否为二进制工具
    if (entry.isBinaryTool) {
      return await this.installBinaryTool(entry, onProgress, window);
    }

    const { id, version, hash, downloadUrl } = entry;

    if (!downloadUrl) {
      throw new Error(`工具 ${id} 缺少下载地址`);
    }

    // 检查是否已在下载
    if (this.downloadingTools.has(id)) {
      throw new Error(`工具 ${id} 正在下载中`);
    }

    const toolDir = path.join(this.toolsDir, id);
    
    // 检查是否已安装
    const exists = await this.checkToolExists(toolDir);
    if (exists) {
      // TODO: 检查版本,支持更新
      throw new Error(`工具 ${id} 已安装`);
    }

    const abortController = new AbortController();
    this.downloadingTools.set(id, abortController);

    try {
      // 1. 下载
      this.reportProgress(onProgress, window, {
        stage: 'downloading',
        percent: 0,
        message: '正在下载工具包...',
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
        message: '正在解压工具...',
      });

      await this.extractZip(tempZipPath, toolDir);

      // 4. 验证manifest
      this.reportProgress(onProgress, window, {
        stage: 'installing',
        percent: 90,
        message: '正在验证工具配置...',
      });

      const manifestPath = path.join(toolDir, 'manifest.json');
      await this.validateManifest(manifestPath, id);

      // 5. 安装依赖（如需要，使用依赖安装窗口）
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

      if (manifest.runtime?.backend?.type === 'node') {
        const packageJsonPath = path.join(toolDir, 'package.json');
        const hasPackageJson = await fs.access(packageJsonPath).then(() => true).catch(() => false);

        if (hasPackageJson && window) {
          logger.info(`[ToolInstaller] 工具 ${id} 需要安装 Node.js 依赖，显示安装窗口`);

          // 使用通用依赖安装器（带 UI 窗口）
          const { showDepsInstaller } = await import('../../windows/deps-installer.js');
          const result = await showDepsInstaller({
            toolId: id,
            toolName: manifest.name,
            toolPath: toolDir,
            language: 'node',
            packageJsonPath,
          });

          if (!result.success) {
            throw new Error(result.cancelled ? '用户取消了依赖安装' : '依赖安装失败');
          }

          logger.info(`[ToolInstaller] 工具 ${id} Node.js 依赖安装成功`);
        }
      }

      // 6. 清理临时文件
      await fs.unlink(tempZipPath).catch(() => {});

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      });

      logger.info(`[ToolInstaller] 工具安装成功: ${id}`);
      return toolDir;
    } catch (error) {
      // 清理失败的安装
      await this.cleanup(toolDir, id);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.reportProgress(onProgress, window, {
        stage: 'error',
        percent: 0,
        message: '安装失败',
        error: errorMessage,
      });

      throw error;
    } finally {
      this.downloadingTools.delete(id);
    }
  }

  /**
   * 卸载工具
   */
  async uninstallTool(pluginId: string): Promise<void> {
    const toolDir = path.join(this.toolsDir, pluginId);
    
    const exists = await this.checkToolExists(toolDir);
    if (!exists) {
      throw new Error(`工具 ${pluginId} 未安装`);
    }

    await fs.rm(toolDir, { recursive: true, force: true });
    logger.info(`[ToolInstaller] 工具已卸载: ${pluginId}`);
  }

  /**
   * 取消下载
   */
  cancelDownload(pluginId: string): void {
    const controller = this.downloadingTools.get(pluginId);
    if (controller) {
      controller.abort();
      this.downloadingTools.delete(pluginId);
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

      const hasWebEntry =
        typeof manifest.main === 'string' ||
        (manifest.runtime &&
          manifest.runtime.type !== 'standalone' &&
          typeof manifest.runtime?.ui?.entry === 'string');
      const hasStandaloneEntry =
        manifest.runtime?.type === 'standalone' && typeof manifest.runtime.entry === 'string';

      if (!manifest.id || !manifest.version || !manifest.name || (!hasWebEntry && !hasStandaloneEntry)) {
        throw new Error('manifest.json 缺少必需字段（需要 main 或 standalone entry）');
      }

      if (manifest.id !== expectedId) {
        throw new Error(`工具ID不匹配: 期望 ${expectedId}, 实际 ${manifest.id}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error('工具包中缺少 manifest.json');
      }
      throw error;
    }
  }

  /**
   * 检查工具是否存在
   */
  private async checkToolExists(toolDir: string): Promise<boolean> {
    try {
      await fs.access(toolDir);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 清理失败的安装
   */
  private async cleanup(toolDir: string, tempZipId: string): Promise<void> {
    // 删除工具目录
    await fs.rm(toolDir, { recursive: true, force: true }).catch(() => {});
    
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
    callback: ((progress: ToolInstallProgress) => void) | undefined,
    window: BrowserWindow | undefined,
    progress: ToolInstallProgress
  ): void {
    if (callback) {
      callback(progress);
    }

    if (window && !window.isDestroyed()) {
      window.webContents.send('tool:install-progress', progress);
    }
  }

  /**
   * 安装二进制工具
   */
  private async installBinaryTool(
    entry: ToolRegistryEntry,
    onProgress?: (progress: ToolInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    const { id, binaryAssets } = entry;

    const platform = this.getPlatform();
    const assetInfo = this.selectAssetForPlatform(entry, platform);

    if (!assetInfo) {
      throw new Error(`当前平台 ${platform} 无可用的二进制文件`);
    }

    // 检查是否已在下载
    if (this.downloadingTools.has(id)) {
      throw new Error(`工具 ${id} 正在下载中`);
    }

    const toolDir = path.join(this.toolsDir, id);

    // 检查是否已安装
    const exists = await this.checkToolExists(toolDir);
    if (exists) {
      throw new Error(`工具 ${id} 已安装`);
    }

    const abortController = new AbortController();
    this.downloadingTools.set(id, abortController);

    try {
      // 1. 下载可执行文件
      this.reportProgress(onProgress, window, {
        stage: 'downloading',
        percent: 0,
        message: '正在下载工具...',
      });

      const tempFile = path.join(
        this.tempDir,
        `${id}${path.extname(new URL(assetInfo.url).pathname)}`
      );

      await this.downloadFile(assetInfo.url, tempFile, abortController.signal, (percent) => {
        this.reportProgress(onProgress, window, {
          stage: 'downloading',
          percent,
          message: `正在下载: ${percent.toFixed(1)}%`,
        });
      });

      // 2. 验证校验和
      this.reportProgress(onProgress, window, {
        stage: 'verifying',
        percent: 80,
        message: '正在验证文件完整性...',
      });

      const fileHash = await this.calculateFileHash(tempFile);
      if (fileHash !== assetInfo.checksum) {
        await fs.unlink(tempFile);
        throw new Error('文件校验失败，可能已被篡改');
      }

      // 3. 创建工具目录
      this.reportProgress(onProgress, window, {
        stage: 'installing',
        percent: 90,
        message: '正在安装工具...',
      });

      await fs.mkdir(toolDir, { recursive: true });

      // 4. 移动可执行文件
      const exeName = path.basename(new URL(assetInfo.url).pathname);
      const targetPath = path.join(toolDir, exeName);
      await fs.rename(tempFile, targetPath);

      // 5. 设置执行权限（macOS/Linux）
      if (process.platform !== 'win32') {
        await fs.chmod(targetPath, 0o755);
      }

      // 6. 生成 manifest.json
      const manifest = {
        id: entry.id,
        version: entry.version,
        name: entry.name,
        description: entry.description,
        author: entry.author,
        category: entry.category,
        keywords: entry.keywords,
        runtime: {
          type: 'binary',
          command: exeName,
        },
      };

      await fs.writeFile(path.join(toolDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      });

      logger.info(`[ToolInstaller] Binary tool ${id} installed successfully at ${toolDir}`);
      return toolDir;
    } catch (error) {
      // 清理失败的安装
      await this.cleanup(toolDir, id);

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.reportProgress(onProgress, window, {
        stage: 'error',
        percent: 0,
        message: '安装失败',
        error: errorMessage,
      });

      throw error;
    } finally {
      this.downloadingTools.delete(id);
    }
  }

  /**
   * 获取当前平台标识
   */
  private getPlatform(): 'windows' | 'darwin' | 'linux' {
    const platform = process.platform;
    if (platform === 'win32') return 'windows';
    if (platform === 'darwin') return 'darwin';
    return 'linux';
  }

  /**
   * 根据平台选择资源
   */
  private selectAssetForPlatform(
    entry: ToolRegistryEntry,
    platform: 'windows' | 'darwin' | 'linux'
  ): { url: string; checksum: string; size: number } | undefined {
    return entry.binaryAssets?.[platform];
  }
}

export const toolInstaller = new ToolInstallerService();
