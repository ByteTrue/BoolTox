/**
 * @booltox/plugin-sdk
 *
 * BoolTox 插件开发 SDK
 * 为插件开发者提供类型安全的 API 封装
 */

// 重导出类型
export type * from '@booltox/shared/types';

// 导出 API 模块
export {
  isBooltoxAvailable,
  getBooltoxAPI,
  BooltoxClient,
  getBooltoxClient,
  booltox,
} from './api.js';

export { BackendClient, createBackendClient } from './backend.js';

export {
  useStorage,
  useBackend,
  useBackendEvent,
  useBackendCall,
  useWindowTitle,
} from './hooks.js';

export const PLUGIN_SDK_VERSION = '2.0.0';
