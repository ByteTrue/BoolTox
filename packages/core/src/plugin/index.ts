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

// TODO: 实现更多插件相关功能
// export { PluginInstaller } from './plugin-installer.js';
// export { PluginLifecycle } from './plugin-lifecycle.js';
