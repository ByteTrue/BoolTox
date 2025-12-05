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

// TODO: 实现更多运行时功能
// export { NodeRunner } from './node-runner.js';
// export { ProcessPool } from './process-pool.js';
