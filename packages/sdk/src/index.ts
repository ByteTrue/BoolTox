/**
 * @booltox/sdk
 *
 * BoolTox 前端 SDK
 * 用于 Web 前端连接和调用 Agent API
 */

// 导出类型
export type { AgentInfo, AgentDetectorOptions } from './agent-detector';
export type {
  AgentClientOptions,
  PluginInfo,
  PluginInstallOptions,
} from './agent-client';

// 导出核心功能
export { AgentDetector, detectAgent } from './agent-detector';
export { AgentClient, createAgentClient } from './agent-client';

export const SDK_VERSION = '0.1.0';
