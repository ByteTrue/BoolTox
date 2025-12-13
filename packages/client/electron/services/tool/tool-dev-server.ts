/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import chokidar, { type FSWatcher } from 'chokidar';
import type { ToolBackendConfig } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { resolveEntryPath } from '../../utils/platform-utils.js';
import { pythonManager } from '../python-manager.service.js';

const logger = createLogger('PluginDevServer');

export interface PluginDevServerOptions {
  toolId: string;
  toolPath: string;
  backend?: ToolBackendConfig;
  onRestart?: (info: { reason: string }) => void;
}

export class PluginDevServer {
  private watcher?: FSWatcher;
  private proc?: ChildProcess;
  private options?: PluginDevServerOptions;

  async start(options: PluginDevServerOptions): Promise<void> {
    this.options = options;
    if (!options.backend) {
      logger.info(`[DevServer] 工具 ${options.toolId} 未声明 backend，跳过后端监听`);
      return;
    }

    await this.launchBackend('start');

    // 监听后端入口文件变化（支持平台特定路径）
    const watchPath = typeof options.backend.entry === 'string'
      ? path.join(options.toolPath, options.backend.entry)
      : options.toolPath;  // 如果是平台特定，监听整个工具目录

    this.watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
    });
    this.watcher.on('all', async (event: string, filePath: string) => {
      logger.info(`[DevServer] 检测到变更 (${event}): ${filePath}`);
      await this.restart('file-changed');
    });
  }

  async restart(reason: string): Promise<void> {
    if (this.options?.onRestart) {
      this.options.onRestart({ reason });
    }
    await this.stop();
    if (this.options) {
      await this.launchBackend(reason);
    }
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = undefined;
    }
    if (this.proc && !this.proc.killed) {
      try {
        this.proc.kill();
      } catch (error) {
        logger.warn('[DevServer] 停止进程失败', error);
      }
    }
    this.proc = undefined;
  }

  private async launchBackend(reason: string): Promise<void> {
    if (!this.options?.backend) return;
    const { toolId, toolPath, backend } = this.options;
    logger.info(`[DevServer] 启动后端 (${backend.type})，原因=${reason}`);

    if (backend.type === 'python') {
      const environment = await pythonManager.resolveBackendEnvironment({
        toolId,
        toolPath,
        requirementsPath: backend.requirements,
      });
      const env = {
        ...process.env,
        ...(environment.venvPath ? { VIRTUAL_ENV: environment.venvPath } : {}),
        PYTHONPATH: [pythonManager.getToolPackagesDir(toolId), path.join(process.resourcesPath, 'python-sdk')]
          .filter(Boolean)
          .join(path.delimiter),
        BOOLTOX_PLUGIN_ID: toolId,
      };
      this.proc = pythonManager.spawnPython(
        resolveEntryPath(backend.entry, toolPath),
        backend.args ?? [],
        {
          cwd: toolPath,
          env,
          pythonPath: environment.pythonPath,
          venvPath: environment.venvPath,
        }
      );
    } else if (backend.type === 'node') {
      const env = {
        ...process.env,
        NODE_PATH: path.join(process.resourcesPath, 'node-sdk'),
        BOOLTOX_PLUGIN_ID: toolId,
        ...(backend.env ?? {}),
      };
      const entryPath = resolveEntryPath(backend.entry, toolPath);
      this.proc = spawn(process.execPath, [entryPath, ...(backend.args ?? [])], {
        cwd: toolPath,
        env,
        stdio: 'inherit',
      });
    } else {
      const entryPath = resolveEntryPath(backend.entry, toolPath);
      this.proc = spawn(
        entryPath,
        backend.args ?? [],
        { cwd: toolPath, env: { ...process.env, ...(backend.env ?? {}) }, stdio: 'inherit' }
      );
    }
  }
}
