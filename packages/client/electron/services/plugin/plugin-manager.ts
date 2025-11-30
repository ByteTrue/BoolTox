import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { BOOLTOX_PROTOCOL_VERSION, PluginManifest, PluginRuntime, PluginRuntimeConfig } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('PluginManager');
const DEFAULT_PROTOCOL_RANGE = '^1.0.0';

export class PluginManager {
  private plugins: Map<string, PluginRuntime> = new Map();
  private pluginsDir: string;
  private devPluginsDir?: string;

  constructor() {
    // Use userData/plugins for installed plugins
    this.pluginsDir = path.join(app.getPath('userData'), 'plugins');
    
    // 只在开发模式下加载开发目录的插件
    // 使用 app.isPackaged 判断更可靠,打包后为 true,开发时为 false
    if (!app.isPackaged) {
      this.devPluginsDir = this.resolveDevPluginsDir();
      if (this.devPluginsDir) {
        logger.info(`[PluginManager] Dev plugins dir resolved: ${this.devPluginsDir}`);
      } else {
        logger.warn('[PluginManager] Dev plugins dir not found, will only load installed plugins');
      }
    }
  }

  async init() {
    logger.info(`[PluginManager] Initializing... Plugins dir: ${this.pluginsDir}`);
    if (this.devPluginsDir) {
      logger.info(`[PluginManager] Dev plugins dir: ${this.devPluginsDir}`);
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
    
    logger.info(`[PluginManager] Loaded ${this.plugins.size} plugins.`);
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
      logger.error(`[PluginManager] Failed to scan plugins directory ${dir}:`, error);
    }
  }

  async loadPluginFromPath(pluginPath: string, isDev = false) {
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const rawManifest = JSON.parse(manifestContent) as PluginManifest;
      const manifest = this.normalizeManifest(rawManifest, pluginPath);
      
      if (!manifest) {
        return;
      }
      
      // Basic validation
      if (!manifest.id) {
        logger.error(`[PluginManager] Invalid manifest at ${pluginPath}: Missing id`);
        return;
      }

      const runtime: PluginRuntime = {
        id: manifest.id,
        manifest,
        path: pluginPath,
        status: 'stopped',
        isDev,
        mode: manifest.runtime?.type === 'standalone' ? 'standalone' : 'webview'
      };

      this.plugins.set(manifest.id, runtime);
      logger.info(`[PluginManager] Loaded plugin: ${manifest.name} (${manifest.id})${isDev ? ' [DEV]' : ''}`);
    } catch (error) {
      logger.error(`[PluginManager] Failed to load plugin at ${pluginPath}:`, error);
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

  private normalizeManifest(manifest: PluginManifest, pluginPath: string): PluginManifest | null {
    const normalizedPermissions = manifest.permissions ?? [];
    const protocolRange = manifest.protocol ?? DEFAULT_PROTOCOL_RANGE;

    if (!this.satisfiesProtocol(protocolRange, BOOLTOX_PROTOCOL_VERSION)) {
      logger.error(
        `[PluginManager] Plugin ${manifest.id ?? pluginPath} requires protocol ${protocolRange}, but host is ${BOOLTOX_PROTOCOL_VERSION}`,
      );
      return null;
    }

    const runtime = this.resolveRuntimeConfig(manifest, pluginPath);
    if (!runtime) {
      return null;
    }

    const normalizedMain =
      runtime.type === 'standalone'
        ? manifest.main ?? runtime.entry
        : runtime.ui.entry;

    return {
      ...manifest,
      permissions: normalizedPermissions,
      protocol: protocolRange,
      main: normalizedMain,
      runtime,
    };
  }

  private satisfiesProtocol(range: string, version: string): boolean {
    if (!range) {
      return true;
    }

    const compare = (a: string, b: string): number => {
      const parse = (input: string) => {
        const core = input.split('-')[0];
        const parts = core.split('.').map((part) => Number.parseInt(part, 10));
        if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
          return null;
        }
        return { major: parts[0], minor: parts[1], patch: parts[2] };
      };

      const left = parse(a);
      const right = parse(b);
      if (!left || !right) {
        return 0;
      }

      if (left.major !== right.major) return left.major - right.major;
      if (left.minor !== right.minor) return left.minor - right.minor;
      if (left.patch !== right.patch) return left.patch - right.patch;
      return 0;
    };

    if (range.startsWith('^')) {
      const base = range.slice(1);
      const baseParts = base.split('-')[0].split('.');
      const versionParts = version.split('-')[0].split('.');
      if (baseParts[0] !== versionParts[0]) {
        return false;
      }
      return compare(version, base) >= 0;
    }

    if (range.startsWith('>=')) {
      const base = range.slice(2);
      return compare(version, base) >= 0;
    }

    if (range.startsWith('=')) {
      const target = range.slice(1);
      return compare(version, target) === 0;
    }

    return compare(version, range) === 0;
  }

  private resolveRuntimeConfig(manifest: PluginManifest, pluginPath: string): PluginRuntimeConfig | null {
    const runtime = manifest.runtime;

    if (runtime && runtime.type === 'standalone') {
      if (!runtime.entry) {
        logger.error(`[PluginManager] Invalid manifest at ${pluginPath}: standalone runtime missing entry`);
        return null;
      }
      return {
        type: 'standalone',
        entry: runtime.entry,
        args: runtime.args,
        env: runtime.env,
        requirements: runtime.requirements,
      };
    }

    const entry = runtime?.ui?.entry ?? manifest.main;
    if (!entry) {
      logger.error(`[PluginManager] Invalid manifest at ${pluginPath}: Missing runtime.ui.entry or main`);
      return null;
    }

    return {
      type: 'webview',
      ui: {
        type: runtime?.ui?.type ?? 'webview',
        entry,
        assetsDir: runtime?.ui?.assetsDir,
      },
      backend: runtime?.backend,
    };
  }

  private resolveDevPluginsDir(): string | undefined {
    if (app.isPackaged) {
      return undefined;
    }

    const override = process.env.BOOLTOX_DEV_PLUGINS_DIR;
    if (override && fsSync.existsSync(override)) {
      return override;
    }

    const candidates = [
      path.resolve(process.cwd(), 'plugins'),
      path.resolve(process.cwd(), 'packages/client/plugins'),
      path.resolve(app.getAppPath(), 'plugins'),
      path.resolve(app.getAppPath(), '../plugins'),
    ];

    for (const dir of candidates) {
      if (fsSync.existsSync(dir)) {
        return dir;
      }
    }

    // 最后兜底返回默认路径（即使不存在，也让 scanDir 尝试一次）
    return candidates[0];
  }
}

export const pluginManager = new PluginManager();
