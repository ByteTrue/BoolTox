/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { BrowserWindow, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { toolManager } from './tool-manager';
import { backendRunner } from './tool-backend-runner.js';
import { ToolRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { resolveEntryPath } from '../../utils/platform-utils.js';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import { pythonManager } from '../python-manager.service.js';
import http from 'node:http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('ToolRunner');

interface PluginState {
  runtime: ToolRuntime;
  process?: ChildProcess;
  mode: 'standalone'; // 只支持 standalone 模式（包括 http-service 和 binary）
  refCount: number;
  loadingPromise?: Promise<number>;
  destroyTimer?: NodeJS.Timeout;
  parentWindow?: BrowserWindow;
}

export class ToolRunner {
  // Map toolId -> PluginState
  private states: Map<string, PluginState> = new Map();

  private emitState(state: PluginState, status: ToolRuntime['status'] | 'launching' | 'stopping', extra: Record<string, unknown> = {}) {
    const payload = {
      toolId: state.runtime.id,
      status,
      mode: state.mode,
      ...extra,
    };

    const targetWindow = state.parentWindow ?? BrowserWindow.getAllWindows().find((win) => win.isVisible());
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('tool:state', payload);
    }
  }

  async startTool(toolId: string, parentWindow: BrowserWindow): Promise<number> {
    let state = this.states.get(toolId);

    if (!state) {
      const plugin = toolManager.getTool(toolId);
      if (!plugin) {
        throw new Error(`Plugin ${toolId} not found`);
      }
      state = {
        runtime: plugin,
        refCount: 0,
        mode: 'standalone' // 所有工具都是 standalone 模式
      };
      this.states.set(toolId, state);
    }

    state.parentWindow = parentWindow;

    // Cancel pending destroy if any
    if (state.destroyTimer) {
      logger.debug(`[ToolRunner] Cancelled pending destroy for ${toolId}`);
      clearTimeout(state.destroyTimer);
      state.destroyTimer = undefined;
    }

    state.refCount++;
    logger.info(`[ToolRunner] startTool ${toolId}, refCount: ${state.refCount}`);
    this.emitState(state, 'launching');

    if (state.loadingPromise) {
      return state.loadingPromise;
    }

    // http-service 模式：启动后端服务，在浏览器中打开
    const runtimeConfig = state.runtime.manifest.runtime;
    if (runtimeConfig && runtimeConfig.type === 'http-service') {
      const host = runtimeConfig.backend.host || '127.0.0.1';
      const port = runtimeConfig.backend.port;
      const urlPath = runtimeConfig.path || '/';
      const url = `http://${host}:${port}${urlPath}`;

      if (state.runtime.status === 'running' && state.process && !state.process.killed) {
        // 即使已经运行，也重新打开浏览器（用户可能关闭了标签页）
        logger.info(`[ToolRunner] 工具已运行，重新打开浏览器: ${url}`);
        shell.openExternal(url);
        this.emitState(state, 'running', { pid: state.process.pid, url, external: true });
        return state.process.pid ?? -1;
      }
      state.runtime.status = 'loading';
      state.loadingPromise = this.launchHttpServiceTool(state);
      return state.loadingPromise;
    }

    if (runtimeConfig && runtimeConfig.type === 'cli') {
      if (state.runtime.status === 'running' && state.process && !state.process.killed) {
        logger.info(`[ToolRunner] CLI 工具已运行 (PID: ${state.process.pid})`);
        this.emitState(state, 'running', { pid: state.process.pid ?? undefined, external: true });
        return state.process.pid ?? -1;
      }
      state.runtime.status = 'loading';
      state.loadingPromise = this.launchCliTool(state);
      return state.loadingPromise;
    }

    if (state.mode === 'standalone') {
      if (state.runtime.status === 'running' && state.process && !state.process.killed) {
        this.emitState(state, 'running', { pid: state.process.pid ?? undefined, external: true });
        return state.process.pid ?? -1;
      }
      state.runtime.status = 'loading';
      state.loadingPromise = this.launchStandalonePlugin(state);
      return state.loadingPromise;
    }

    throw new Error(`Unsupported tool runtime type for ${toolId}`);
  }

  stopTool(toolId: string, _parentWindow: BrowserWindow) {
    const state = this.states.get(toolId);
    if (!state) return;

    state.refCount--;
    logger.info(`[ToolRunner] stopTool ${toolId}, refCount: ${state.refCount}`);

    if (state.refCount <= 0) {
      state.refCount = 0;
      
      if (state.destroyTimer) clearTimeout(state.destroyTimer);
      
      logger.debug(`[ToolRunner] Scheduling destroy for ${toolId} in 1000ms`);
       this.emitState(state, 'stopping');
      state.destroyTimer = setTimeout(() => {
        this.destroyPlugin(state);
        this.states.delete(toolId);
      }, 1000);
    }
  }

  private destroyPlugin(state: PluginState) {
    if (state.process && !state.process.killed) {
      try {
        state.process.kill();
      } catch (error) {
        logger.warn(`[ToolRunner] Failed to kill standalone plugin ${state.runtime.id}`, error);
      }
    }
    state.process = undefined;
    backendRunner.disposeAllForPlugin(state.runtime.id);
    state.runtime.status = 'stopped';
    state.runtime.viewId = undefined;
    state.runtime.windowId = undefined;
    this.emitState(state, 'stopped');
    logger.info(`[ToolRunner] Plugin destroyed: ${state.runtime.id}`);
  }

  private handlePluginDestroyed(toolId: string) {
    const state = this.states.get(toolId);
    if (state) {
      backendRunner.disposeAllForPlugin(state.runtime.id);
      state.runtime.status = 'stopped';
      state.runtime.viewId = undefined;
      state.runtime.windowId = undefined;
      if (state.process && !state.process.killed) {
        try {
          state.process.kill();
        } catch (error) {
          logger.warn(`[ToolRunner] Failed to terminate standalone process for ${toolId}`, error);
        }
      }
      state.process = undefined;
      state.refCount = 0;
      this.states.delete(toolId);
      this.emitState(state, 'stopped');
      logger.info(`[ToolRunner] Plugin destroyed: ${toolId}`);
    }
  }

  focusTool(toolId: string) {
    const state = this.states.get(toolId);
    if (!state) {
      return;
    }

    // http-service 类型：重新在浏览器中打开
    const runtimeConfig = state.runtime.manifest.runtime;
    if (runtimeConfig && runtimeConfig.type === 'http-service') {
      const host = runtimeConfig.backend.host || '127.0.0.1';
      const port = runtimeConfig.backend.port;
      const urlPath = runtimeConfig.path || '/';
      const url = `http://${host}:${port}${urlPath}`;
      logger.info(`[ToolRunner] focusTool for http-service ${toolId}, opening browser: ${url}`);
      shell.openExternal(url);
      this.emitState(state, 'running', { pid: state.process?.pid, url, external: true });
      return;
    }

    // standalone/binary 模式：外部管理
    logger.info(`[ToolRunner] focusTool called for standalone plugin ${toolId}, external window must be managed by plugin`);
    this.emitState(state, 'running', { external: true, pid: state.process?.pid });
  }

  private async launchStandalonePlugin(state: PluginState): Promise<number> {
    const toolId = state.runtime.id;
    const runtimeConfig = state.runtime.manifest.runtime;

    if (
      !runtimeConfig ||
      (runtimeConfig.type !== 'standalone' && runtimeConfig.type !== 'binary')
    ) {
      throw new Error(`Plugin ${toolId} runtime is not standalone or binary`);
    }

    // ===== 新增：处理二进制工具 =====
    if (runtimeConfig.type === 'binary') {
      try {
        // 1. 确定可执行文件路径
        const exePath = runtimeConfig.localExecutablePath
          ? runtimeConfig.localExecutablePath // 本地工具：使用绝对路径
          : path.join(state.runtime.path, runtimeConfig.command); // 官方工具：相对路径

        // 2. 验证文件存在
        if (!fs.existsSync(exePath)) {
          throw new Error(`可执行文件不存在: ${exePath}`);
        }

        // 3. 启动独立进程
        const args = runtimeConfig.args ?? [];
        const env = { ...process.env, ...runtimeConfig.env };
        const cwd = runtimeConfig.cwd
          ? path.isAbsolute(runtimeConfig.cwd)
            ? runtimeConfig.cwd
            : path.join(state.runtime.path, runtimeConfig.cwd)
          : state.runtime.path;

        const child = spawn(exePath, args, {
          cwd,
          env,
          detached: true, // 独立进程
          stdio: 'ignore', // 不捕获输出
        });

        child.unref(); // 允许主进程退出而不等待子进程

        // 4. 更新状态
        state.process = child;
        state.runtime.status = 'running';
        state.runtime.error = undefined;
        this.emitState(state, 'running', {
          pid: child.pid,
          external: true,
        });

        logger.info(`[ToolRunner] Binary tool ${toolId} launched (PID: ${child.pid})`);

        // 5. 监听进程退出（可选，不阻塞）
        child.on('exit', (code) => {
          logger.info(`[ToolRunner] Binary tool ${toolId} exited with code ${code}`);
          this.handleStandaloneExit(toolId, code ?? null);
        });

        return -1; // 二进制工具返回 -1（表示外部进程）
      } catch (error) {
        state.runtime.status = 'error';
        state.runtime.error = error instanceof Error ? error.message : String(error);
        this.emitState(state, 'error', {
          message: error instanceof Error ? error.message : String(error),
          external: true,
        });
        throw error;
      }
    }
    // ===== 二进制工具处理结束 =====

    // 现有逻辑：处理 standalone 工具（Python）
    try {

      // 检查是否需要显示依赖安装窗口（Python 工具）
      if (runtimeConfig.requirements) {
        const requirementsPath = path.isAbsolute(runtimeConfig.requirements)
          ? runtimeConfig.requirements
          : path.join(state.runtime.path, runtimeConfig.requirements);

        const needsSetup = pythonManager.needsToolRequirementsSetup(toolId, requirementsPath);
        if (needsSetup) {
          logger.info(`工具 ${toolId} 需要安装依赖，显示安装窗口`);

          const { showPythonDepsInstaller } = await import('../../windows/python-deps-installer.js');
          const result = await showPythonDepsInstaller({
            toolId: toolId,
            toolName: state.runtime.manifest.name,
            toolPath: state.runtime.path,
            requirementsPath,
          });

          if (!result.success) {
            const errorMsg = result.cancelled
              ? '用户取消了依赖安装'
              : '依赖安装失败';
            logger.warn(`工具 ${toolId}: ${errorMsg}`);
            throw new Error(errorMsg);
          }

          logger.info(`工具 ${toolId} 依赖安装成功`);
        }
      }

      const entryPath = resolveEntryPath(runtimeConfig.entry, state.runtime.path);
      const args = runtimeConfig.args ?? [];
      const env = {
        ...process.env,
        ...runtimeConfig.env,
      };

      const sdkPath = pythonManager.getPythonSdkPath();
      const environment = await pythonManager.resolveBackendEnvironment({
        toolId: toolId,
        toolPath: state.runtime.path,
        requirementsPath: runtimeConfig.requirements,
      });

      const pythonPaths = [sdkPath, ...environment.additionalPythonPaths].filter(Boolean);
      const pythonPathValue = pythonPaths.join(path.delimiter);

      const child = pythonManager.spawnPython(entryPath, args, {
        cwd: state.runtime.path,
        env: {
          ...env,
          ...(environment.venvPath ? { VIRTUAL_ENV: environment.venvPath } : {}),
          PYTHONPATH: pythonPathValue,
          BOOLTOX_PLUGIN_ID: toolId,
        },
        pythonPath: environment.pythonPath,
        venvPath: environment.venvPath,
      });

      state.process = child;
      state.runtime.status = 'running';
      state.runtime.error = undefined;
      const pid = child.pid ?? undefined;
      this.emitState(state, 'running', { pid, external: true });
      logger.info(`[ToolRunner] Standalone plugin ${toolId} started with PID ${pid ?? 'unknown'}`);

      child.stderr?.on('data', (chunk: Buffer) => {
        logger.warn(`[ToolRunner] [${toolId}] stderr: ${chunk.toString()}`);
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        logger.info(`[ToolRunner] [${toolId}] stdout: ${chunk.toString()}`);
      });

      child.on('exit', (code) => {
        logger.info(`[ToolRunner] Standalone plugin ${toolId} exited with code ${code}`);
        this.handleStandaloneExit(toolId, code ?? null);
      });

      child.on('error', (error) => {
        logger.error(`[ToolRunner] Standalone plugin ${toolId} failed`, error);
        this.emitState(state, 'error', { message: error.message, external: true });
      });

      return -1;
    } catch (error) {
      state.runtime.status = 'error';
      state.runtime.error = error instanceof Error ? error.message : String(error);
      state.loadingPromise = undefined;
      state.process = undefined;
      state.refCount = 0;
      this.emitState(state, 'error', { message: error instanceof Error ? error.message : String(error), external: true });
      throw error;
    } finally {
      state.loadingPromise = undefined;
    }
  }

  private handleStandaloneExit(toolId: string, code: number | null) {
    const state = this.states.get(toolId);
    if (!state) {
      return;
    }
    state.process = undefined;
    state.runtime.status = 'stopped';
    state.refCount = 0;
    this.states.delete(toolId);
    backendRunner.disposeAllForPlugin(toolId);
    this.emitState(state, 'stopped', { exitCode: code, external: true });
  }

  private async launchHttpServiceTool(state: PluginState): Promise<number> {
    const toolId = state.runtime.id;
    const runtimeConfig = state.runtime.manifest.runtime;

    if (!runtimeConfig || runtimeConfig.type !== 'http-service') {
      throw new Error(`Plugin ${toolId} runtime is not http-service`);
    }

    try {
      const backendConfig = runtimeConfig.backend;

      // 检查 Node.js 依赖（启动前自动安装）
      if (backendConfig.type === 'node') {
        const packageJsonPath = path.join(state.runtime.path, 'package.json');
        const nodeModulesPath = path.join(state.runtime.path, 'node_modules');

        try {
          await fsPromises.access(packageJsonPath);
          // 检查 node_modules 是否存在
          const hasNodeModules = await fsPromises.access(nodeModulesPath).then(() => true).catch(() => false);

          if (!hasNodeModules) {
            logger.info(`[ToolRunner] 工具 ${toolId} 需要安装 Node.js 依赖，显示安装窗口`);

            const { showDepsInstaller } = await import('../../windows/deps-installer.js');
            const result = await showDepsInstaller({
              toolId: toolId,
              toolName: state.runtime.manifest.name,
              toolPath: state.runtime.path,
              language: 'node',
              packageJsonPath,
            });

            if (!result.success) {
              const errorMsg = result.cancelled
                ? '用户取消了依赖安装'
                : '依赖安装失败';
              logger.warn(`[ToolRunner] 工具 ${toolId}: ${errorMsg}`);
              throw new Error(errorMsg);
            }

            logger.info(`[ToolRunner] 工具 ${toolId} 依赖安装成功`);
          }
        } catch (error) {
          // package.json 不存在，跳过依赖安装
          if (error instanceof Error && error.message.includes('取消')) {
            throw error;
          }
          logger.info(`[ToolRunner] 工具 ${toolId} 无 package.json，跳过依赖安装`);
        }
      }

      // 检查是否需要显示依赖安装窗口（Python 后端）
      if (backendConfig.type === 'python' && backendConfig.requirements) {
        const requirementsPath = path.isAbsolute(backendConfig.requirements)
          ? backendConfig.requirements
          : path.join(state.runtime.path, backendConfig.requirements);

        const needsSetup = pythonManager.needsToolRequirementsSetup(toolId, requirementsPath);
        if (needsSetup) {
          logger.info(`[ToolRunner] 工具 ${toolId} 需要安装 Python 依赖，显示安装窗口`);

          const { showDepsInstaller } = await import('../../windows/deps-installer.js');
          const result = await showDepsInstaller({
            toolId: toolId,
            toolName: state.runtime.manifest.name,
            toolPath: state.runtime.path,
            language: 'python',
            requirementsPath,
          });

          if (!result.success) {
            const errorMsg = result.cancelled
              ? '用户取消了依赖安装'
              : '依赖安装失败';
            logger.warn(`工具 ${toolId}: ${errorMsg}`);
            throw new Error(errorMsg);
          }

          logger.info(`工具 ${toolId} 依赖安装成功`);
        }
      }

      const host = backendConfig.host || '127.0.0.1';
      const port = backendConfig.port;
      const urlPath = runtimeConfig.path || '/';
      const url = `http://${host}:${port}${urlPath}`;
      const readyTimeout = runtimeConfig.readyTimeout || 30000;

      logger.info(`[ToolRunner] 启动 HTTP 服务工具 ${toolId} (${url})`);

      // 启动后端进程
      let child: ChildProcess;
      if (backendConfig.type === 'python') {
        const entryPath = resolveEntryPath(backendConfig.entry, state.runtime.path);
        const args = backendConfig.args ?? [];
        const env = {
          ...process.env,
          ...backendConfig.env,
        };

        const sdkPath = pythonManager.getPythonSdkPath();
        const environment = await pythonManager.resolveBackendEnvironment({
          toolId: toolId,
          toolPath: state.runtime.path,
          requirementsPath: backendConfig.requirements,
        });

        const pythonPaths = [sdkPath, ...environment.additionalPythonPaths].filter(Boolean);
        const pythonPathValue = pythonPaths.join(path.delimiter);

        child = pythonManager.spawnPython(entryPath, args, {
          cwd: state.runtime.path,
          env: {
            ...env,
            ...(environment.venvPath ? { VIRTUAL_ENV: environment.venvPath } : {}),
            PYTHONPATH: pythonPathValue,
            BOOLTOX_PLUGIN_ID: toolId,
          },
          pythonPath: environment.pythonPath,
          venvPath: environment.venvPath,
        });
      } else if (backendConfig.type === 'node') {
        const entryPath = resolveEntryPath(backendConfig.entry, state.runtime.path);
        const args = backendConfig.args ?? [];
        const env = {
          ...process.env,
          ...backendConfig.env,
          BOOLTOX_PLUGIN_ID: toolId,
        };

        child = spawn('node', [entryPath, ...args], {
          cwd: state.runtime.path,
          env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } else {
        throw new Error(`不支持的后端类型: ${backendConfig.type}`);
      }

      state.process = child;
      logger.info(`[ToolRunner] 后端进程已启动 (PID: ${child.pid ?? 'unknown'})`);

      // 监听进程输出
      child.stderr?.on('data', (chunk: Buffer) => {
        logger.warn(`[ToolRunner] [${toolId}] stderr: ${chunk.toString()}`);
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        logger.info(`[ToolRunner] [${toolId}] stdout: ${chunk.toString()}`);
      });

      child.on('exit', (code) => {
        logger.info(`[ToolRunner] HTTP 服务工具 ${toolId} 退出 (code: ${code})`);
        this.handleStandaloneExit(toolId, code ?? null);
      });

      child.on('error', (error) => {
        logger.error(`[ToolRunner] HTTP 服务工具 ${toolId} 启动失败`, error);
        this.emitState(state, 'error', { message: error.message, external: true });
      });

      // 等待 HTTP 服务就绪（健康检查）
      logger.info(`[ToolRunner] 等待 HTTP 服务就绪: ${url}`);
      const startTime = Date.now();
      const checkInterval = 500; // 每 500ms 检查一次

      while (Date.now() - startTime < readyTimeout) {
        try {
          await new Promise<void>((resolve, reject) => {
            const req = http.get(url, (res) => {
              if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) {
                resolve();
              } else {
                reject(new Error(`HTTP status ${res.statusCode}`));
              }
              res.resume(); // 丢弃响应体
            });

            req.on('error', reject);
            req.setTimeout(1000, () => {
              req.destroy();
              reject(new Error('timeout'));
            });
          });

          // 服务就绪，打开浏览器
          logger.info(`[ToolRunner] HTTP 服务就绪，打开浏览器: ${url}`);
          shell.openExternal(url);

          state.runtime.status = 'running';
          state.runtime.error = undefined;
          this.emitState(state, 'running', { pid: child.pid, url, external: true });

          return child.pid ?? -1;
        } catch (error) {
          // 服务尚未就绪，继续等待
          await new Promise(resolve => setTimeout(resolve, checkInterval));
        }
      }

      // 超时
      throw new Error(`HTTP 服务启动超时 (${readyTimeout}ms)`);

    } catch (error) {
      state.runtime.status = 'error';
      state.runtime.error = error instanceof Error ? error.message : String(error);
      state.loadingPromise = undefined;
      if (state.process && !state.process.killed) {
        try {
          state.process.kill();
        } catch (killError) {
          logger.warn(`[ToolRunner] 清理失败进程时出错`, killError);
        }
      }
      state.process = undefined;
      state.refCount = 0;
      this.emitState(state, 'error', { message: error instanceof Error ? error.message : String(error), external: true });
      throw error;
    } finally {
      state.loadingPromise = undefined;
    }
  }

  /**
   * 启动 CLI 工具（在系统终端中运行）
   */
  private async launchCliTool(state: PluginState): Promise<number> {
    const toolId = state.runtime.id;
    const runtimeConfig = state.runtime.manifest.runtime;

    if (!runtimeConfig || runtimeConfig.type !== 'cli') {
      throw new Error(`Plugin ${toolId} runtime is not cli`);
    }

    try {
      const backendConfig = runtimeConfig.backend;

      // 检查并安装依赖（与 http-service 相同）
      if (backendConfig.type === 'python' && backendConfig.requirements) {
        const requirementsPath = path.isAbsolute(backendConfig.requirements)
          ? backendConfig.requirements
          : path.join(state.runtime.path, backendConfig.requirements);

        const needsSetup = pythonManager.needsToolRequirementsSetup(toolId, requirementsPath);
        if (needsSetup) {
          logger.info(`[ToolRunner] CLI 工具 ${toolId} 需要安装 Python 依赖`);

          const { showDepsInstaller } = await import('../../windows/deps-installer.js');
          const result = await showDepsInstaller({
            toolId: toolId,
            toolName: state.runtime.manifest.name,
            toolPath: state.runtime.path,
            language: 'python',
            requirementsPath,
          });

          if (!result.success) {
            throw new Error(result.cancelled ? '用户取消了依赖安装' : '依赖安装失败');
          }

          logger.info(`[ToolRunner] CLI 工具 ${toolId} Python 依赖安装成功`);
        }
      } else if (backendConfig.type === 'node') {
        const packageJsonPath = path.join(state.runtime.path, 'package.json');
        const nodeModulesPath = path.join(state.runtime.path, 'node_modules');

        try {
          await fsPromises.access(packageJsonPath);
          const hasNodeModules = await fsPromises.access(nodeModulesPath).then(() => true).catch(() => false);

          if (!hasNodeModules) {
            logger.info(`[ToolRunner] CLI 工具 ${toolId} 需要安装 Node.js 依赖`);

            const { showDepsInstaller } = await import('../../windows/deps-installer.js');
            const result = await showDepsInstaller({
              toolId: toolId,
              toolName: state.runtime.manifest.name,
              toolPath: state.runtime.path,
              language: 'node',
              packageJsonPath,
            });

            if (!result.success) {
              throw new Error(result.cancelled ? '用户取消了依赖安装' : '依赖安装失败');
            }

            logger.info(`[ToolRunner] CLI 工具 ${toolId} Node.js 依赖安装成功`);
          }
        } catch (error) {
          if (error instanceof Error && error.message.includes('取消')) {
            throw error;
          }
          logger.info(`[ToolRunner] CLI 工具 ${toolId} 无 package.json，跳过依赖安装`);
        }
      }

      // 构建启动命令
      let command: string;
      let args: string[];

      if (backendConfig.type === 'python') {
        const entryPath = resolveEntryPath(backendConfig.entry, state.runtime.path);
        const cmdArgs = backendConfig.args ?? [];

        const environment = await pythonManager.resolveBackendEnvironment({
          toolId: toolId,
          toolPath: state.runtime.path,
          requirementsPath: backendConfig.requirements,
        });

        // 使用 venv 中的 Python
        command = environment.pythonPath || 'python3';
        args = [entryPath, ...cmdArgs];

        logger.info(`[ToolRunner] CLI 工具使用 Python: ${command}`);
      } else if (backendConfig.type === 'node') {
        const entryPath = resolveEntryPath(backendConfig.entry, state.runtime.path);
        const cmdArgs = backendConfig.args ?? [];

        command = 'node';
        args = [entryPath, ...cmdArgs];

        logger.info(`[ToolRunner] CLI 工具使用 Node.js: ${command} ${args.join(' ')}`);
      } else if (backendConfig.type === 'process') {
        // 自定义命令（支持平台特定二进制）
        const entryPath = resolveEntryPath(backendConfig.entry, state.runtime.path);
        command = entryPath;
        args = backendConfig.args ?? [];

        logger.info(`[ToolRunner] CLI 工具使用自定义命令: ${command}`);
      } else {
        throw new Error(`不支持的 CLI 后端类型: ${backendConfig.type}`);
      }

      // 在终端中启动
      const { TerminalLauncher } = await import('./terminal-launcher.js');

      const cwd = runtimeConfig.cwd
        ? path.resolve(state.runtime.path, runtimeConfig.cwd)
        : state.runtime.path;

      logger.info(`[ToolRunner] 启动 CLI 工具 ${toolId} 在终端中`);
      logger.info(`[ToolRunner] 命令: ${command} ${args.join(' ')}`);
      logger.info(`[ToolRunner] 工作目录: ${cwd}`);

      const terminalProcess = TerminalLauncher.launch({
        command,
        args,
        cwd,
        env: backendConfig.env,
        title: runtimeConfig.title || state.runtime.manifest.name,
        keepOpen: runtimeConfig.keepOpen,
      });

      state.process = terminalProcess;
      state.runtime.status = 'running';

      logger.info(`[ToolRunner] CLI 工具已在终端启动 (PID: ${terminalProcess.pid ?? 'unknown'})`);

      // 监听进程退出
      terminalProcess.on('exit', (code) => {
        logger.info(`[ToolRunner] CLI 工具 ${toolId} 退出 (code: ${code})`);
        this.handleStandaloneExit(toolId, code ?? null);
      });

      terminalProcess.on('error', (error) => {
        logger.error(`[ToolRunner] CLI 工具 ${toolId} 启动失败`, error);
        this.emitState(state, 'error', { message: error.message, external: true });
      });

      this.emitState(state, 'running', {
        pid: terminalProcess.pid ?? undefined,
        external: true  // CLI 在外部终端运行
      });

      return terminalProcess.pid ?? -1;

    } catch (error) {
      logger.error(`[ToolRunner] CLI 工具 ${toolId} 启动失败`, error);
      state.runtime.status = 'error';
      state.runtime.error = error instanceof Error ? error.message : String(error);
      state.loadingPromise = undefined;
      if (state.process && !state.process.killed) {
        try {
          state.process.kill();
        } catch (killError) {
          logger.warn(`[ToolRunner] 清理失败进程时出错`, killError);
        }
      }
      state.process = undefined;
      state.refCount = 0;
      this.emitState(state, 'error', { message: error instanceof Error ? error.message : String(error), external: true });
      throw error;
    } finally {
      state.loadingPromise = undefined;
    }
  }

}

export const toolRunner = new ToolRunner();
