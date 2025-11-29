import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import type { PluginBackendConfig, PluginRuntime } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { pythonManager } from '../python-manager.service.js';
import type { ChildProcess } from 'node:child_process';

const logger = createLogger('PluginBackendRunner');

export interface BackendMessagePayload {
  pluginId: string;
  channelId: string;
  type: 'stdout' | 'stderr' | 'exit' | 'error';
  data?: string;
  code?: number | null;
  webContentsId: number;
}

interface BackendProcess {
  pluginId: string;
  config: PluginBackendConfig;
  process: ChildProcess;
  channelId: string;
  webContentsId: number;
}

function isChildProcessWithStreams(proc: ChildProcess): proc is ChildProcessWithoutNullStreams {
  return Boolean(proc.stdout && proc.stderr && proc.stdin);
}

export class PluginBackendRunner extends EventEmitter {
  private processes = new Map<string, BackendProcess>();

  async registerBackend(plugin: PluginRuntime, config: PluginBackendConfig, webContentsId: number) {
    const entryPath = path.isAbsolute(config.entry) ? config.entry : path.join(plugin.path, config.entry);
    const args = config.args ?? [];
    const env = { ...process.env, ...config.env };

    let child: ChildProcess;

    if (config.type === 'python') {
      await pythonManager.ensurePython();
      const pluginPackagesDir = pythonManager.getPluginPackagesDir(plugin.id);
      child = pythonManager.spawnPython(entryPath, args, {
        cwd: plugin.path,
        env: {
          ...env,
          PYTHONPATH: pluginPackagesDir,
        },
      });
    } else if (config.type === 'node') {
      child = spawn(process.execPath, [entryPath, ...args], {
        cwd: plugin.path,
        env,
        stdio: 'pipe',
      });
    } else {
      child = spawn(entryPath, args, {
        cwd: plugin.path,
        env,
        stdio: 'pipe',
      });
    }

    if (!isChildProcessWithStreams(child)) {
      child.kill();
      throw new Error('Backend process does not expose stdio streams');
    }

    const channelId = `${plugin.id}:${randomUUID()}`;
    const record: BackendProcess = {
      pluginId: plugin.id,
      config,
      process: child,
      channelId,
      webContentsId,
    };

    this.processes.set(channelId, record);
    logger.info(`[BackendRunner] Started backend ${channelId} for plugin ${plugin.id} (${config.type})`);

    child.stdout.on('data', (buffer) => {
      this.emit('message', {
        pluginId: plugin.id,
        channelId,
        type: 'stdout',
        data: buffer.toString(),
        code: null,
        webContentsId,
      });
    });

    child.stderr.on('data', (buffer) => {
      this.emit('message', {
        pluginId: plugin.id,
        channelId,
        type: 'stderr',
        data: buffer.toString(),
        code: null,
        webContentsId,
      });
    });

    child.on('exit', (code) => {
      this.emit('message', {
        pluginId: plugin.id,
        channelId,
        type: 'exit',
        code: code ?? null,
        webContentsId,
      });
      this.processes.delete(channelId);
      logger.info(`[BackendRunner] Backend ${channelId} exited with code ${code}`);
    });

    child.on('error', (error) => {
      this.emit('message', {
        pluginId: plugin.id,
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

  async postMessage(channelId: string, payload: unknown) {
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

  dispose(channelId: string) {
    const proc = this.processes.get(channelId);
    if (!proc) return;

    if (!proc.process.killed) {
      proc.process.kill();
    }
    this.processes.delete(channelId);
    logger.info(`[BackendRunner] Disposed backend ${channelId}`);
  }

  disposeAllForPlugin(pluginId: string) {
    for (const [channelId, proc] of this.processes.entries()) {
      if (proc.pluginId === pluginId) {
        this.dispose(channelId);
      }
    }
  }
}

export const backendRunner = new PluginBackendRunner();
