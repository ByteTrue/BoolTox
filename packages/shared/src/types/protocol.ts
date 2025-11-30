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
  pluginId: string;
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

export type PluginActivationEvent =
  | 'onStartup'
  | 'onCommands'
  | 'onView'
  | 'onWorkspace'
  | 'onDemand';

export interface PluginCapabilityRequest {
  module: keyof BooltoxAPI;
  permissions: BooltoxPermission[];
  reason?: string;
}

export interface PluginBackendConfig {
  type: 'python' | 'node' | 'process';
  entry: string;
  args?: string[];
  env?: Record<string, string>;
  keepAlive?: boolean;
  /** Relative path to requirements.txt for Python backend */
  requirements?: string;
}

export interface PluginUiRuntime {
  type: 'webview';
  entry: string;
  assetsDir?: string;
}

export interface PluginWebRuntimeConfig {
  type?: 'webview';
  ui: PluginUiRuntime;
  backend?: PluginBackendConfig;
}

export interface PluginStandaloneRuntimeConfig {
  type: 'standalone';
  entry: string;
  args?: string[];
  env?: Record<string, string>;
  requirements?: string;
}

export type PluginRuntimeConfig = PluginWebRuntimeConfig | PluginStandaloneRuntimeConfig;
