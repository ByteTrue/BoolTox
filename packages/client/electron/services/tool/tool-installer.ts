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
import axios from 'axios';
import type { ToolRegistryEntry, ToolInstallProgress } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { gitOpsService } from '../git-ops.service.js';
import { configService } from '../config.service.js';
import { toolManager } from './tool-manager.js';

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
   * 验证工具 ID 是否安全（防止路径遍历攻击）
   */
  private validateToolId(id: string): void {
    // 只允许字母、数字、点、连字符和下划线
    const safePattern = /^[a-zA-Z0-9._-]+$/;
    if (!safePattern.test(id)) {
      throw new Error(`Invalid tool ID: ${id}. Only alphanumeric characters, dots, hyphens, and underscores are allowed.`);
    }
    // 额外检查：不允许以点开头（避免隐藏文件）或包含连续的点（避免 ..）
    if (id.startsWith('.') || id.includes('..')) {
      throw new Error(`Invalid tool ID: ${id}. Cannot start with dot or contain consecutive dots.`);
    }
  }

  /**
   * 安装工具
   */
  async installTool(
    entry: ToolRegistryEntry,
    onProgress?: (progress: ToolInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    // 判断是否为二进制工具
    if (entry.isBinaryTool) {
      return await this.installBinaryTool(entry, onProgress, window);
    }

    const { id } = entry;

    // 验证工具 ID（防止路径遍历攻击）
    this.validateToolId(id);

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
      // 优先使用 GitOps 下载（从 Git 仓库直接拉取源码，支持 tarball）
      // 注：gitPath 存在时优先走此路径，因为 downloadUrl 可能是 tarball URL（非 zip）
      if (entry.gitPath) {
        return await this.installFromGitOps(entry, onProgress, window);
      }

      // 降级到 .zip 下载（仅用于有独立 Release zip 的工具）
      if (entry.downloadUrl) {
        return await this.installFromZip(entry, abortController, onProgress, window);
      }

      throw new Error(`工具 ${id} 缺少安装源（需要 gitPath 或 downloadUrl）`);
    } finally {
      this.downloadingTools.delete(id);
    }
  }

  /**
   * 从 GitOps 安装工具（直接从 Git 仓库下载源码）
   */
  private async installFromGitOps(
    entry: ToolRegistryEntry,
    onProgress?: (progress: ToolInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    const { id, gitPath, sourceId } = entry;

    // 验证工具 ID（防止路径遍历攻击）
    this.validateToolId(id);

    if (!gitPath) {
      throw new Error(`工具 ${id} 缺少 gitPath`);
    }

    const toolDir = path.join(this.toolsDir, id);

    try {
      // 检查是否为本地工具源
      if (sourceId) {
        const sources = configService.get('toolSources', 'sources');
        const source = sources.find(s => s.id === sourceId);

        if (source && source.type === 'local' && source.localPath) {
          // 本地工具源：创建符号链接
          this.reportProgress(onProgress, window, {
            stage: 'downloading',
            percent: 50,
            message: '正在创建符号链接...',
          }, id);

          const sourcePath = path.join(source.localPath, gitPath);

          // 确保父目录存在
          await fs.mkdir(path.dirname(toolDir), { recursive: true });

          // 创建符号链接
          await fs.symlink(sourcePath, toolDir, 'dir');

          logger.info(`[ToolInstaller] 本地工具符号链接创建成功: ${toolDir} → ${sourcePath}`);

          this.reportProgress(onProgress, window, {
            stage: 'complete',
            percent: 100,
            message: '安装完成',
          }, id);

          return toolDir;
        }
      }

      // 远程工具源：从 Git 下载
      this.reportProgress(onProgress, window, {
        stage: 'downloading',
        percent: 50,
        message: '正在从 Git 仓库下载源码...',
      }, id);

      // 使用 GitOpsService 下载
      await gitOpsService.downloadToolSource(gitPath, toolDir);

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      }, id);

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
      }, id);

      logger.error(`[ToolInstaller] GitOps 安装失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 从 .zip 文件安装工具（兼容旧流程）
   */
  private async installFromZip(
    entry: ToolRegistryEntry,
    abortController: AbortController,
    onProgress?: (progress: ToolInstallProgress) => void,
    window?: BrowserWindow
  ): Promise<string> {
    const { id, version, hash, downloadUrl } = entry;

    // 验证工具 ID（防止路径遍历攻击）
    this.validateToolId(id);

    if (!downloadUrl) {
      throw new Error(`工具 ${id} 缺少下载地址`);
    }

    const toolDir = path.join(this.toolsDir, id);
    const tempZipPath = path.join(this.tempDir, `${id}-${version}.zip`);

    try {
      // 1. 下载
      this.reportProgress(onProgress, window, {
        stage: 'downloading',
        percent: 0,
        message: '正在下载工具包...',
      }, id);

      await this.downloadFile(
        downloadUrl,
        tempZipPath,
        abortController.signal,
        (percent) => {
          this.reportProgress(onProgress, window, {
            stage: 'downloading',
            percent,
            message: `正在下载: ${percent.toFixed(1)}%`,
          }, id);
        }
      );

      // 2. 验证哈希
      if (hash) {
        this.reportProgress(onProgress, window, {
          stage: 'verifying',
          percent: 80,
          message: '正在验证文件完整性...',
        }, id);

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
      }, id);

      await this.extractZip(tempZipPath, toolDir);

      // 4. 清理临时文件
      await fs.unlink(tempZipPath).catch(() => {});

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      }, id);

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
      }, id);

      logger.error(`[ToolInstaller] Zip 安装失败: ${id}`, error);
      throw error;
    }
  }

  /**
   * 卸载工具
   * 通过路径判断来源：
   * - 在 tools/ 目录中 → 远程工具，删除整个目录
   * - 不在 tools/ 目录中 → 本地工具，删除配置引用和对应的工具源
   */
  async uninstallTool(toolId: string): Promise<void> {
    // 从 ToolManager 获取工具信息
    const tool = toolManager.getAllTools().find(t => t.id === toolId);

    if (!tool) {
      throw new Error(`工具 ${toolId} 未找到`);
    }

    const toolPath = tool.path;

    // 防御性检查：确保 toolPath 有效
    if (!toolPath) {
      throw new Error(`工具 ${toolId} 的路径为空，无法卸载`);
    }

    // 判断是否为远程工具（在 tools/ 目录中）
    if (toolPath.startsWith(this.toolsDir)) {
      // 远程工具：删除整个目录
      const exists = await this.checkToolExists(toolPath);
      if (!exists) {
        throw new Error(`工具 ${toolId} 未安装`);
      }

      // 检查是否为符号链接
      const stat = await fs.lstat(toolPath);
      if (stat.isSymbolicLink()) {
        // 符号链接：只删除链接本身
        await fs.unlink(toolPath);
        logger.info(`[ToolInstaller] 符号链接已移除: ${toolId}`);
      } else {
        // 普通目录：递归删除
        await fs.rm(toolPath, { recursive: true, force: true });
        logger.info(`[ToolInstaller] 工具已卸载: ${toolId}`);
      }
    } else {
      // 本地工具：删除配置引用（通过路径匹配，而非 ID）
      const config = configService.get('toolSources');

      // 1. 删除 localToolRefs 中匹配路径的引用
      const originalRefsCount = config.localToolRefs.length;
      config.localToolRefs = config.localToolRefs.filter(ref => ref.path !== toolPath);
      const removedRefsCount = originalRefsCount - config.localToolRefs.length;

      // 2. 对于单工具本地源，删除对应的工具源
      //    注意：只删除单工具源（localPath === toolPath）
      //    多工具源的 localPath 是父目录，不会匹配
      const sourceToRemove = config.sources.find(
        s => s.type === 'local' && s.localPath === toolPath
      );
      if (sourceToRemove) {
        // 额外检查：确保该工具源下没有其他工具引用
        const otherRefsFromSource = config.localToolRefs.filter(
          ref => ref.sourceId === sourceToRemove.id
        );
        if (otherRefsFromSource.length === 0) {
          config.sources = config.sources.filter(s => s.id !== sourceToRemove.id);
          logger.info(`[ToolInstaller] 本地工具源已移除: ${sourceToRemove.name}`);
        }
      }

      configService.set('toolSources', config);
      logger.info(`[ToolInstaller] 本地工具引用已移除: ${toolId} (${removedRefsCount} refs)`);
    }
  }

  /**
   * 取消下载
   */
  cancelDownload(toolId: string): void {
    const controller = this.downloadingTools.get(toolId);
    if (controller) {
      controller.abort();
      this.downloadingTools.delete(toolId);
    }
  }

  /**
   * 下载文件（支持断点续传和自动重试）
   */
  private async downloadFile(
    url: string,
    outputPath: string,
    signal: AbortSignal,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    const maxRetries = 3;
    let retryCount = 0;
    let downloadedBytes = 0;

    while (retryCount <= maxRetries) {
      try {
        // 检查已下载的字节数
        try {
          const stats = await fs.stat(outputPath);
          downloadedBytes = stats.size;
        } catch {
          downloadedBytes = 0;
        }

        const headers: Record<string, string> = {};

        // 断点续传
        if (downloadedBytes > 0) {
          headers['Range'] = `bytes=${downloadedBytes}-`;
          logger.info(`Resuming download from byte ${downloadedBytes}`);
        }

        const response = await axios.get(url, {
          responseType: 'stream',
          signal,
          headers,
        });

        // 计算总字节数
        const contentLength = response.headers['content-length'];
        const totalBytes = downloadedBytes + (contentLength ? parseInt(contentLength, 10) : 0);

        // 创建写入流（断点续传时使用追加模式）
        const writeStream = createWriteStream(outputPath, {
          flags: downloadedBytes > 0 ? 'a' : 'w',
        });

        let currentBytes = downloadedBytes;

        // 监听数据流
        response.data.on('data', (chunk: Buffer) => {
          currentBytes += chunk.length;
          if (totalBytes && onProgress) {
            const percent = (currentBytes / totalBytes) * 70; // 下载占 70% 进度
            onProgress(percent);
          }
        });

        // 等待下载完成
        await new Promise<void>((resolve, reject) => {
          response.data.pipe(writeStream);
          writeStream.on('finish', () => resolve());
          writeStream.on('error', (err: Error) => reject(err));
          response.data.on('error', (err: Error) => reject(err));
        });

        // 下载成功，退出重试循环
        logger.info(`Download completed: ${url}`);
        return;

      } catch (error) {
        retryCount++;

        // 如果是用户取消，不重试
        if (signal.aborted) {
          throw new Error('下载已取消');
        }

        if (retryCount > maxRetries) {
          throw new Error(`下载失败（已重试 ${maxRetries} 次）: ${error instanceof Error ? error.message : String(error)}`);
        }

        // 指数退避：1s, 2s, 4s
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
        logger.warn(`Download failed, retry ${retryCount}/${maxRetries} in ${backoffTime}ms`);

        await new Promise(resolve => setTimeout(resolve, backoffTime));

        // 继续重试
      }
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
   * 验证booltox.json
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
        throw new Error('booltox.json 缺少必需字段（需要 main 或 standalone entry）');
      }

      if (manifest.id !== expectedId) {
        throw new Error(`工具ID不匹配: 期望 ${expectedId}, 实际 ${manifest.id}`);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ENOENT')) {
        throw new Error('工具包中缺少 booltox.json');
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
    await fs.rm(toolDir, { recursive: true, force: true }).catch((error) => {
      logger.warn(`[ToolInstaller] 清理工具目录失败: ${toolDir}`, error);
    });

    // 删除临时ZIP文件
    const tempFiles = await fs.readdir(this.tempDir).catch(() => []);
    for (const file of tempFiles) {
      if (file.startsWith(tempZipId)) {
        await fs.unlink(path.join(this.tempDir, file)).catch((error) => {
          logger.warn(`[ToolInstaller] 清理临时文件失败: ${file}`, error);
        });
      }
    }
  }

  /**
   * 报告进度
   * @param callback 进度回调函数
   * @param window BrowserWindow 实例
   * @param progress 进度信息
   * @param toolId 工具 ID（强烈建议传递，用于前端区分不同工具的进度）
   */
  private reportProgress(
    callback: ((progress: ToolInstallProgress) => void) | undefined,
    window: BrowserWindow | undefined,
    progress: ToolInstallProgress,
    toolId?: string
  ): void {
    // 警告：toolId 应该始终提供，以便前端能区分不同工具的进度
    if (!toolId) {
      logger.warn('[ToolInstaller] reportProgress 调用时未提供 toolId，建议修复');
    }

    if (callback) {
      callback(progress);
    }

    if (window && !window.isDestroyed()) {
      // 包含 toolId 以便渲染进程知道是哪个工具的进度
      window.webContents.send('tool:install-progress', { ...progress, toolId });
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
    const { id } = entry;

    // 验证工具 ID（防止路径遍历攻击）
    this.validateToolId(id);

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
      }, id);

      const tempFile = path.join(
        this.tempDir,
        `${id}${path.extname(new URL(assetInfo.url).pathname)}`
      );

      await this.downloadFile(assetInfo.url, tempFile, abortController.signal, (percent) => {
        this.reportProgress(onProgress, window, {
          stage: 'downloading',
          percent,
          message: `正在下载: ${percent.toFixed(1)}%`,
        }, id);
      });

      // 2. 验证校验和
      this.reportProgress(onProgress, window, {
        stage: 'verifying',
        percent: 80,
        message: '正在验证文件完整性...',
      }, id);

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
      }, id);

      await fs.mkdir(toolDir, { recursive: true });

      // 4. 移动可执行文件
      const exeName = path.basename(new URL(assetInfo.url).pathname);
      const targetPath = path.join(toolDir, exeName);
      await fs.rename(tempFile, targetPath);

      // 5. 设置执行权限（macOS/Linux）
      if (process.platform !== 'win32') {
        await fs.chmod(targetPath, 0o755);
      }

      // 6. 生成 booltox.json
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

      await fs.writeFile(path.join(toolDir, 'booltox.json'), JSON.stringify(manifest, null, 2));

      this.reportProgress(onProgress, window, {
        stage: 'complete',
        percent: 100,
        message: '安装完成',
      }, id);

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
      }, id);

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
