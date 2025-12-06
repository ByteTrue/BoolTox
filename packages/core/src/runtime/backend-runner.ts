/**
 * 后端进程管理器
 * 从 packages/client/electron/services/plugin/plugin-backend-runner.ts 迁移
 * 去除 Electron API，使用纯 Node.js 实现
 */

import { EventEmitter } from 'eventemitter3';
import { spawn, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import path from 'path';
import { existsSync } from 'fs';
import type { PluginBackendConfig } from '@booltox/shared';
import { getPythonManager } from './python-manager.js';

/**
 * JSON-RPC 响应/通知
 */
interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * 待处理请求
 */
interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  method: string;
}

/**
 * 后端进程信息
 */
interface BackendProcess {
  pluginId: string;
  config: PluginBackendConfig;
  process: ChildProcess;
  channelId: string;
  ready: boolean;
  pendingRequests: Map<string | number, PendingRequest>;
  lineBuffer: string;
  methods: string[];
}

/**
 * 后端事件类型
 */
export interface BackendEvent {
  channelId: string;
  type: 'ready' | 'event' | 'log' | 'exit' | 'error';
  data?: any;
}

/**
 * 后端进程管理器
 */
export class BackendRunner extends EventEmitter {
  private processes = new Map<string, BackendProcess>();
  private pythonManager = getPythonManager();

  /**
   * 注册并启动后端进程
   */
  async registerBackend(
    pluginId: string,
    pluginPath: string,
    config: PluginBackendConfig
  ): Promise<{ pid: number; channelId: string }> {
    const entryPath = path.isAbsolute(config.entry)
      ? config.entry
      : path.join(pluginPath, config.entry);

    // 生成唯一 channelId
    const channelId = `${pluginId}:${randomUUID()}`;

    const args = config.args ?? [];
    const env = {
      ...process.env,
      ...config.env,
      BOOLTOX_PLUGIN_ID: pluginId,
      BOOLTOX_CHANNEL_ID: channelId,
    };

    let child: ChildProcess;

    // 根据类型启动进程
    if (config.type === 'python') {
      // 检查并安装依赖
      if (config.requirements) {
        const requirementsPath = path.isAbsolute(config.requirements)
          ? config.requirements
          : path.join(pluginPath, config.requirements);

        if (existsSync(requirementsPath)) {
          const needsSetup = await this.pythonManager.needsPluginRequirementsSetup(
            pluginId,
            requirementsPath
          );

          if (needsSetup) {
            // 自动安装依赖
            await this.pythonManager.installPluginRequirements(
              pluginId,
              requirementsPath,
              (message) => {
                console.log(`[${pluginId}] ${message}`);
              }
            );
          }
        }
      }

      // 获取 Python 环境
      const pythonEnv = await this.pythonManager.resolveBackendEnvironment({
        pluginId,
        pluginPath,
        requirementsPath: config.requirements,
      });

      // Spawn Python 进程
      child = this.pythonManager.spawnPython(entryPath, args, {
        pythonPath: pythonEnv.pythonPath,
        venvPath: pythonEnv.venvPath,
        cwd: pluginPath,
        env: {
          ...env,
          VIRTUAL_ENV: pythonEnv.venvPath,
        },
      });
    } else if (config.type === 'node') {
      // Spawn Node.js 进程
      child = spawn(process.execPath, [entryPath, ...args], {
        cwd: pluginPath,
        env: {
          ...env,
          NODE_ENV: 'production',
        },
        stdio: 'pipe',
      });
    } else {
      throw new Error(`Unsupported backend type: ${config.type}`);
    }

    if (!child.pid) {
      throw new Error('Failed to spawn backend process');
    }

    // 创建进程信息
    const backendProcess: BackendProcess = {
      pluginId,
      config,
      process: child,
      channelId,
      ready: false,
      pendingRequests: new Map(),
      lineBuffer: '',
      methods: [],
    };

    this.processes.set(channelId, backendProcess);

    // 监听 stdout（JSON-RPC 消息）
    child.stdout?.on('data', (buffer: Buffer) => {
      this.handleStdout(channelId, buffer);
    });

    // 监听 stderr（日志）
    child.stderr?.on('data', (buffer: Buffer) => {
      const text = buffer.toString();
      console.error(`[${pluginId}] stderr:`, text);
      this.emit('message', {
        channelId,
        type: 'log',
        data: { level: 'error', message: text },
      } as BackendEvent);
    });

    // 监听进程退出
    child.on('exit', (code) => {
      console.log(`[${pluginId}] Backend process exited with code ${code}`);
      this.rejectAllPending(channelId, `Backend process exited with code ${code}`);
      this.emit('message', {
        channelId,
        type: 'exit',
        data: { code },
      } as BackendEvent);
      this.processes.delete(channelId);
    });

    // 监听进程错误
    child.on('error', (error) => {
      console.error(`[${pluginId}] Backend process error:`, error);
      this.rejectAllPending(channelId, `Backend process error: ${error.message}`);
      this.emit('message', {
        channelId,
        type: 'error',
        data: { error: error.message },
      } as BackendEvent);
    });

    return {
      pid: child.pid,
      channelId,
    };
  }

