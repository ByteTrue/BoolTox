/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Node.js 运行时管理服务
 * 类似 PythonManager，按需下载 Node.js 独立二进制
 */

import { app } from 'electron';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import axios from 'axios';
import AdmZip from 'adm-zip';
import { createLogger } from '../utils/logger.js';

const execAsync = promisify(exec);
const logger = createLogger('NodeManager');

// Node.js 版本
const NODE_VERSION = 'v20.10.0';

export interface NodeStatus {
  systemNodeAvailable: boolean;
  systemNodeVersion?: string;
  systemNodePath?: string;
  localNodeAvailable: boolean;
  localNodeVersion?: string;
  localNodePath?: string;
}

class NodeManager {
  private nodeDir: string;
  private nodePath: string | null = null;

  constructor() {
    this.nodeDir = path.join(app.getPath('userData'), 'node-runtime');
  }

  /**
   * 检测系统 Node.js
   */
  async checkSystemNode(): Promise<{ version: string; path: string } | null> {
    try {
      const { stdout } = await execAsync('node --version');
      const version = stdout.trim();

      // 获取路径
      const { stdout: pathOutput } = await execAsync(
        process.platform === 'win32' ? 'where node' : 'which node'
      );
      const nodePath = pathOutput.trim().split('\n')[0];

      logger.info(`系统 Node.js: ${version} (${nodePath})`);
      return { version, path: nodePath };
    } catch {
      logger.info('系统未安装 Node.js');
      return null;
    }
  }

  /**
   * 检测本地 Node.js
   */
  async checkLocalNode(): Promise<{ version: string; path: string } | null> {
    const nodeExe = process.platform === 'win32' ? 'node.exe' : 'node';
    const localNodePath = path.join(this.nodeDir, nodeExe);

    if (!fsSync.existsSync(localNodePath)) {
      return null;
    }

    try {
      const { stdout } = await execAsync(`"${localNodePath}" --version`);
      const version = stdout.trim();

      logger.info(`本地 Node.js: ${version} (${localNodePath})`);
      return { version, path: localNodePath };
    } catch {
      return null;
    }
  }

  /**
   * 获取 Node.js 状态
   */
  async getStatus(): Promise<NodeStatus> {
    const systemNode = await this.checkSystemNode();
    const localNode = await this.checkLocalNode();

    return {
      systemNodeAvailable: systemNode !== null,
      systemNodeVersion: systemNode?.version,
      systemNodePath: systemNode?.path,
      localNodeAvailable: localNode !== null,
      localNodeVersion: localNode?.version,
      localNodePath: localNode?.path,
    };
  }

  /**
   * 确保 Node.js 可用
   */
  async ensureNode(
    onProgress?: (progress: { stage: string; message: string; percent?: number }) => void
  ): Promise<string> {
    // 1. 优先使用系统 Node.js
    const systemNode = await this.checkSystemNode();
    if (systemNode) {
      logger.info('使用系统 Node.js:', systemNode.path);
      return systemNode.path;
    }

    // 2. 检查本地 Node.js
    const localNode = await this.checkLocalNode();
    if (localNode) {
      logger.info('使用本地 Node.js:', localNode.path);
      return localNode.path;
    }

    // 3. 下载 Node.js
    logger.info('正在下载 Node.js...');
    await this.downloadNode(onProgress);

    const downloaded = await this.checkLocalNode();
    if (!downloaded) {
      throw new Error('Node.js 下载失败');
    }

    return downloaded.path;
  }

  /**
   * 下载 Node.js 独立二进制
   */
  private async downloadNode(
    onProgress?: (progress: { stage: string; message: string; percent?: number }) => void
  ): Promise<void> {
    const platform = process.platform;
    const arch = process.arch;

    // 构建下载 URL
    const platformMap: Record<string, string> = {
      'win32-x64': `node-${NODE_VERSION}-win-x64.zip`,
      'darwin-arm64': `node-${NODE_VERSION}-darwin-arm64.tar.gz`,
      'darwin-x64': `node-${NODE_VERSION}-darwin-x64.tar.gz`,
      'linux-x64': `node-${NODE_VERSION}-linux-x64.tar.xz`,
    };

    const key = `${platform}-${arch}`;
    const filename = platformMap[key];

    if (!filename) {
      throw new Error(`不支持的平台: ${platform}-${arch}`);
    }

    const url = `https://nodejs.org/dist/${NODE_VERSION}/${filename}`;
    const tempFile = path.join(app.getPath('temp'), filename);

    logger.info(`下载 Node.js: ${url}`);

    onProgress?.({ stage: 'download', message: '正在下载 Node.js...', percent: 0 });

    // 下载
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      onDownloadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress?.({
            stage: 'download',
            message: `下载 Node.js: ${percent.toFixed(1)}%`,
            percent,
          });
        }
      },
    });

    await fs.writeFile(tempFile, Buffer.from(response.data));

    logger.info('下载完成，开始解压...');
    onProgress?.({ stage: 'install', message: '正在解压 Node.js...', percent: 90 });

    // 确保目标目录存在
    await fs.mkdir(this.nodeDir, { recursive: true });

    // 解压
    if (platform === 'win32') {
      // Windows: unzip
      const zip = new AdmZip(tempFile);
      zip.extractAllTo(this.nodeDir, true);

      // 移动文件到正确位置（zip 解压后有顶层目录）
      const extractedDir = path.join(this.nodeDir, `node-${NODE_VERSION}-win-x64`);
      if (fsSync.existsSync(extractedDir)) {
        const entries = await fs.readdir(extractedDir);
        for (const entry of entries) {
          const src = path.join(extractedDir, entry);
          const dest = path.join(this.nodeDir, entry);
          await fs.rename(src, dest);
        }
        await fs.rmdir(extractedDir);
      }
    } else {
      // macOS/Linux: tar
      const tar = await import('tar');
      await tar.extract({
        file: tempFile,
        cwd: this.nodeDir,
        strip: 1, // 去掉顶层目录
      });
    }

    // 清理临时文件
    await fs.unlink(tempFile).catch(() => {});

    logger.info('Node.js 安装完成');
    onProgress?.({ stage: 'install', message: 'Node.js 安装完成', percent: 100 });
  }

  /**
   * 运行 npm 命令
   */
  async runNpm(
    args: string[],
    options?: { cwd?: string; onOutput?: (data: string) => void }
  ): Promise<{ success: boolean; output: string; error?: string }> {
    const nodePath = await this.ensureNode();
    const npmPath = process.platform === 'win32'
      ? path.join(this.nodeDir, 'npm.cmd')
      : path.join(this.nodeDir, 'bin', 'npm');

    return new Promise((resolve) => {
      const proc = spawn(npmPath, args, {
        cwd: options?.cwd,
        env: { ...process.env, NODE_PATH: nodePath },
      });

      let output = '';
      let error = '';

      proc.stdout.on('data', (data) => {
        const str = data.toString();
        output += str;
        options?.onOutput?.(str);
      });

      proc.stderr.on('data', (data) => {
        const str = data.toString();
        error += str;
        options?.onOutput?.(str);
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output,
          error: code !== 0 ? error : undefined,
        });
      });
    });
  }
}

export const nodeManager = new NodeManager();
