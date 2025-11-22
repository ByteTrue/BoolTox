import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { PluginManifest, PluginRuntime } from '@booltox/shared';

export class PluginManager {
  private plugins: Map<string, PluginRuntime> = new Map();
  private pluginsDir: string;
  private devPluginsDir?: string;

  constructor() {
    // Use userData/plugins for installed plugins
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    
    // In development, load from packages/client/plugins
    // process.env.APP_ROOT is set in main.ts to path.join(__dirname, '..')
    // When running with vite-plugin-electron, __dirname is dist-electron
    // So APP_ROOT is packages/client
    if (process.env.NODE_ENV === 'development') {
      // Try to find the plugins directory relative to CWD or APP_ROOT
      // In dev mode, CWD is usually packages/client
      this.devPluginsDir = path.resolve(process.cwd(), 'plugins');
      
      // Fallback if not found
      if (process.env.APP_ROOT) {
         const altPath = path.join(process.env.APP_ROOT, 'plugins');
         if (altPath !== this.devPluginsDir) {
             // We'll check both or just prefer one. Let's stick to CWD for now as it's more reliable in dev
         }
      }
    }
  }

  async init() {
    console.log(`[PluginManager] Initializing... Plugins dir: ${this.pluginsDir}`);
    if (this.devPluginsDir) {
      console.log(`[PluginManager] Dev plugins dir: ${this.devPluginsDir}`);
    }
    
    await this.ensurePluginsDir();
    await this.loadPlugins();
  }

  private async ensurePluginsDir() {
    try {
      await fs.access(this.pluginsDir);
    } catch {
      await fs.mkdir(this.pluginsDir, { recursive: true });
    }
  }

  async loadPlugins() {
    this.plugins.clear();
    
    // Load from userData
    await this.scanDir(this.pluginsDir, false);
    
    // Load from dev dir (mark as dev plugins)
    if (this.devPluginsDir) {
      await this.scanDir(this.devPluginsDir, true);
    }
    
    console.log(`[PluginManager] Loaded ${this.plugins.size} plugins.`);
  }

  private async scanDir(dir: string, isDev = false) {
    try {
      // Check if dir exists first
      try {
        await fs.access(dir);
      } catch {
        return;
      }

      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // 跳过scripts等非插件目录
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'scripts' && entry.name !== 'node_modules') {
          await this.loadPluginFromPath(path.join(dir, entry.name), isDev);
        }
      }
    } catch (error) {
      console.error(`[PluginManager] Failed to scan plugins directory ${dir}:`, error);
    }
  }

  async loadPluginFromPath(pluginPath: string, isDev = false) {
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const manifest = JSON.parse(manifestContent) as PluginManifest;
      
      // Basic validation
      if (!manifest.id || !manifest.main) {
        console.error(`[PluginManager] Invalid manifest at ${pluginPath}: Missing id or main`);
        return;
      }

      const runtime: PluginRuntime = {
        id: manifest.id,
        manifest,
        path: pluginPath,
        status: 'stopped',
        isDev
      };

      this.plugins.set(manifest.id, runtime);
      console.log(`[PluginManager] Loaded plugin: ${manifest.name} (${manifest.id})${isDev ? ' [DEV]' : ''}`);
    } catch (error) {
      console.error(`[PluginManager] Failed to load plugin at ${pluginPath}:`, error);
    }
  }

  getAllPlugins(): PluginRuntime[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(id: string): PluginRuntime | undefined {
    return this.plugins.get(id);
  }
  
  getPluginsDir(): string {
    return this.pluginsDir;
  }
}

export const pluginManager = new PluginManager();
