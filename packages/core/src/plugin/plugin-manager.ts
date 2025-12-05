/**
 * 插件管理器
 * 从 packages/client/electron/services/plugin/plugin-manager.ts 迁移
 * 去除 Electron API，改为事件驱动架构
 */

import { EventEmitter } from 'eventemitter3';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import type { PluginManifest, PluginRuntimeConfig } from '@booltox/shared';

/**
 * 插件运行时状态
 */
export interface PluginRuntime {
  id: string;
  manifest: PluginManifest;
  path: string;
  status: 'stopped' | 'running' | 'loading' | 'error';
  mode: 'webview' | 'standalone';
  error?: string;
  isDev?: boolean;
}

/**
 * 插件管理器配置
 */
export interface PluginManagerConfig {
  /** 用户插件目录 */
  pluginsDir?: string;
  /** 开发插件目录（环境变量） */
  devPluginsDir?: string;
  /** 协议版本 */
  protocolVersion?: string;
}

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter {
  private plugins: Map<string, PluginRuntime> = new Map();
  private pluginsDir: string;
  private devPluginsDir?: string;
  private protocolVersion: string;

  constructor(config: PluginManagerConfig = {}) {
    super();

    const dataDir = path.join(
      process.env.HOME || process.env.USERPROFILE || '/tmp',
      '.booltox'
    );

    this.pluginsDir = config.pluginsDir || path.join(dataDir, 'plugins');
    this.devPluginsDir = config.devPluginsDir || process.env.BOOLTOX_DEV_PLUGINS_DIR;
    this.protocolVersion = config.protocolVersion || '2.0.0';
  }

  /**
   * 初始化并加载所有插件
   */
  async initialize(): Promise<void> {
    // 确保插件目录存在
    await fs.mkdir(this.pluginsDir, { recursive: true });

    console.log(`[PluginManager] Scanning user plugins: ${this.pluginsDir}`);
    // 扫描用户安装插件
    await this.scanPluginDir(this.pluginsDir, false);

    // 扫描开发插件
    if (this.devPluginsDir && existsSync(this.devPluginsDir)) {
      console.log(`[PluginManager] Scanning dev plugins: ${this.devPluginsDir}`);
      await this.scanPluginDir(this.devPluginsDir, true);
    } else {
      console.log(`[PluginManager] No dev plugins directory configured or not found`);
    }

    console.log(`[PluginManager] Loaded ${this.plugins.size} plugins`);

    this.emit('initialized', {
      totalPlugins: this.plugins.size,
      installedPlugins: Array.from(this.plugins.values()).filter(p => !p.isDev).length,
      devPlugins: Array.from(this.plugins.values()).filter(p => p.isDev).length,
    });
  }

  /**
   * 扫描插件目录（支持嵌套）
   */
  private async scanPluginDir(dir: string, isDev: boolean, depth: number = 0): Promise<void> {
    try {
      console.log(`[PluginManager] Scanning directory (depth=${depth}): ${dir}`);
      const entries = await fs.readdir(dir, { withFileTypes: true });

      console.log(`[PluginManager] Found ${entries.length} entries in ${dir}`);

      for (const entry of entries) {
        if (!entry.isDirectory()) {
          continue;
        }

        const fullPath = path.join(dir, entry.name);

        // 检查是否是插件目录（包含 manifest.json）
        const manifestPath = path.join(fullPath, 'manifest.json');
        if (existsSync(manifestPath)) {
          console.log(`[PluginManager] Found plugin manifest: ${manifestPath}`);
          await this.loadPluginFromPath(fullPath, isDev);
        } else if (depth < 2) {
          // 如果不是插件目录，继续递归扫描（最多 2 层）
          console.log(`[PluginManager] Recursing into: ${fullPath}`);
          await this.scanPluginDir(fullPath, isDev, depth + 1);
        }
      }
    } catch (error) {
      console.error(`Failed to scan plugin directory ${dir}:`, error);
    }
  }

  /**
   * 从路径加载插件
   */
  private async loadPluginFromPath(pluginPath: string, isDev: boolean): Promise<void> {
    try {
      const manifestPath = path.join(pluginPath, 'manifest.json');

      if (!existsSync(manifestPath)) {
        return;
      }

      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const rawManifest = JSON.parse(manifestContent) as PluginManifest;
      const manifest = this.normalizeManifest(rawManifest, pluginPath);

      if (!manifest) {
        return;
      }

      // 检查协议版本
      if (!this.isProtocolCompatible(manifest.protocol)) {
        console.warn(`Plugin ${manifest.id} requires incompatible protocol version: ${manifest.protocol}`);
        return;
      }

      // 确定运行模式
      const mode = manifest.runtime?.type === 'standalone' ? 'standalone' : 'webview';

      const runtime: PluginRuntime = {
        id: manifest.id,
        manifest,
        path: pluginPath,
        status: 'stopped',
        mode,
        isDev,
      };

      this.plugins.set(manifest.id, runtime);
      this.emit('plugin-loaded', runtime);

      console.log(`Loaded plugin: ${manifest.name} (${manifest.id})`);
    } catch (error) {
      console.error(`Failed to load plugin at ${pluginPath}:`, error);
    }
  }

  /**
   * 规范化 manifest
   */
  private normalizeManifest(raw: PluginManifest, pluginPath: string): PluginManifest | null {
    // 基础验证
    if (!raw.id || !raw.version || !raw.name) {
      return null;
    }

    return {
      ...raw,
      protocol: raw.protocol || '^2.0.0',
      permissions: raw.permissions || [],
    };
  }

  /**
   * 检查协议版本兼容性
   */
  private isProtocolCompatible(required?: string): boolean {
    if (!required) {
      return true;
    }

    // 简化版本检查（仅支持 ^2.0.0 格式）
    if (required.startsWith('^')) {
      const majorVersion = required.slice(1).split('.')[0];
      const currentMajor = this.protocolVersion.split('.')[0];
      return majorVersion === currentMajor;
    }

    return required === this.protocolVersion;
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): PluginRuntime[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取单个插件
   */
  getPlugin(pluginId: string): PluginRuntime | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 重新加载插件
   */
  async reloadPlugins(): Promise<void> {
    this.plugins.clear();
    await this.initialize();
  }
}

/**
 * 创建插件管理器单例
 */
let _pluginManager: PluginManager | null = null;

export function getPluginManager(config?: PluginManagerConfig): PluginManager {
  if (!_pluginManager) {
    _pluginManager = new PluginManager(config);
  }
  return _pluginManager;
}
