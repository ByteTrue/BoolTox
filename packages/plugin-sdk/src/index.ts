/**
 * @booltox/plugin-sdk
 *
 * BoolTox 插件开发 SDK
 * 为插件开发者提供类型安全的 API 封装
 */

// 重导出类型
export type * from '@booltox/shared/types';

// 导出 API 模块
export * from './api.js';
export * from './backend.js';
export * from './hooks.js';

// TODO: 实现完整的 SDK
export const PLUGIN_SDK_VERSION = '2.0.0';
