/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { BrowserWindow } from 'electron';
import path from 'path';
import { toolManager } from './tool-manager';
import { backendRunner } from './tool-backend-runner.js';
import type { ToolBackendConfig, ToolRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { resolveEntryPath } from '../../utils/platform-utils.js';
import type { ChildProcess } from 'node:child_process';
import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import { pythonManager } from '../python-manager.service.js';
import http from 'node:http';
import { isPortAvailable, cleanupPort } from '../../utils/port-utils.js';

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

  /**
   * 获取所有运行中的工具（用于退出时清理）
   */
  getAllRunningTools(): PluginState[] {
    return Array.from(this.states.values()).filter(state => state.process && !state.process.killed);
  }

  /**
   * 清理所有运行中的工具进程
   */
  async cleanupAllTools(): Promise<void> {
    const runningTools = this.getAllRunningTools();
    logger.info(`[ToolRunner] 清理所有运行中的工具，共 ${runningTools.length} 个`);

    for (const state of runningTools) {
      try {
        await this.forceStopTool(state);
      } catch (error) {
        logger.warn(`[ToolRunner] 清理工具 ${state.runtime.id} 失败`, error);
      }
    }

    logger.info(`[ToolRunner] 所有工具已清理`);
  }

  /**
   * 强制停止工具（不经过 refCount 检查）
   */
  private async forceStopTool(state: PluginState): Promise<void> {
    const toolId = state.runtime.id;
    logger.info(`[ToolRunner] 强制停止工具: ${toolId}`);

    if (state.process && !state.process.killed) {
      const pid = state.process.pid;
      if (pid) {
        if (os.platform() === 'win32') {
          try {
            execSync(`taskkill /F /T /PID ${pid}`, { timeout: 5000 });
            logger.info(`[ToolRunner] 已停止工具进程树 (PID: ${pid})`);
          } catch (error) {
            logger.warn(`[ToolRunner] taskkill 失败，尝试 kill()`, error);
            state.process.kill('SIGTERM');
          }
        } else {
          state.process.kill('SIGTERM');
        }
      }
    }

    state.process = undefined;
    backendRunner.disposeAllForPlugin(toolId);
    this.states.delete(toolId);
  }

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
        throw new Error(`工具 ${toolId} 未找到`);
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

    // 在启动前检查并准备依赖
    const runtimeConfig = state.runtime.manifest.runtime;
    if (runtimeConfig && (runtimeConfig.type === 'http-service' || runtimeConfig.type === 'standalone' || runtimeConfig.type === 'cli')) {
      // 获取 backend 配置
      let backend: ToolBackendConfig | undefined;
      if (runtimeConfig.type === 'http-service' || runtimeConfig.type === 'cli') {
        backend = runtimeConfig.backend;
      } else if (runtimeConfig.type === 'standalone') {
        // standalone 直接有 entry，转换为 backend 格式
        backend = {
          type: 'python', // 默认假设是 python，实际会从 entry 推断
          entry: runtimeConfig.entry,
          requirements: runtimeConfig.requirements,
        };
      }

      if (backend) {
        try {
          await this.ensureDependencies(state.runtime, backend, parentWindow);
        } catch (error) {
          this.emitState(state, 'error', {
            message: error instanceof Error ? error.message : '依赖准备失败'
          });
          throw error;
        }
      }
    }

    // http-service 模式：启动后端服务，在浏览器中打开
    if (runtimeConfig && runtimeConfig.type === 'http-service') {
      const host = runtimeConfig.backend.host || '127.0.0.1';
      const port = runtimeConfig.backend.port;
      const urlPath = runtimeConfig.path || '/';
      const url = `http://${host}:${port}${urlPath}`;

      if (state.runtime.status === 'running' && state.process && !state.process.killed) {
        // 即使已经运行，也重新打开标签页（用户可能关闭了标签页）
        logger.info(`[ToolRunner] 工具已运行，重新打开标签页: ${url}`);
        const targetWindow = state.parentWindow ?? BrowserWindow.getAllWindows().find((win) => win.isVisible());
        if (targetWindow && !targetWindow.isDestroyed()) {
          targetWindow.webContents.send('tool:open-in-tab', {
            toolId,
            url,
            label: state.runtime.id,
          });
          targetWindow.show();
          targetWindow.focus();
        } else {
          logger.warn(`[ToolRunner] 未找到可用窗口，无法重新打开标签页: ${toolId}`);
        }
        this.emitState(state, 'running', { pid: state.process.pid, url, external: false, focused: true });
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

    // 原子操作：先减后检查，避免 TOCTOU 竞态
    state.refCount--;

    if (state.refCount < 0) {
      state.refCount = 0;
      logger.debug(`[ToolRunner] stopTool ${toolId}: refCount went negative, resetting to 0`);
      return;
    }

    logger.info(`[ToolRunner] stopTool ${toolId}, refCount: ${state.refCount}`);

    if (state.refCount === 0) {

      if (state.destroyTimer) clearTimeout(state.destroyTimer);

      logger.debug(`[ToolRunner] Scheduling destroy for ${toolId} in 1000ms`);
      this.emitState(state, 'stopping');
      state.destroyTimer = setTimeout(() => {
        // 对于外部运行的工具（CLI/Binary），立即清理状态
        // 不尝试杀死进程（因为工具在外部运行，BoolTox 无法控制）
        const runtimeConfig = state.runtime.manifest.runtime;
        const isExternalTool = runtimeConfig && (runtimeConfig.type === 'cli' || runtimeConfig.type === 'binary');

        if (isExternalTool) {
          logger.info(`[ToolRunner] 外部工具 ${toolId} 已清理状态（工具在外部独立运行）`);
          // 只清理状态，不杀进程
          state.process = undefined;
          backendRunner.disposeAllForPlugin(state.runtime.id);
          state.runtime.status = 'stopped';
          state.runtime.viewId = undefined;
          state.runtime.windowId = undefined;
          this.emitState(state, 'stopped');
          this.states.delete(toolId);
        } else {
          // HTTP 服务和 Standalone 工具：正常清理进程树
          this.destroyPlugin(state);
          this.states.delete(toolId);
        }
      }, 1000);
    }
  }

  private destroyPlugin(state: PluginState) {
    if (state.process && !state.process.killed) {
      try {
        const pid = state.process.pid;
        if (!pid) {
          state.process.kill();
        } else {
          // Windows: 使用 taskkill /T 杀死整个进程树
          // macOS/Linux: 发送 SIGTERM，让脚本的信号处理器清理子进程
          if (os.platform() === 'win32') {
            logger.info(`[ToolRunner] Windows: 使用 taskkill /T 杀死进程树 (PID: ${pid})`);
            try {
              execSync(`taskkill /F /T /PID ${pid}`, { timeout: 5000 });
            } catch (error) {
              logger.warn(`[ToolRunner] taskkill 失败，尝试 kill()`, error);
              state.process.kill();
            }
          } else {
            // macOS/Linux: SIGTERM 会触发 Python 的信号处理器
            logger.info(`[ToolRunner] Unix: 发送 SIGTERM 到进程 (PID: ${pid})`);
            state.process.kill('SIGTERM');

            // 等待 2 秒，如果还没退出则强制 SIGKILL
            setTimeout(() => {
              if (state.process && !state.process.killed) {
                logger.warn(`[ToolRunner] 进程未响应 SIGTERM，发送 SIGKILL`);
                state.process.kill('SIGKILL');
              }
            }, 2000);
          }
        }
      } catch (error) {
        logger.warn(`[ToolRunner] 无法停止独立工具 ${state.runtime.id}`, error);
      }
    }
    state.process = undefined;
    backendRunner.disposeAllForPlugin(state.runtime.id);
    state.runtime.status = 'stopped';
    state.runtime.viewId = undefined;
    state.runtime.windowId = undefined;
    this.emitState(state, 'stopped');
    logger.info(`[ToolRunner] 工具已销毁: ${state.runtime.id}`);
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
      logger.info(`[ToolRunner] 工具已销毁: ${toolId}`);
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
      logger.info(`[ToolRunner] focusTool for http-service ${toolId}, opening tab: ${url}`);
      const targetWindow = state.parentWindow ?? BrowserWindow.getAllWindows().find((win) => win.isVisible());
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send('tool:open-in-tab', {
          toolId,
          url,
          label: state.runtime.id,
        });
        targetWindow.show();
        targetWindow.focus();
      } else {
        logger.warn(`[ToolRunner] 未找到可用窗口，无法聚焦工具标签页: ${toolId}`);
      }
      this.emitState(state, 'running', { pid: state.process?.pid, url, external: false, focused: true });
      return;
    }

    // standalone/binary 模式：外部管理
    logger.info(`[ToolRunner] focusTool 调用独立工具 ${toolId}，外部窗口需由工具自行管理`);
    this.emitState(state, 'running', { external: true, pid: state.process?.pid });
  }

  private async launchStandalonePlugin(state: PluginState): Promise<number> {
    const toolId = state.runtime.id;
    const runtimeConfig = state.runtime.manifest.runtime;

    if (
      !runtimeConfig ||
      (runtimeConfig.type !== 'standalone' && runtimeConfig.type !== 'binary')
    ) {
      throw new Error(`工具 ${toolId} runtime 类型不是 standalone 或 binary`);
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

        logger.info(`[ToolRunner] Binary 工具已在外部启动 (PID: ${child.pid})`);
        logger.info(`[ToolRunner] ℹ️ Binary 工具在独立窗口运行，BoolTox 不管理其生命周期`);

        // 发送启动事件（不设置为 running，而是 launched）
        this.emitState(state, 'running', {
          pid: child.pid,
          external: true,
          uncontrollable: true,
          launcher: true  // 新增：标记为启动器模式
        });

        // 外部工具启动后立即清理状态（500ms 后）
        setTimeout(() => {
          const currentState = this.states.get(toolId);
          if (currentState && currentState.runtime.status === 'running') {
            logger.info(`[ToolRunner] 外部工具 ${toolId} 启动完成，清理状态以支持重复启动`);
            currentState.runtime.status = 'stopped';
            currentState.refCount = 0;
            this.emitState(currentState, 'stopped', { external: true, launcher: true });
            this.states.delete(toolId);
          }
        }, 500);

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
      logger.info(`[ToolRunner] 独立工具 ${toolId} 已启动 (PID: ${pid ?? 'unknown'})`);

      child.stderr?.on('data', (chunk: Buffer) => {
        logger.warn(`[ToolRunner] [${toolId}] stderr: ${chunk.toString()}`);
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        logger.info(`[ToolRunner] [${toolId}] stdout: ${chunk.toString()}`);
      });

      child.on('exit', (code) => {
        logger.info(`[ToolRunner] 独立工具 ${toolId} 退出 (code: ${code})`);
        this.handleStandaloneExit(toolId, code ?? null);
      });

      child.on('error', (error) => {
        logger.error(`[ToolRunner] 独立工具 ${toolId} 启动失败`, error);
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
      throw new Error(`工具 ${toolId} runtime 类型不是 http-service`);
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

      const available = await isPortAvailable(port, host);

      if (!available) {
        logger.warn(`[ToolRunner] 端口 ${port} 已被占用，尝试清理...`);
        const cleaned = await cleanupPort(port, host);
        if (!cleaned) {
          throw new Error(`工具 ${toolId} 启动失败：端口 ${host}:${port} 已被占用且清理失败`);
        }
      }

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

          // 服务就绪，发送 IPC 事件通知渲染进程创建标签页
          logger.info(`[ToolRunner] HTTP 服务就绪，通知渲染进程创建标签页: ${url}`);
          const targetWindow = state.parentWindow ?? BrowserWindow.getAllWindows().find((win) => win.isVisible());
          if (targetWindow && !targetWindow.isDestroyed()) {
            targetWindow.webContents.send('tool:open-in-tab', {
              toolId,
              url,
              label: state.runtime.id, // 使用 toolId 作为初始标签名，后续会通过 onTitleUpdate 更新
            });
          }

          state.runtime.status = 'running';
          state.runtime.error = undefined;
          this.emitState(state, 'running', { pid: child.pid, url, external: true });

          // 注释掉启动器模式：不再自动清理状态
          // 改为由标签页关闭时手动触发 stopTool
          // setTimeout(() => {
          //   const currentState = this.states.get(toolId);
          //   if (currentState && currentState.runtime.status === 'running') {
          //     logger.info(`[ToolRunner] HTTP 工具 ${toolId} 启动完成，清理状态（启动器模式）`);
          //     currentState.runtime.status = 'stopped';
          //     currentState.refCount = 0;
          //     this.emitState(currentState, 'stopped', { external: true, launcher: true });
          //     // 保留在 states 中以便跟踪进程（用于退出时清理）
          //   }
          // }, 500);

          return child.pid ?? -1;
        } catch {
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
      throw new Error(`工具 ${toolId} runtime 类型不是 cli`);
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

      logger.info(`[ToolRunner] CLI 工具已在外部终端启动 (PID: ${terminalProcess.pid ?? 'unknown'})`);
      logger.info(`[ToolRunner] ℹ️ CLI 工具在独立终端运行，BoolTox 不管理其生命周期`);

      // 外部工具：不监听 exit 事件，不尝试管理生命周期
      // 启动后立即清理状态，允许重复启动
      terminalProcess.on('error', (error) => {
        logger.error(`[ToolRunner] CLI 工具 ${toolId} 启动失败`, error);
        this.emitState(state, 'error', { message: error.message, external: true });
      });

      // 发送启动事件（不设置为 running，而是 launched）
      this.emitState(state, 'running', {
        pid: terminalProcess.pid ?? undefined,
        external: true,
        uncontrollable: true,
        launcher: true  // 新增：标记为启动器模式（前端据此不显示状态）
      });

      // 外部工具启动后立即清理状态（500ms 后）
      // 这样用户可以立即再次启动
      setTimeout(() => {
        const currentState = this.states.get(toolId);
        if (currentState && currentState.runtime.status === 'running') {
          logger.info(`[ToolRunner] 外部工具 ${toolId} 启动完成，清理状态以支持重复启动`);
          currentState.runtime.status = 'stopped';
          currentState.refCount = 0;
          this.emitState(currentState, 'stopped', { external: true, launcher: true });
          this.states.delete(toolId);
        }
      }, 500);

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

  /**
   * 确保工具依赖已准备好
   * 首次启动时安装依赖，后续启动直接跳过
   */
  private async ensureDependencies(
    runtime: ToolRuntime,
    backend: ToolBackendConfig,
    _parentWindow: BrowserWindow
  ): Promise<void> {
    const toolPath = runtime.path;
    const toolId = runtime.id;

    // Python 工具
    if (backend.type === 'python' && backend.requirements) {
      const requirementsPath = path.join(toolPath, backend.requirements);
      const venvPath = path.join(toolPath, 'venv');

      // 检查 requirements.txt 是否存在
      try {
        await fsPromises.access(requirementsPath);
      } catch {
        // 没有 requirements.txt，跳过
        return;
      }

      // 检查 venv 是否存在
      try {
        await fsPromises.access(venvPath);
        logger.info(`[ToolRunner] Python 环境已存在: ${toolId}`);
        return; // venv 存在，跳过安装
      } catch {
        // venv 不存在，需要安装
      }

      logger.info(`[ToolRunner] 首次启动 ${toolId}，准备 Python 环境...`);

      // 显示依赖准备对话框
      const { showDepsInstaller } = await import('../../windows/deps-installer.js');
      const result = await showDepsInstaller({
        toolId,
        toolName: runtime.manifest.name,
        toolPath,
        language: 'python',
        requirementsPath,
      });

      if (!result.success) {
        throw new Error(result.cancelled ? '用户取消了环境准备' : '环境准备失败');
      }

      logger.info(`[ToolRunner] Python 环境准备完成: ${toolId}`);
    }

    // Node.js 工具
    if (backend.type === 'node') {
      const packageJsonPath = path.join(toolPath, 'package.json');
      const nodeModulesPath = path.join(toolPath, 'node_modules');

      // 检查 package.json 是否存在
      try {
        await fsPromises.access(packageJsonPath);
      } catch {
        // 没有 package.json，跳过
        return;
      }

      // 检查 node_modules 是否存在
      try {
        await fsPromises.access(nodeModulesPath);
        logger.info(`[ToolRunner] Node.js 依赖已存在: ${toolId}`);
        return; // node_modules 存在，跳过安装
      } catch {
        // node_modules 不存在，需要安装
      }

      logger.info(`[ToolRunner] 首次启动 ${toolId}，安装 Node.js 依赖...`);

      // 显示依赖准备对话框
      const { showDepsInstaller } = await import('../../windows/deps-installer.js');
      const result = await showDepsInstaller({
        toolId,
        toolName: runtime.manifest.name,
        toolPath,
        language: 'node',
        packageJsonPath,
      });

      if (!result.success) {
        throw new Error(result.cancelled ? '用户取消了依赖安装' : '依赖安装失败');
      }

      logger.info(`[ToolRunner] Node.js 依赖安装完成: ${toolId}`);
    }
  }

}

export const toolRunner = new ToolRunner();
