/**
 * 插件管理模块
 *
 * 从 packages/client/electron/services/plugin 迁移而来
 * 去除 Electron API，改为事件驱动架构
 */

export { PluginManager, getPluginManager } from './plugin-manager.js';
export type {
  PluginRuntime,
  PluginManagerConfig,
} from './plugin-manager.js';

export { PluginInstaller, getPluginInstaller } from './plugin-installer.js';
export type {
  PluginInstallProgress,
  PluginRegistryEntry,
  PluginInstallOptions,
} from './plugin-installer.js';
