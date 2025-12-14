/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { EventEmitter } from 'node:events';
import { app } from 'electron';
import type { ToolBackendConfig, ToolRuntime } from '@booltox/shared';
import {
  type JsonRpcResponse,
  type JsonRpcNotification,
  BackendReservedMethods,
  createRequest,
  isJsonRpcResponse,
  isJsonRpcNotification,
} from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { resolveEntryPath } from '../../utils/platform-utils.js';
import { pythonManager } from '../python-manager.service.js';
import { nodeManager } from '../node-manager.service.js';
import type { ChildProcess } from 'node:child_process';

const logger = createLogger('ToolBackendRunner');

// Default timeout for RPC calls (30 seconds)
const DEFAULT_RPC_TIMEOUT = 30000;

// ============================================================================
// Types
// ============================================================================

export interface BackendMessagePayload {
  toolId: string;
  channelId: string;
  type: 'stdout' | 'stderr' | 'exit' | 'error' | 'jsonrpc';
  data?: string;
  code?: number | null;
  webContentsId: number;
  // JSON-RPC specific fields
  jsonrpc?: JsonRpcResponse | JsonRpcNotification;
}

interface PendingRequest {
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
  method: string;
  startTime: number;
}

interface BackendProcess {
  toolId: string;
  config: ToolBackendConfig;
  process: ChildProcess;
  channelId: string;
  webContentsId: number;
  // JSON-RPC state
  ready: boolean;
  pendingRequests: Map<string | number, PendingRequest>;
  lineBuffer: string;
  methods: string[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function isChildProcessWithStreams(proc: ChildProcess): proc is ChildProcessWithoutNullStreams {
  return Boolean(proc.stdout && proc.stderr && proc.stdin);
}

/**
 * Parse JSON-RPC messages from a line of text
 */
function parseJsonRpcMessage(line: string): JsonRpcResponse | JsonRpcNotification | null {
  try {
    const parsed = JSON.parse(line);
    // Check if it's a valid JSON-RPC 2.0 message (response or notification)
    if (parsed && parsed.jsonrpc === '2.0') {
      if (isJsonRpcResponse(parsed) || isJsonRpcNotification(parsed)) {
        return parsed;
      }
    }
    return null;
  } catch {
    return null;
  }
}

let pythonDepsInstallerModule: Promise<typeof import('../../windows/python-deps-installer.js')> | null = null;

function loadPythonDepsInstaller() {
  if (!pythonDepsInstallerModule) {
    pythonDepsInstallerModule = import('../../windows/python-deps-installer.js');
  }
  return pythonDepsInstallerModule;
}


// ============================================================================
// PluginBackendRunner Class
// ============================================================================

export class PluginBackendRunner extends EventEmitter {
  private processes = new Map<string, BackendProcess>();

  /**
   * Register and start a backend process for a tool
   */
  async registerBackend(
    tool: ToolRuntime,
    config: ToolBackendConfig,
    webContentsId: number
  ): Promise<{ pid: number; channelId: string }> {
    const entryPath = resolveEntryPath(config.entry, tool.path);
    const args = config.args ?? [];
    const env = { ...process.env, ...config.env };

    let child: ChildProcess;

    if (config.type === 'python') {
      // 检查是否需要显示依赖安装窗口
      if (config.requirements) {
        const requirementsPath = path.isAbsolute(config.requirements)
          ? config.requirements
          : path.join(tool.path, config.requirements);

        // 检查 requirements.txt 是否存在
        if (fs.existsSync(requirementsPath)) {
          const needsSetup = pythonManager.needsToolRequirementsSetup(tool.id, requirementsPath);
          if (needsSetup) {
            logger.info(`工具 ${tool.id} 需要安装依赖，显示安装窗口`);

            const { showPythonDepsInstaller } = await loadPythonDepsInstaller();
            const result = await showPythonDepsInstaller({
              toolId: tool.id,
              toolName: tool.manifest.name,
              toolPath: tool.path,
              requirementsPath,
            });

            if (!result.success) {
              const errorMsg = result.cancelled
                ? '用户取消了依赖安装'
                : '依赖安装失败';
              logger.warn(`工具 ${tool.id}: ${errorMsg}`);
              throw new Error(errorMsg);
            }

            logger.info(`工具 ${tool.id} 依赖安装成功`);
          }
        }
      }

      const sdkPath = pythonManager.getPythonSdkPath();
      logger.info(`工具 ${tool.id} Python SDK 路径: ${sdkPath}`);
      logger.info(`SDK 路径是否存在: ${fs.existsSync(sdkPath)}`);
      logger.info(`SDK booltox_sdk.py 是否存在: ${fs.existsSync(path.join(sdkPath, 'booltox_sdk.py'))}`);

      const environment = await pythonManager.resolveBackendEnvironment({
        toolId: tool.id,
        toolPath: tool.path,
        requirementsPath: config.requirements,
      });
      const pythonPathEntries = [sdkPath, ...environment.additionalPythonPaths].filter(Boolean);
      const pythonPathValue = pythonPathEntries.join(path.delimiter);

      logger.info(`工具 ${tool.id} PYTHONPATH: ${pythonPathValue}`);

      child = pythonManager.spawnPython(entryPath, args, {
        cwd: tool.path,
        env: {
          ...env,
          ...(environment.venvPath ? { VIRTUAL_ENV: environment.venvPath } : {}),
          PYTHONPATH: pythonPathValue,
          BOOLTOX_PLUGIN_ID: tool.id,
          BOOLTOX_CHANNEL_ID: '', // Will be set after channelId is generated
        },
        pythonPath: environment.pythonPath,
        venvPath: environment.venvPath,
      });
    } else if (config.type === 'node') {
      // 确保 Node.js 可用
      logger.info('[NodeBackend] 确保 Node.js 环境...');
      const nodePath = await nodeManager.ensureNode((progress) => {
        logger.info(`[NodeBackend] ${progress.message}`);
        // TODO: 发送进度到渲染进程
      });

      logger.info(`[NodeBackend] 使用 Node.js: ${nodePath}`);

      // 使用 NodeManager 提供的 Node.js 启动
      child = spawn(nodePath, [entryPath, ...args], {
        cwd: tool.path,
        env: {
          ...env,
          BOOLTOX_PLUGIN_ID: tool.id,
        },
        stdio: 'pipe',
      });
    } else {
      child = spawn(entryPath, args, {
        cwd: tool.path,
        env,
        stdio: 'pipe',
      });
    }

    if (!isChildProcessWithStreams(child)) {
      child.kill();
      throw new Error('Backend process does not expose stdio streams');
    }

    const channelId = `${tool.id}:${randomUUID()}`;
    const record: BackendProcess = {
      toolId: tool.id,
      config,
      process: child,
      channelId,
      webContentsId,
      ready: false,
      pendingRequests: new Map(),
      lineBuffer: '',
      methods: [],
    };

    this.processes.set(channelId, record);
    logger.info(`Started backend ${channelId} for tool ${tool.id} (${config.type})`);

    // Set up stdout handler for JSON-RPC messages
    child.stdout.on('data', (buffer: Buffer) => {
      this.handleStdout(channelId, buffer);
    });

    // stderr is for logs/errors, not JSON-RPC
    child.stderr.on('data', (buffer: Buffer) => {
      const data = buffer.toString();
      logger.debug(`[${channelId}] stderr: ${data}`);
      this.emit('message', {
        toolId: tool.id,
        channelId,
        type: 'stderr',
        data,
        code: null,
        webContentsId,
      });
    });

    child.on('exit', (code) => {
      // Reject all pending requests
      this.rejectAllPending(channelId, 'Backend process exited');

      this.emit('message', {
        toolId: tool.id,
        channelId,
        type: 'exit',
        code: code ?? null,
        webContentsId,
      });
      this.processes.delete(channelId);
      logger.info(`Backend ${channelId} exited with code ${code}`);
    });

    child.on('error', (error) => {
      // Reject all pending requests
      this.rejectAllPending(channelId, error.message);

      this.emit('message', {
        toolId: tool.id,
        channelId,
        type: 'error',
        data: error.message,
        code: null,
        webContentsId,
      });
    });

    return {
      pid: child.pid ?? -1,
      channelId,
    };
  }

  /**
   * Handle stdout data - parse JSON-RPC messages line by line
   */
  private handleStdout(channelId: string, buffer: Buffer): void {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    // Append to line buffer
    proc.lineBuffer += buffer.toString();

    // Process complete lines
    const lines = proc.lineBuffer.split('\n');
    proc.lineBuffer = lines.pop() ?? ''; // Keep incomplete line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const message = parseJsonRpcMessage(trimmed);
      if (message) {
        this.handleJsonRpcMessage(channelId, message);
      } else {
        // Non-JSON-RPC output, emit as stdout
        this.emit('message', {
          toolId: proc.toolId,
          channelId,
          type: 'stdout',
          data: trimmed,
          code: null,
          webContentsId: proc.webContentsId,
        });
      }
    }
  }

  /**
   * Handle a parsed JSON-RPC message
   */
  private handleJsonRpcMessage(
    channelId: string,
    message: JsonRpcResponse | JsonRpcNotification
  ): void {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    if (isJsonRpcResponse(message)) {
      // This is a response to a request we sent
      if (message.id === null) return;
      const pending = proc.pendingRequests.get(message.id);
      if (pending) {
        clearTimeout(pending.timeout);
        proc.pendingRequests.delete(message.id);

        if ('error' in message) {
          const err = new Error(message.error.message);
          (err as Error & { code: number }).code = message.error.code;
          pending.reject(err);
        } else {
          pending.resolve(message.result);
        }

        const duration = Date.now() - pending.startTime;
        logger.debug(`RPC ${pending.method} completed in ${duration}ms`);
      } else {
        logger.warn(`Received response for unknown request id: ${message.id}`);
      }
    } else if (isJsonRpcNotification(message)) {
      // This is a notification from the backend
      this.handleNotification(channelId, message);
    }
  }

  /**
   * Handle backend notifications
   */
  private handleNotification(channelId: string, notification: JsonRpcNotification): void {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    const { method, params } = notification;

    switch (method) {
      case BackendReservedMethods.READY: {
        proc.ready = true;
        const readyParams = params as { version?: string; methods?: string[] } | undefined;
        proc.methods = readyParams?.methods ?? [];
        logger.info(`Backend ${channelId} is ready (methods: ${proc.methods.join(', ')})`);
        this.emit('ready', { channelId, toolId: proc.toolId, webContentsId: proc.webContentsId });
        break;
      }

      case BackendReservedMethods.EVENT: {
        const eventParams = params as { event: string; data?: unknown } | undefined;
        if (eventParams?.event) {
          this.emit('backend-event', {
            channelId,
            toolId: proc.toolId,
            event: eventParams.event,
            data: eventParams.data,
            webContentsId: proc.webContentsId,
          });
        }
        break;
      }

      case BackendReservedMethods.LOG: {
        const logParams = params as {
          level: string;
          message: string;
          timestamp?: string;
        } | undefined;
        if (logParams) {
          const level = logParams.level || 'info';
          const message = `[${channelId}] ${logParams.message}`;
          switch (level) {
            case 'debug':
              logger.debug(message);
              break;
            case 'info':
              logger.info(message);
              break;
            case 'warn':
              logger.warn(message);
              break;
            case 'error':
              logger.error(message);
              break;
            default:
              logger.info(message);
          }
        }
        break;
      }

      default:
        // Custom notification - forward to renderer
        this.emit('message', {
          toolId: proc.toolId,
          channelId,
          type: 'jsonrpc',
          jsonrpc: notification,
          webContentsId: proc.webContentsId,
        });
    }
  }

  /**
   * Call a method on the backend (JSON-RPC request)
   */
  async call<TParams = unknown, TResult = unknown>(
    channelId: string,
    method: string,
    params?: TParams,
    timeoutMs: number = DEFAULT_RPC_TIMEOUT
  ): Promise<TResult> {
    const proc = this.processes.get(channelId);
    if (!proc) {
      throw new Error(`Backend channel ${channelId} not found`);
    }

    const stdin = proc.process.stdin;
    if (!stdin || stdin.destroyed) {
      throw new Error(`Backend channel ${channelId} stdin not available`);
    }

    const id = randomUUID();
    const request = createRequest(id, method, params);

    return new Promise<TResult>((resolve, reject) => {
      const timeout = setTimeout(() => {
        proc.pendingRequests.delete(id);
        reject(new Error(`RPC call ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      proc.pendingRequests.set(id, {
        resolve: resolve as (result: unknown) => void,
        reject,
        timeout,
        method,
        startTime: Date.now(),
      });

      const serialized = JSON.stringify(request) + '\n';
      stdin.write(serialized, (err) => {
        if (err) {
          clearTimeout(timeout);
          proc.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }

  /**
   * Send a notification to the backend (no response expected)
   */
  async notify<TParams = unknown>(
    channelId: string,
    method: string,
    params?: TParams
  ): Promise<void> {
    const proc = this.processes.get(channelId);
    if (!proc) {
      throw new Error(`Backend channel ${channelId} not found`);
    }

    const stdin = proc.process.stdin;
    if (!stdin || stdin.destroyed) {
      throw new Error(`Backend channel ${channelId} stdin not available`);
    }

    const notification: JsonRpcNotification<TParams> = {
      jsonrpc: '2.0',
      method,
      ...(params !== undefined && { params }),
    };

    const serialized = JSON.stringify(notification) + '\n';
    return new Promise((resolve, reject) => {
      stdin.write(serialized, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  /**
   * Legacy: Post a raw message to the backend (for backward compatibility)
   */
  async postMessage(channelId: string, payload: unknown): Promise<void> {
    const proc = this.processes.get(channelId);
    if (!proc) {
      throw new Error(`Backend channel ${channelId} not found`);
    }

    const stdin = proc.process.stdin;
    if (!stdin || stdin.destroyed) {
      throw new Error(`Backend channel ${channelId} stdin not available`);
    }

    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    stdin.write(serialized + '\n');
  }

  /**
   * Check if a backend is ready
   */
  isReady(channelId: string): boolean {
    const proc = this.processes.get(channelId);
    return proc?.ready ?? false;
  }

  /**
   * Wait for backend to be ready
   */
  async waitForReady(channelId: string, timeoutMs: number = 30000): Promise<void> {
    const proc = this.processes.get(channelId);
    if (!proc) {
      throw new Error(`Backend channel ${channelId} not found`);
    }

    if (proc.ready) return;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.off('ready', onReady);
        reject(new Error(`Backend ${channelId} did not become ready within ${timeoutMs}ms`));
      }, timeoutMs);

      const onReady = (event: { channelId: string }) => {
        if (event.channelId === channelId) {
          clearTimeout(timeout);
          this.off('ready', onReady);
          resolve();
        }
      };

      this.on('ready', onReady);
    });
  }

  /**
   * Get available methods for a backend
   */
  getMethods(channelId: string): string[] {
    const proc = this.processes.get(channelId);
    return proc?.methods ?? [];
  }

  /**
   * Dispose a backend process
   */
  dispose(channelId: string): void {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    // Reject all pending requests
    this.rejectAllPending(channelId, 'Backend disposed');

    if (!proc.process.killed) {
      proc.process.kill();
    }
    this.processes.delete(channelId);
    logger.info(`Disposed backend ${channelId}`);
  }

  /**
   * Dispose all backends for a tool
   */
  disposeAllForPlugin(toolId: string): void {
    for (const [channelId, proc] of this.processes.entries()) {
      if (proc.toolId === toolId) {
        this.dispose(channelId);
      }
    }
  }

  /**
   * Reject all pending requests for a channel
   */
  private rejectAllPending(channelId: string, reason: string): void {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    for (const pending of proc.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error(reason));
    }
    proc.pendingRequests.clear();
  }


  /**
   * Ensure the Node.js SDK symlink exists in the tool's node_modules directory
   * This allows standard Node.js module resolution to find 'booltox-backend'
   */
  private ensureNodeSdkSymlink(pluginPath: string, sdkPath: string): void {
    const nodeModulesDir = path.join(pluginPath, 'node_modules');
    const symlinkPath = path.join(nodeModulesDir, 'booltox-backend');

    // Create node_modules directory if it doesn't exist
    if (!fs.existsSync(nodeModulesDir)) {
      fs.mkdirSync(nodeModulesDir, { recursive: true });
    }

    // Check if symlink already exists and points to the correct location
    if (fs.existsSync(symlinkPath)) {
      try {
        const linkTarget = fs.readlinkSync(symlinkPath);
        if (linkTarget === sdkPath || path.resolve(pluginPath, 'node_modules', linkTarget) === sdkPath) {
          return; // Symlink already correct
        }
        // Remove incorrect symlink
        fs.unlinkSync(symlinkPath);
      } catch {
        // Not a symlink or error reading, remove it
        fs.rmSync(symlinkPath, { recursive: true, force: true });
      }
    }

    // Create symlink (use junction on Windows for better compatibility)
    try {
      const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(sdkPath, symlinkPath, symlinkType);
      logger.info(`Created SDK symlink: ${symlinkPath} -> ${sdkPath}`);
    } catch (err) {
      logger.error(`Failed to create SDK symlink: ${err}`);
      throw err;
    }
  }

  /**
   * Get the path to the Node.js SDK
   * Note: This method is kept here instead of pythonManager because it requires
   * special path resolution logic for development mode that differs from Python SDK
   */
  private getNodeSdkPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'node-sdk');
    }
    // 开发模式：优先根目录 sdks/node（新目录结构）
    const rootSdkPath = path.resolve(app.getAppPath(), '../../sdks/node');
    if (fs.existsSync(path.join(rootSdkPath, 'package.json'))) {
      return rootSdkPath;
    }
    // 备选：从 cwd 查找
    const cwdSdkPath = path.resolve(process.cwd(), 'sdks/node');
    if (fs.existsSync(path.join(cwdSdkPath, 'package.json'))) {
      return cwdSdkPath;
    }
    // 最后回退到 app resources
    return path.join(app.getAppPath(), 'resources', 'node-sdk');
  }
}

export const backendRunner = new PluginBackendRunner();
