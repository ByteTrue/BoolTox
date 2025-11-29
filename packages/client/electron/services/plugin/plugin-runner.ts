import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { pluginManager } from './plugin-manager';
import { backendRunner } from './plugin-backend-runner.js';
import { PluginRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('PluginRunner');

interface PluginState {
  runtime: PluginRuntime;
  window?: BrowserWindow; // Changed from view to window
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
        refCount: 0
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

    // If already running or loading, return the windowId (or wait for it)
    if (state.loadingPromise) {
      return state.loadingPromise;
    }
    
    if (state.runtime.status === 'running' && state.window) {
      state.window.show(); // Ensure it's visible
      state.window.focus();
      this.emitState(state, 'running', { windowId: state.window.id, viewId: state.window.webContents.id, focused: true });
      return state.window.webContents.id;
    }

    // Start loading
    state.runtime.status = 'loading';
    
    state.loadingPromise = (async () => {
      try {
        logger.info(`[PluginRunner] Creating window for ${pluginId}`);
        
        // 平台特定窗口配置 - 与主窗口保持一致
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

        // Create BrowserWindow with custom titlebar (like main window)
        const win = new BrowserWindow({
          width: 900,
          height: 600,
          minWidth: 600,
          minHeight: 400,
          show: true,
          frame: false, // 无边框窗口
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
        
        // 隐藏菜单栏并设置窗口属性
        win.setMenuBarVisibility(false);
        win.setMenu(null);
        
        // macOS 特定：设置窗口按钮可见性
        if (process.platform === 'darwin') {
          win.setWindowButtonVisibility(true);
        }
        
        // No need to add to parentWindow
        
        // Load content
        const entryFile = state.runtime.manifest.main;
        if (!entryFile) {
          throw new Error(`Plugin ${pluginId} manifest missing "main" entry`);
        }
        const entryPath = path.join(state.runtime.path, entryFile);
        const entryUrl = fileURLToPath(import.meta.url).startsWith('/') ? `file://${entryPath}` : `file:///${entryPath.replace(/\\/g, '/')}`;
        
        logger.info(`[PluginRunner] Loading entry: ${entryPath}`);
        
        try {
            await win.loadURL(entryUrl);
        } catch (err) {
            logger.warn('[PluginRunner] loadURL failed, trying loadFile', err);
            await win.loadFile(entryPath);
        }
        
        logger.info('[PluginRunner] Loaded entry successfully');
        
        // Open DevTools for debugging
        // win.webContents.openDevTools();

        // Update state
        state.runtime.status = 'running';
        state.runtime.viewId = win.webContents.id; // We still use viewId property to store webContentsId
        state.runtime.error = undefined;
        this.emitState(state, 'running', { windowId: win.id, viewId: win.webContents.id });
        
        // Handle close
        win.on('closed', () => {
          // Only handle if this is still the current window
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
        if (state) state.loadingPromise = undefined;
      }
    })();

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
    if (state?.window && !state.window.isDestroyed()) {
      state.window.show();
      state.window.focus();
      this.emitState(state, 'running', { windowId: state.window.id, viewId: state.window.webContents.id, focused: true });
    }
  }
}

export const pluginRunner = new PluginRunner();
