/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { BrowserWindow } from 'electron';
import type { Rectangle } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { pluginManager } from './tool-manager';
import { backendRunner } from './tool-backend-runner.js';
import { ToolRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import { pythonManager } from '../python-manager.service.js';
import { getPlatformWindowConfig } from '../../utils/window-platform-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('PluginRunner');

interface PluginState {
  runtime: ToolRuntime;
  window?: BrowserWindow; // Changed from view to window
  process?: ChildProcess;
  mode: 'webview' | 'standalone';
  refCount: number;
  loadingPromise?: Promise<number>;
  destroyTimer?: NodeJS.Timeout;
  parentWindow?: BrowserWindow;
}

export class PluginRunner {
  // Map pluginId -> PluginState
  private states: Map<string, PluginState> = new Map();

  private emitState(state: PluginState, status: ToolRuntime['status'] | 'launching' | 'stopping', extra: Record<string, unknown> = {}) {
    const payload = {
      pluginId: state.runtime.id,
      status,
      mode: state.mode,
      ...extra,
    };

    const targetWindow = state.parentWindow ?? BrowserWindow.getAllWindows().find((win) => win.isVisible());
    if (targetWindow && !targetWindow.isDestroyed()) {
      targetWindow.webContents.send('plugin:state', payload);
    }
  }

  async startPlugin(pluginId: string, parentWindow: BrowserWindow): Promise<number> {
    let state = this.states.get(pluginId);

    if (!state) {
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`Plugin ${pluginId} not found`);
      }
      state = {
        runtime: plugin,
        refCount: 0,
        mode: plugin.manifest.runtime?.type === 'standalone' || plugin.manifest.runtime?.type === 'binary'
          ? 'standalone'
          : 'webview'
      };
      this.states.set(pluginId, state);
    }

    state.parentWindow = parentWindow;

    // Cancel pending destroy if any
    if (state.destroyTimer) {
      logger.debug(`[PluginRunner] Cancelled pending destroy for ${pluginId}`);
      clearTimeout(state.destroyTimer);
      state.destroyTimer = undefined;
    }

    state.refCount++;
    logger.info(`[PluginRunner] startPlugin ${pluginId}, refCount: ${state.refCount}`);
    this.emitState(state, 'launching');

    if (state.loadingPromise) {
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

    if (state.runtime.status === 'running' && state.window) {
      state.window.show(); // Ensure it's visible
      state.window.focus();
      this.emitState(state, 'running', { windowId: state.window.id, viewId: state.window.webContents.id, focused: true });
      return state.window.webContents.id;
    }

    state.runtime.status = 'loading';
    state.loadingPromise = this.launchWebviewPlugin(state);
    return state.loadingPromise;
  }

  stopPlugin(pluginId: string, _parentWindow: BrowserWindow) {
    const state = this.states.get(pluginId);
    if (!state) return;

    state.refCount--;
    logger.info(`[PluginRunner] stopPlugin ${pluginId}, refCount: ${state.refCount}`);

    if (state.refCount <= 0) {
      state.refCount = 0;
      
      if (state.destroyTimer) clearTimeout(state.destroyTimer);
      
      logger.debug(`[PluginRunner] Scheduling destroy for ${pluginId} in 1000ms`);
       this.emitState(state, 'stopping');
      state.destroyTimer = setTimeout(() => {
        this.destroyPlugin(state);
        this.states.delete(pluginId);
      }, 1000);
    }
  }

  private destroyPlugin(state: PluginState) {
    if (state.window) {
      try {
        state.window.destroy();
      } catch {
        // Ignore errors
      }
    }
    if (state.process && !state.process.killed) {
      try {
        state.process.kill();
      } catch (error) {
        logger.warn(`[PluginRunner] Failed to kill standalone plugin ${state.runtime.id}`, error);
      }
    }
    state.process = undefined;
    backendRunner.disposeAllForPlugin(state.runtime.id);
    state.runtime.status = 'stopped';
    state.runtime.viewId = undefined;
    state.runtime.windowId = undefined;
    state.window = undefined;
    this.emitState(state, 'stopped');
    logger.info(`[PluginRunner] Plugin destroyed: ${state.runtime.id}`);
  }

  private handlePluginDestroyed(pluginId: string) {
    const state = this.states.get(pluginId);
    if (state) {
      backendRunner.disposeAllForPlugin(state.runtime.id);
      state.runtime.status = 'stopped';
      state.runtime.viewId = undefined;
      state.runtime.windowId = undefined;
      state.window = undefined;
      if (state.process && !state.process.killed) {
        try {
          state.process.kill();
        } catch (error) {
          logger.warn(`[PluginRunner] Failed to terminate standalone process for ${pluginId}`, error);
        }
      }
      state.process = undefined;
      state.refCount = 0;
      this.states.delete(pluginId);
      this.emitState(state, 'stopped');
      logger.info(`[PluginRunner] Plugin window closed: ${pluginId}`);
    }
  }
  
  getRunningPlugin(webContentsId: number): ToolRuntime | undefined {
    for (const state of this.states.values()) {
      if (state.window?.webContents.id === webContentsId) {
        return state.runtime;
      }
    }
    return undefined;
  }

  resizePlugin(_pluginId: string, _bounds: Rectangle) {
    // In window mode, we might not want to resize based on placeholder
    // Or we could sync window size/position if we wanted to simulate embedding
    // For now, let's ignore resize in window mode to let user control it
    // or just log it.
    // console.log(`[PluginRunner] Resize ignored in window mode for ${pluginId}`);
  }

  focusPlugin(pluginId: string) {
    const state = this.states.get(pluginId);
    if (!state) {
      return;
    }
    if (state.mode === 'standalone') {
      logger.info(`[PluginRunner] focusPlugin called for standalone plugin ${pluginId}, external window must be managed by plugin`);
      this.emitState(state, 'running', { external: true, pid: state.process?.pid });
      return;
    }
    if (state.window && !state.window.isDestroyed()) {
      state.window.show();
      state.window.focus();
      this.emitState(state, 'running', { windowId: state.window.id, viewId: state.window.webContents.id, focused: true });
    }
  }

  private async launchWebviewPlugin(state: PluginState): Promise<number> {
    const pluginId = state.runtime.id;
    try {
      // 检查是否有 Python backend 需要依赖安装（在创建窗口之前）
      const runtimeConfig = state.runtime.manifest.runtime;
      const backendConfig = runtimeConfig && 'backend' in runtimeConfig ? runtimeConfig.backend : undefined;
      if (backendConfig && backendConfig.type === 'python' && backendConfig.requirements) {
        const requirementsPath = path.isAbsolute(backendConfig.requirements)
          ? backendConfig.requirements
          : path.join(state.runtime.path, backendConfig.requirements);

        const needsSetup = pythonManager.needsPluginRequirementsSetup(pluginId, requirementsPath);
        if (needsSetup) {
          logger.info(`工具 ${pluginId} 需要安装依赖，显示安装窗口`);

          const { showPythonDepsInstaller } = await import('../../windows/python-deps-installer.js');
          const result = await showPythonDepsInstaller({
            pluginId: pluginId,
            pluginName: state.runtime.manifest.name,
            pluginPath: state.runtime.path,
            requirementsPath,
          });

          if (!result.success) {
            const errorMsg = result.cancelled
              ? '用户取消了依赖安装'
              : '依赖安装失败';
            logger.warn(`工具 ${pluginId}: ${errorMsg}`);
            throw new Error(errorMsg);
          }

          logger.info(`工具 ${pluginId} 依赖安装成功`);
        }
      }

      logger.info(`[PluginRunner] Creating window for ${pluginId}`);

      const platformConfig = getPlatformWindowConfig({ frameless: true });

      const win = new BrowserWindow({
        width: 900,
        height: 600,
        minWidth: 600,
        minHeight: 400,
        show: true,
        frame: false,
        resizable: true,
        maximizable: true,
        autoHideMenuBar: true,
        ...platformConfig,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          preload: path.join(__dirname, 'preload-tool.mjs')
        }
      });

      state.window = win;
      state.runtime.windowId = win.id;

      win.setMenuBarVisibility(false);
      win.setMenu(null);

      if (process.platform === 'darwin') {
        win.setWindowButtonVisibility(false);
      }

      const entryFile =
        state.runtime.manifest.runtime?.type === 'standalone' ||
        state.runtime.manifest.runtime?.type === 'binary'
          ? undefined
          : state.runtime.manifest.runtime?.ui?.entry ?? state.runtime.manifest.main;
      if (!entryFile) {
        throw new Error(`Plugin ${pluginId} manifest missing "runtime.ui.entry"`);
      }

      const entryPath = path.join(state.runtime.path, entryFile);
      const entryUrl = fileURLToPath(import.meta.url).startsWith('/')
        ? `file://${entryPath}`
        : `file:///${entryPath.replace(/\\/g, '/')}`;

      logger.info(`[PluginRunner] Loading entry: ${entryPath}`);

      try {
        await win.loadURL(entryUrl);
      } catch (err) {
        logger.warn('[PluginRunner] loadURL failed, trying loadFile', err);
        await win.loadFile(entryPath);
      }

      logger.info('[PluginRunner] Loaded entry successfully');

      state.runtime.status = 'running';
      state.runtime.viewId = win.webContents.id;
      state.runtime.error = undefined;
      this.emitState(state, 'running', { windowId: win.id, viewId: win.webContents.id });

      win.on('closed', () => {
        if (state && state.window === win) {
          this.handlePluginDestroyed(pluginId);
        }
      });

      return win.webContents.id;
    } catch (e) {
      logger.error(`[PluginRunner] Failed to load plugin ${pluginId}`, e);
      state.runtime.status = 'error';
      state.runtime.error = e instanceof Error ? e.message : String(e);
      state.loadingPromise = undefined;
      state.window = undefined;
      state.refCount = 0;
      this.emitState(state, 'error', { message: e instanceof Error ? e.message : String(e) });
      throw e;
    } finally {
      state.loadingPromise = undefined;
    }
  }

  private async launchStandalonePlugin(state: PluginState): Promise<number> {
    const pluginId = state.runtime.id;
    const runtimeConfig = state.runtime.manifest.runtime;

    if (
      !runtimeConfig ||
      (runtimeConfig.type !== 'standalone' && runtimeConfig.type !== 'binary')
    ) {
      throw new Error(`Plugin ${pluginId} runtime is not standalone or binary`);
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

        logger.info(`[PluginRunner] Binary tool ${pluginId} launched (PID: ${child.pid})`);

        // 5. 监听进程退出（可选，不阻塞）
        child.on('exit', (code) => {
          logger.info(`[PluginRunner] Binary tool ${pluginId} exited with code ${code}`);
          this.handleStandaloneExit(pluginId, code ?? null);
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

        const needsSetup = pythonManager.needsPluginRequirementsSetup(pluginId, requirementsPath);
        if (needsSetup) {
          logger.info(`工具 ${pluginId} 需要安装依赖，显示安装窗口`);

          const { showPythonDepsInstaller } = await import('../../windows/python-deps-installer.js');
          const result = await showPythonDepsInstaller({
            pluginId: pluginId,
            pluginName: state.runtime.manifest.name,
            pluginPath: state.runtime.path,
            requirementsPath,
          });

          if (!result.success) {
            const errorMsg = result.cancelled
              ? '用户取消了依赖安装'
              : '依赖安装失败';
            logger.warn(`工具 ${pluginId}: ${errorMsg}`);
            throw new Error(errorMsg);
          }

          logger.info(`工具 ${pluginId} 依赖安装成功`);
        }
      }

      const entryPath = path.isAbsolute(runtimeConfig.entry)
        ? runtimeConfig.entry
        : path.join(state.runtime.path, runtimeConfig.entry);
      const args = runtimeConfig.args ?? [];
      const env = {
        ...process.env,
        ...runtimeConfig.env,
      };

      const sdkPath = pythonManager.getPythonSdkPath();
      const environment = await pythonManager.resolveBackendEnvironment({
        pluginId: pluginId,
        pluginPath: state.runtime.path,
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
          BOOLTOX_PLUGIN_ID: pluginId,
        },
        pythonPath: environment.pythonPath,
        venvPath: environment.venvPath,
      });

      state.process = child;
      state.runtime.status = 'running';
      state.runtime.error = undefined;
      const pid = child.pid ?? undefined;
      this.emitState(state, 'running', { pid, external: true });
      logger.info(`[PluginRunner] Standalone plugin ${pluginId} started with PID ${pid ?? 'unknown'}`);

      child.stderr?.on('data', (chunk: Buffer) => {
        logger.warn(`[PluginRunner] [${pluginId}] stderr: ${chunk.toString()}`);
      });

      child.stdout?.on('data', (chunk: Buffer) => {
        logger.info(`[PluginRunner] [${pluginId}] stdout: ${chunk.toString()}`);
      });

      child.on('exit', (code) => {
        logger.info(`[PluginRunner] Standalone plugin ${pluginId} exited with code ${code}`);
        this.handleStandaloneExit(pluginId, code ?? null);
      });

      child.on('error', (error) => {
        logger.error(`[PluginRunner] Standalone plugin ${pluginId} failed`, error);
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

  private handleStandaloneExit(pluginId: string, code: number | null) {
    const state = this.states.get(pluginId);
    if (!state) {
      return;
    }
    state.process = undefined;
    state.runtime.status = 'stopped';
    state.refCount = 0;
    this.states.delete(pluginId);
    backendRunner.disposeAllForPlugin(pluginId);
    this.emitState(state, 'stopped', { exitCode: code, external: true });
  }

}

export const pluginRunner = new PluginRunner();
