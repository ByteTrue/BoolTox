import { BrowserView, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { pluginManager } from './plugin-manager';
import { PluginRuntime } from '@booltox/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface PluginState {
  runtime: PluginRuntime;
  window?: BrowserWindow; // Changed from view to window
  refCount: number;
  loadingPromise?: Promise<number>;
  destroyTimer?: NodeJS.Timeout;
}

export class PluginRunner {
  // Map pluginId -> PluginState
  private states: Map<string, PluginState> = new Map();

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

    // Cancel pending destroy if any
    if (state.destroyTimer) {
      console.log(`[PluginRunner] Cancelled pending destroy for ${pluginId}`);
      clearTimeout(state.destroyTimer);
      state.destroyTimer = undefined;
    }

    state.refCount++;
    console.log(`[PluginRunner] startPlugin ${pluginId}, refCount: ${state.refCount}`);

    // If already running or loading, return the windowId (or wait for it)
    if (state.loadingPromise) {
      return state.loadingPromise;
    }
    
    if (state.runtime.status === 'running' && state.window) {
      state.window.show(); // Ensure it's visible
      return state.window.webContents.id;
    }

    // Start loading
    state.runtime.status = 'loading';
    
    state.loadingPromise = (async () => {
      try {
        console.log(`[PluginRunner] Creating window for ${pluginId}`);
        
        // Create BrowserWindow instead of BrowserView
        const win = new BrowserWindow({
          width: 900,
          height: 600,
          show: true, // Show immediately for debugging
          autoHideMenuBar: true,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            preload: path.join(__dirname, 'preload-plugin.mjs')
          }
        });

        state.window = win;
        // No need to add to parentWindow
        
        // Load content
        const entryPath = path.join(state.runtime.path, state.runtime.manifest.main);
        const entryUrl = fileURLToPath(import.meta.url).startsWith('/') ? `file://${entryPath}` : `file:///${entryPath.replace(/\\/g, '/')}`;
        
        console.log(`[PluginRunner] Loading entry: ${entryPath}`);
        
        try {
            await win.loadURL(entryUrl);
        } catch (err) {
            console.warn(`[PluginRunner] loadURL failed, trying loadFile`);
            await win.loadFile(entryPath);
        }
        
        console.log(`[PluginRunner] Loaded entry successfully`);
        
        // Open DevTools for debugging
        // win.webContents.openDevTools();

        // Update state
        state.runtime.status = 'running';
        state.runtime.viewId = win.webContents.id; // We still use viewId property to store webContentsId
        
        // Handle close
        win.on('closed', () => {
          // Only handle if this is still the current window
          if (state && state.window === win) {
             this.handlePluginDestroyed(pluginId);
          }
        });

        return win.webContents.id;
      } catch (e) {
        console.error(`[PluginRunner] Failed to load plugin ${pluginId}`, e);
        state.runtime.status = 'stopped';
        state.loadingPromise = undefined;
        state.window = undefined;
        state.refCount = 0; 
        throw e;
      } finally {
        if (state) state.loadingPromise = undefined;
      }
    })();

    return state.loadingPromise;
  }

  stopPlugin(pluginId: string, parentWindow: BrowserWindow) {
    const state = this.states.get(pluginId);
    if (!state) return;

    state.refCount--;
    console.log(`[PluginRunner] stopPlugin ${pluginId}, refCount: ${state.refCount}`);

    if (state.refCount <= 0) {
      state.refCount = 0;
      
      if (state.destroyTimer) clearTimeout(state.destroyTimer);
      
      console.log(`[PluginRunner] Scheduling destroy for ${pluginId} in 1000ms`);
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
      } catch (e) {
        // Ignore errors
      }
    }
    state.runtime.status = 'stopped';
    state.runtime.viewId = undefined;
    state.window = undefined;
    console.log(`[PluginRunner] Plugin destroyed: ${state.runtime.id}`);
  }

  private handlePluginDestroyed(pluginId: string) {
    const state = this.states.get(pluginId);
    if (state) {
      state.runtime.status = 'stopped';
      state.runtime.viewId = undefined;
      state.window = undefined;
      state.refCount = 0;
      this.states.delete(pluginId);
      console.log(`[PluginRunner] Plugin window closed: ${pluginId}`);
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

  resizePlugin(pluginId: string, bounds: Electron.Rectangle) {
    // In window mode, we might not want to resize based on placeholder
    // Or we could sync window size/position if we wanted to simulate embedding
    // For now, let's ignore resize in window mode to let user control it
    // or just log it.
    // console.log(`[PluginRunner] Resize ignored in window mode for ${pluginId}`);
  }
}

export const pluginRunner = new PluginRunner();
