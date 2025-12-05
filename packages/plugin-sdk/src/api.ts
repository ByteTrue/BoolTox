/**
 * API 封装模块
 * 提供类型安全的 window.booltox API 访问
 */

import type {
  BooltoxAPI,
  BooltoxWindowAPI,
  BooltoxFsAPI,
  BooltoxStorageAPI,
  BooltoxShellAPI,
  BooltoxPythonAPI,
  BooltoxBackendAPI,
  BooltoxTelemetryAPI,
  BooltoxEncoding,
  BooltoxFsEntry,
  BooltoxShellExecOptions,
  BooltoxShellExecResult,
  BooltoxProcessHandle,
  BooltoxPythonExecutionResult,
  BooltoxPythonStatus,
} from '@booltox/shared/types';

// 声明全局类型
declare global {
  interface Window {
    booltox?: BooltoxAPI;
  }
}

/**
 * 检查 Booltox API 是否可用
 */
export function isBooltoxAvailable(): boolean {
  return typeof window !== 'undefined' && !!window.booltox;
}

/**
 * 获取 Booltox API（带错误处理）
 */
export function getBooltoxAPI(): BooltoxAPI {
  if (!isBooltoxAvailable()) {
    throw new Error(
      'Booltox API not available. This plugin must run inside BoolTox environment.'
    );
  }
  return window.booltox!;
}

/**
 * Booltox 客户端类
 * 提供类型安全的 API 访问和便捷方法
 */
export class BooltoxClient {
  private api: BooltoxAPI;

  constructor() {
    this.api = getBooltoxAPI();
  }

  // ==================== 窗口 API ====================

  get window(): BooltoxWindowAPI {
    return this.api.window;
  }

  /**
   * 设置窗口标题
   */
  async setTitle(title: string): Promise<void> {
    return this.api.window.setTitle(title);
  }

  /**
   * 显示窗口
   */
  async showWindow(): Promise<void> {
    return this.api.window.show();
  }

  /**
   * 隐藏窗口
   */
  async hideWindow(): Promise<void> {
    return this.api.window.hide();
  }

  /**
   * 设置窗口大小
   */
  async setWindowSize(width: number, height: number): Promise<void> {
    return this.api.window.setSize(width, height);
  }

  /**
   * 最小化窗口
   */
  async minimizeWindow(): Promise<void> {
    return this.api.window.minimize();
  }

  /**
   * 关闭窗口
   */
  async closeWindow(): Promise<void> {
    return this.api.window.close();
  }

  // ==================== 文件系统 API ====================

  get fs(): BooltoxFsAPI {
    return this.api.fs;
  }

  /**
   * 读取文件
   */
  async readFile(path: string, encoding: BooltoxEncoding = 'utf8'): Promise<string> {
    return this.api.fs.readFile(path, encoding);
  }

  /**
   * 写入文件
   */
  async writeFile(
    path: string,
    data: string | Uint8Array,
    encoding: BooltoxEncoding = 'utf8'
  ): Promise<void> {
    return this.api.fs.writeFile(path, data, encoding);
  }

  /**
   * 列出目录
   */
  async listDirectory(path?: string): Promise<BooltoxFsEntry[]> {
    return this.api.fs.listDir(path);
  }

  /**
   * 获取文件/目录信息
   */
  async getFileInfo(path: string): Promise<BooltoxFsEntry> {
    return this.api.fs.stat(path);
  }

  // ==================== 存储 API ====================

  get storage(): BooltoxStorageAPI {
    return this.api.storage;
  }

  /**
   * 获取存储值
   */
  async getStorage<T = unknown>(key: string): Promise<T | undefined> {
    return this.api.storage.get<T>(key);
  }

  /**
   * 设置存储值
   */
  async setStorage<T = unknown>(key: string, value: T): Promise<void> {
    return this.api.storage.set(key, value);
  }

  /**
   * 删除存储值
   */
  async deleteStorage(key: string): Promise<void> {
    return this.api.storage.delete(key);
  }

  /**
   * 列出所有存储键
   */
  async listStorageKeys(): Promise<string[]> {
    return this.api.storage.list();
  }

  // ==================== Shell API ====================

  get shell(): BooltoxShellAPI {
    return this.api.shell;
  }

  /**
   * 执行 Shell 命令
   */
  async execCommand(command: string, args?: string[]): Promise<BooltoxShellExecResult> {
    return this.api.shell.exec(command, args);
  }

  /**
   * 启动进程
   */
  async spawnProcess(options: BooltoxShellExecOptions): Promise<BooltoxProcessHandle> {
    return this.api.shell.spawn(options);
  }

  // ==================== Python API ====================

  get python(): BooltoxPythonAPI {
    return this.api.python;
  }

  /**
   * 获取 Python 状态
   */
  async getPythonStatus(): Promise<BooltoxPythonStatus> {
    return this.api.python.getStatus();
  }

  /**
   * 确保 Python 环境可用
   */
  async ensurePython(): Promise<{ success: boolean; error?: string }> {
    return this.api.python.ensure();
  }

  /**
   * 安装 Python 依赖
   */
  async installPythonPackages(packages: string[]): Promise<{
    success: boolean;
    error?: string;
  }> {
    return this.api.python.installDeps(packages);
  }

  /**
   * 运行 Python 代码
   */
  async runPythonCode(
    code: string,
    timeout?: number
  ): Promise<BooltoxPythonExecutionResult> {
    return this.api.python.runCode(code, timeout);
  }

  /**
   * 运行 Python 脚本
   */
  async runPythonScript(
    scriptPath: string,
    args?: string[],
    timeout?: number
  ): Promise<BooltoxPythonExecutionResult> {
    return this.api.python.runScript(scriptPath, args, timeout);
  }

  // ==================== 后端 API ====================

  get backend(): BooltoxBackendAPI {
    return this.api.backend;
  }

  // ==================== 遥测 API ====================

  get telemetry(): BooltoxTelemetryAPI {
    return this.api.telemetry;
  }

  /**
   * 发送遥测事件
   */
  async sendTelemetry(event: string, payload?: Record<string, unknown>): Promise<void> {
    return this.api.telemetry.send(event, payload);
  }
}

/**
 * 单例 Booltox 客户端
 */
let _booltoxClient: BooltoxClient | null = null;

/**
 * 获取或创建 Booltox 客户端单例
 */
export function getBooltoxClient(): BooltoxClient {
  if (!_booltoxClient) {
    _booltoxClient = new BooltoxClient();
  }
  return _booltoxClient;
}

/**
 * 默认导出（便捷访问）
 */
export const booltox = {
  /**
   * 检查 API 是否可用
   */
  isAvailable: isBooltoxAvailable,

  /**
   * 获取客户端实例
   */
  getClient: getBooltoxClient,
};
