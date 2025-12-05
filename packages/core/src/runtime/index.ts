/**
 * 运行时管理模块
 *
 * 从 packages/client/electron/services 迁移而来
 * Python/Node.js 环境管理、进程调度
 */

export { PythonManager, getPythonManager } from './python-manager.js';
export type {
  PythonStatus,
  RunScriptOptions,
  RunScriptResult,
  PythonManagerConfig,
} from './python-manager.js';

export { BackendRunner, getBackendRunner } from './backend-runner.js';
export type { BackendEvent } from './backend-runner.js';