  /**
   * 处理 stdout（解析 JSON-RPC 消息）
   */
  private handleStdout(channelId: string, buffer: Buffer): void {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) return;

    // 累积缓冲区（处理不完整的行）
    backendProcess.lineBuffer += buffer.toString();

    // 按行分割
    const lines = backendProcess.lineBuffer.split('\n');
    backendProcess.lineBuffer = lines.pop() || '';

    // 处理每一行
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      console.log(`[${backendProcess.pluginId}] stdout:`, trimmed);

      try {
        const message: JsonRpcMessage = JSON.parse(trimmed);

        if (message.jsonrpc !== '2.0') {
          console.warn(`Invalid JSON-RPC message:`, message);
          continue;
        }

        // 处理响应
        if (message.id !== undefined) {
          this.handleResponse(channelId, message);
        }
        // 处理通知
        else if (message.method) {
          console.log(`[${backendProcess.pluginId}] 收到通知:`, message.method, message.params);
          this.handleNotification(channelId, message);
        }
      } catch (error) {
        console.error(`Failed to parse JSON-RPC message:`, trimmed, error);
      }
    }
  }

  /**
   * 处理 JSON-RPC 响应
   */
  private handleResponse(channelId: string, message: JsonRpcMessage): void {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) return;

    const pending = backendProcess.pendingRequests.get(message.id!);
    if (!pending) {
      console.warn(`No pending request for id: ${message.id}`);
      return;
    }

    // 清理
    clearTimeout(pending.timeout);
    backendProcess.pendingRequests.delete(message.id!);

    // 处理结果
    if (message.error) {
      pending.reject(new Error(message.error.message));
    } else {
      pending.resolve(message.result);
    }
  }

  /**
   * 处理 JSON-RPC 通知（$ready, $event, $log 等）
   */
  private handleNotification(channelId: string, message: JsonRpcMessage): void {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) return;

    const method = message.method!;
    const params = message.params || {};

    // 处理保留方法
    if (method === '$ready') {
      backendProcess.ready = true;
      backendProcess.methods = params.methods || [];
      console.log(`[${backendProcess.pluginId}] Backend ready, methods:`, backendProcess.methods);
      const event: BackendEvent = {
        channelId,
        type: 'ready',
        data: params,
      };
      console.log(`[BackendRunner] 触发 message 事件:`, event);
      this.emit('message', event);
    } else if (method === '$event') {
      const event: BackendEvent = {
        channelId,
        type: 'event',
        data: params,
      };
      console.log(`[BackendRunner] 触发 message 事件 ($event):`, event);
      this.emit('message', event);
    } else if (method === '$log') {
      const event: BackendEvent = {
        channelId,
        type: 'log',
        data: params,
      };
      this.emit('message', event);
    }
  }

  /**
   * 调用后端方法（JSON-RPC call）
   */
  async call<TResult = any>(
    channelId: string,
    method: string,
    params?: any,
    timeout: number = 30000
  ): Promise<TResult> {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) {
      throw new Error(`Backend not found: ${channelId}`);
    }

    if (!backendProcess.process.stdin) {
      throw new Error('Backend process stdin not available');
    }

    // 生成请求 ID
    const id = randomUUID();

    // 创建请求
    const request = {
      jsonrpc: '2.0' as const,
      id,
      method,
      params,
    };

    // 发送请求
    backendProcess.process.stdin.write(JSON.stringify(request) + '\n');

    // 等待响应
    return new Promise<TResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        backendProcess.pendingRequests.delete(id);
        reject(new Error(`RPC call "${method}" timeout after ${timeout}ms`));
      }, timeout);

      backendProcess.pendingRequests.set(id, {
        resolve,
        reject,
        timeout: timeoutHandle,
        method,
      });
    });
  }

  /**
   * 发送通知到后端（JSON-RPC notify，无返回值）
   */
  async notify(channelId: string, method: string, params?: any): Promise<void> {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) {
      throw new Error(`Backend not found: ${channelId}`);
    }

    if (!backendProcess.process.stdin) {
      throw new Error('Backend process stdin not available');
    }

    const notification = {
      jsonrpc: '2.0' as const,
      method,
      params,
    };

    backendProcess.process.stdin.write(JSON.stringify(notification) + '\n');
  }

  /**
   * 销毁后端进程
   */
  async dispose(channelId: string): Promise<void> {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) {
      return;
    }

    // 拒绝所有待处理的请求
    this.rejectAllPending(channelId, 'Backend process disposed');

    // 杀死进程
    backendProcess.process.kill('SIGTERM');

    // 等待进程退出
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        backendProcess.process.kill('SIGKILL');
        resolve();
      }, 5000);

      backendProcess.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });

    this.processes.delete(channelId);
  }

  /**
   * 检查后端是否就绪
   */
  isReady(channelId: string): boolean {
    const backendProcess = this.processes.get(channelId);
    return backendProcess?.ready || false;
  }

  /**
   * 等待后端就绪
   */
  async waitForReady(channelId: string, timeout: number = 10000): Promise<void> {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) {
      throw new Error(`Backend not found: ${channelId}`);
    }

    if (backendProcess.ready) {
      return;
    }

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        reject(new Error(`Backend not ready after ${timeout}ms`));
      }, timeout);

      const handler = (event: BackendEvent) => {
        if (event.channelId === channelId && event.type === 'ready') {
          clearTimeout(timeoutHandle);
          this.off('message', handler);
          resolve();
        }
      };

      this.on('message', handler);
    });
  }

  /**
   * 拒绝所有待处理的请求
   */
  private rejectAllPending(channelId: string, reason: string): void {
    const backendProcess = this.processes.get(channelId);
    if (!backendProcess) return;

    for (const [id, pending] of backendProcess.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }

    backendProcess.pendingRequests.clear();
  }

  /**
   * 获取所有后端进程
   */
  getAllBackends(): Array<{
    channelId: string;
    pluginId: string;
    pid: number;
    ready: boolean;
    methods: string[];
  }> {
    return Array.from(this.processes.values()).map((p) => ({
      channelId: p.channelId,
      pluginId: p.pluginId,
      pid: p.process.pid!,
      ready: p.ready,
      methods: p.methods,
    }));
  }

  /**
   * 销毁所有后端进程
   */
  async disposeAll(): Promise<void> {
    const channelIds = Array.from(this.processes.keys());
    await Promise.all(channelIds.map((id) => this.dispose(id)));
  }
}

/**
 * 创建后端管理器单例
 */
let _backendRunner: BackendRunner | null = null;

export function getBackendRunner(): BackendRunner {
  if (!_backendRunner) {
    _backendRunner = new BackendRunner();
  }
  return _backendRunner;
}
