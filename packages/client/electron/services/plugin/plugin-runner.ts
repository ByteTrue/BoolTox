import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { pluginManager } from './plugin-manager';
import { backendRunner } from './plugin-backend-runner.js';
import { PluginRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import type { ChildProcess } from 'node:child_process';
import { pythonManager } from '../python-manager.service.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('PluginRunner');

interface PluginState {
  runtime: PluginRuntime;
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

  private emitState(state: PluginState, status: PluginRuntime['status'] | 'launching' | 'stopping', extra: Record<string, unknown> = {}) {
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
        mode: plugin.manifest.runtime?.type === 'standalone' ? 'standalone' : 'webview'
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
  
  getRunningPlugin(webContentsId: number): PluginRuntime | undefined {
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
      logger.info(`[PluginRunner] Creating window for ${pluginId}`);

      const platformConfig: Partial<BrowserWindowConstructorOptions> = (() => {
        switch (process.platform) {
          case 'win32':
            return {
              backgroundMaterial: 'mica',
              titleBarStyle: 'hidden',
            };
          case 'darwin':
            return {
              titleBarStyle: 'hiddenInset',
              trafficLightPosition: { x: 16, y: 16 },
              vibrancy: 'under-window',
              visualEffectState: 'active',
              transparent: false,
            };
          case 'linux':
            return {
              transparent: false,
              backgroundColor: '#1c1e23',
            };
          default:
            return {};
        }
      })();

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
          preload: path.join(__dirname, 'preload-plugin.mjs')
        }
      });

      state.window = win;
      state.runtime.windowId = win.id;

      win.setMenuBarVisibility(false);
      win.setMenu(null);

      if (process.platform === 'darwin') {
        win.setWindowButtonVisibility(true);
      }

      const entryFile = state.runtime.manifest.runtime?.type === 'standalone'
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
    try {
      const runtimeConfig = state.runtime.manifest.runtime;
      if (!runtimeConfig || runtimeConfig.type !== 'standalone') {
        throw new Error(`Plugin ${pluginId} runtime is not standalone`);
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
