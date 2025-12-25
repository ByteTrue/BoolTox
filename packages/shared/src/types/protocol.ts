/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

export const BOOLTOX_PROTOCOL_VERSION = '2.0.0';

export type BooltoxPermission =
  | 'window.hide'
  | 'window.show'
  | 'window.setBounds'
  | 'window.setTitle'
  | 'window.minimize'
  | 'window.maximize'
  | 'window.close'
  | 'fs.read'
  | 'fs.write'
  | 'fs.list'
  | 'fs.stat'
  | 'storage.get'
  | 'storage.set'
  | 'storage.delete'
  | 'shell.exec'
  | 'shell.spawn'
  | 'shell.python'
  | 'python.install'
  | 'python.run'
  | 'python.inspect'
  | 'backend.register'
  | 'backend.message'
  | 'telemetry.send';

export interface BooltoxShellExecOptions {
  command: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface BooltoxShellExecResult {
  success: boolean;
  code?: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface BooltoxProcessHandle {
  pid: number;
  channelId: string;
}

export interface BooltoxPythonRunOptions {
  scriptPath: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface BooltoxShellAPI {
  exec(command: string, args?: string[]): Promise<BooltoxShellExecResult>;
  spawn(options: BooltoxShellExecOptions): Promise<BooltoxProcessHandle>;
  runPython(scriptPath: string, args?: string[], timeoutMs?: number): Promise<BooltoxPythonExecutionResult>;
}

export interface BooltoxPythonStatus {
  uvAvailable: boolean;
  uvVersion?: string;
  pythonInstalled: boolean;
  pythonVersion?: string;
  pythonPath?: string;
  venvExists: boolean;
  venvPath?: string;
}

export interface BooltoxPythonExecutionResult {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export interface BooltoxPythonAPI {
  getStatus(): Promise<BooltoxPythonStatus>;
  ensure(): Promise<{ success: boolean; error?: string }>;
  installDeps(packages: string[]): Promise<{ success: boolean; error?: string }>;
  listDeps(): Promise<{ success: boolean; packages: string[]; error?: string }>;
  runCode(code: string, timeout?: number): Promise<BooltoxPythonExecutionResult>;
  runScript(scriptPath: string, args?: string[], timeout?: number): Promise<BooltoxPythonExecutionResult>;
}

export interface BooltoxWindowBounds {
  width: number;
  height: number;
}

export interface BooltoxWindowAPI {
  show(): Promise<void>;
  hide(): Promise<void>;
  setSize(width: number, height: number): Promise<void>;
  setTitle(title: string): Promise<void>;
  minimize(): Promise<void>;
  close(): Promise<void>;
  toggleMaximize(): Promise<void>;
}

export type BooltoxEncoding =
  | 'utf8'
  | 'utf16le'
  | 'ascii'
  | 'base64'
  | 'hex'
  | 'latin1';

export interface BooltoxFsEntry {
  name: string;
  isDirectory: boolean;
  size?: number;
  modifiedAt?: string;
}

export interface BooltoxFsAPI {
  readFile(path: string, encoding?: BooltoxEncoding): Promise<string>;
  writeFile(path: string, data: string | Uint8Array, encoding?: BooltoxEncoding): Promise<void>;
  listDir(path?: string): Promise<BooltoxFsEntry[]>;
  stat(path: string): Promise<BooltoxFsEntry>;
}

export interface BooltoxStorageAPI {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  list(): Promise<string[]>;
}

export interface BooltoxBackendRegistration {
  type: 'python' | 'node' | 'process';
  entry: string;
  args?: string[];
  env?: Record<string, string>;
}

export type BooltoxBackendMessageType = 'stdout' | 'stderr' | 'exit' | 'error';

export interface BooltoxBackendMessage {
  toolId: string;
  channelId: string;
  type: BooltoxBackendMessageType;
  data?: string;
  code?: number | null;
  timestamp: string;
}

export interface BooltoxBackendAPI {
  register(definition?: BooltoxBackendRegistration): Promise<BooltoxProcessHandle>;
  postMessage(channelId: string, payload: unknown): Promise<void>;
  dispose(channelId: string): Promise<void>;
  onMessage(listener: (message: BooltoxBackendMessage) => void): () => void;
  call<TParams = unknown, TResult = unknown>(
    channelId: string,
    method: string,
    params?: TParams,
    timeoutMs?: number
  ): Promise<TResult>;
  notify<TParams = unknown>(
    channelId: string,
    method: string,
    params?: TParams
  ): Promise<void>;
  on(channelId: string, event: string, listener: (data: unknown) => void): () => void;
  once(channelId: string, event: string, listener: (data: unknown) => void): () => void;
  off(channelId: string, event: string, listener?: (data: unknown) => void): void;
  isReady(channelId: string): boolean;
  waitForReady(channelId: string, timeoutMs?: number): Promise<void>;
}

export interface BooltoxTelemetryAPI {
  send(event: string, payload?: Record<string, unknown>): Promise<void>;
}

export interface BooltoxAPI {
  window: BooltoxWindowAPI;
  fs: BooltoxFsAPI;
  storage: BooltoxStorageAPI;
  shell: BooltoxShellAPI;
  python: BooltoxPythonAPI;
  backend: BooltoxBackendAPI;
  telemetry: BooltoxTelemetryAPI;
}

export type ToolActivationEvent =
  | 'onStartup'
  | 'onCommands'
  | 'onView'
  | 'onWorkspace'
  | 'onDemand';

export interface ToolCapabilityRequest {
  module: keyof BooltoxAPI;
  permissions: BooltoxPermission[];
  reason?: string;
}

export interface ToolBackendConfig {
  type: 'python' | 'node' | 'process';
  entry: string | PlatformSpecificEntry;  // 支持平台特定入口
  args?: string[];
  env?: Record<string, string>;
  keepAlive?: boolean;
  /** Relative path to requirements.txt for Python backend */
  requirements?: string;
}

/**
 * 平台特定的入口文件配置
 * 用于 binary 工具跨平台分发
 */
export interface PlatformSpecificEntry {
  'darwin-arm64'?: string;  // macOS Apple Silicon
  'darwin-x64'?: string;    // macOS Intel
  'win32-x64'?: string;     // Windows x64
  'linux-x64'?: string;     // Linux x64
  'linux-arm64'?: string;   // Linux ARM64（如树莓派）
}

export interface ToolStandaloneRuntimeConfig {
  type: 'standalone';
  entry: string;
  args?: string[];
  env?: Record<string, string>;
  requirements?: string;
}

/**
 * 二进制工具运行时配置
 */
export interface ToolBinaryRuntimeConfig {
  type: 'binary';
  /** 可执行文件路径（相对于工具目录，或绝对路径） */
  command: string;
  /** 启动参数 */
  args?: string[];
  /** 环境变量 */
  env?: Record<string, string>;
  /** 工作目录（可选，默认为工具目录） */
  cwd?: string;
  /** 本地可执行文件路径（仅用于标记用户本地添加的工具） */
  localExecutablePath?: string;
}

/**
 * HTTP 服务工具运行时配置
 * 工具启动本地 HTTP 服务器，BoolTox 在浏览器中打开
 */
export interface ToolHttpServiceRuntimeConfig {
  type: 'http-service';
  /** 后端配置 */
  backend: ToolBackendConfig & {
    /** 服务监听端口 */
    port: number;
    /** 服务主机（默认 127.0.0.1） */
    host?: string;
  };
  /** 可选：自定义 URL 路径（默认为 /） */
  path?: string;
  /** 可选：等待服务就绪的超时时间（毫秒，默认 30000） */
  readyTimeout?: number;
}

/**
 * CLI 工具运行时配置
 * 工具在系统终端中运行
 */
export interface ToolCliRuntimeConfig {
  type: 'cli';
  /** 后端配置 */
  backend: ToolBackendConfig;
  /** 可选：工作目录（默认为工具目录） */
  cwd?: string;
  /** 可选：终端窗口标题 */
  title?: string;
  /** 可选：是否在工具退出后保持终端窗口打开（默认 true） */
  keepOpen?: boolean;
}

export type ToolRuntimeConfig =
  | ToolStandaloneRuntimeConfig
  | ToolBinaryRuntimeConfig
  | ToolHttpServiceRuntimeConfig
  | ToolCliRuntimeConfig;
