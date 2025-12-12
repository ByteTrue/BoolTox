/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { exec } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';
import { webContents } from 'electron';
import { ExtensionHost } from '../extension-host/extension-host.js';
import { createLogger } from '../../utils/logger.js';
import { pythonManager } from '../python-manager.service.js';
import { backendRunner } from './tool-backend-runner.js';
import type { ToolBackendConfig } from '@booltox/shared';

const execAsync = util.promisify(exec);
const logger = createLogger('ExtensionModules');

type StringMap = Record<string, unknown>;

function ensureRecord(payload: unknown, errorHint: string): StringMap {
  if (!payload || typeof payload !== 'object') {
    throw new Error(`${errorHint}: payload must be an object`);
  }
  return payload as StringMap;
}

function ensureString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid ${field}: expected non-empty string`);
  }
  return value;
}

function ensureNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`Invalid ${field}: expected number`);
  }
  return value;
}

function resolveSandboxPath(root: string, relativePath: string) {
  const target = path.resolve(root, relativePath);
  if (!target.startsWith(root)) {
    throw new Error('Security Error: access outside tool sandbox is not allowed');
  }
  return target;
}

async function readJson<T>(file: string): Promise<T | undefined> {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return undefined;
    }
    throw error;
  }
}

async function writeJson(file: string, data: unknown) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
}

function coerceBackendConfig(input: unknown): ToolBackendConfig | undefined {
  if (!input || typeof input !== 'object') {
    return undefined;
  }
  const candidate = input as Partial<ToolBackendConfig>;
  if (typeof candidate.type !== 'string' || typeof candidate.entry !== 'string') {
    return undefined;
  }
  const args = Array.isArray(candidate.args) ? candidate.args.map(String) : undefined;
  const env =
    candidate.env && typeof candidate.env === 'object'
      ? Object.fromEntries(
          Object.entries(candidate.env).map(([key, value]) => [key, String(value)]),
        )
      : undefined;

  return {
    type: candidate.type as ToolBackendConfig['type'],
    entry: candidate.entry,
    args,
    env,
    keepAlive: candidate.keepAlive,
  };
}

class BooltoxExtensionHostService {
  private readonly host = new ExtensionHost();

  constructor() {
    this.registerWindowModule();
    this.registerShellModule();
    this.registerFsModule();
    this.registerStorageModule();
    this.registerPythonModule();
    this.registerBackendModule();
    this.registerTelemetryModule();
    this.host.attach();

    // Forward legacy messages to renderer
    backendRunner.on('message', (payload) => {
      const target = webContents.fromId(payload.webContentsId);
      if (target && !target.isDestroyed()) {
        target.send('booltox:backend:message', payload);
      }
    });

    // Forward backend events (JSON-RPC $event notifications) to renderer
    backendRunner.on('backend-event', (payload: { channelId: string; pluginId: string; event: string; data: unknown; webContentsId: number }) => {
      const target = webContents.fromId(payload.webContentsId);
      if (target && !target.isDestroyed()) {
        target.send('booltox:backend:event', {
          channelId: payload.channelId,
          event: payload.event,
          data: payload.data,
        });
      }
    });

    // Forward backend ready notifications to renderer
    backendRunner.on('ready', (payload: { channelId: string; pluginId: string; webContentsId: number }) => {
      const target = webContents.fromId(payload.webContentsId);
      if (target && !target.isDestroyed()) {
        target.send('booltox:backend:ready', { channelId: payload.channelId });
      }
    });
  }

  private registerWindowModule() {
    this.host.registerModule({
      name: 'window',
      requiredPermissions: {
        hide: ['window.hide'],
        show: ['window.show'],
        setSize: ['window.setBounds'],
        setTitle: ['window.setTitle'],
        minimize: ['window.minimize'],
        toggleMaximize: ['window.maximize'],
        close: ['window.close'],
      },
      handle: async (ctx, method, payload) => {
        const win = ctx.window;
        if (!win) throw new Error('Window handle unavailable');

        switch (method) {
          case 'hide':
            win.hide();
            return { success: true };
          case 'show':
            win.show();
            win.focus();
            return { success: true };
          case 'setSize': {
            const data = ensureRecord(payload, 'window.setSize');
            const width = Math.round(ensureNumber(data.width, 'width'));
            const height = Math.round(ensureNumber(data.height, 'height'));
            win.setSize(width, height);
            return { success: true, width, height };
          }
          case 'setTitle': {
            const data = ensureRecord(payload, 'window.setTitle');
            const title = ensureString(data.title, 'title');
            win.setTitle(title);
            return { success: true };
          }
          case 'minimize':
            win.minimize();
            return { success: true };
          case 'toggleMaximize':
            if (win.isMaximized()) {
              win.unmaximize();
            } else {
              win.maximize();
            }
            return { success: true, maximized: win.isMaximized() };
          case 'close':
            win.close();
            return { success: true };
          default:
            throw new Error(`Unknown window method: ${method}`);
        }
      },
    });
  }

  private registerShellModule() {
    this.host.registerModule({
      name: 'shell',
      requiredPermissions: {
        exec: ['shell.exec'],
        runPython: ['shell.python'],
      },
      handle: async (ctx, method, payload) => {
        if (method === 'exec') {
          const data = ensureRecord(payload, 'shell.exec');
          const command = ensureString(data.command, 'command');
          const args = Array.isArray(data.args) ? data.args.map(String) : [];
          const forbidden = ['&&', '||', ';', '|'];
          if (forbidden.some((token) => command.includes(token))) {
            throw new Error('Security Error: command chaining is not allowed');
          }

          const cmd = [command, ...args].join(' ').trim();
          logger.info(`[Shell] ${ctx.tool.id} -> ${cmd}`);
          try {
            const { stdout, stderr } = await execAsync(cmd, {
              cwd: typeof data.cwd === 'string' ? data.cwd : undefined,
              env: typeof data.env === 'object' ? (data.env as Record<string, string>) : undefined,
              timeout: typeof data.timeoutMs === 'number' ? data.timeoutMs : undefined,
            });
            return { success: true, stdout, stderr };
          } catch (error) {
            const err = error as { code?: number; stderr?: string; stdout?: string; message?: string };
            return {
              success: false,
              code: err.code ?? null,
              stdout: err.stdout ?? '',
              stderr: err.stderr ?? '',
              error: err.message ?? 'Command failed',
            };
          }
        }

        if (method === 'runPython') {
          const data = ensureRecord(payload, 'shell.runPython');
          const scriptPath = ensureString(data.scriptPath, 'scriptPath');
          const args = Array.isArray(data.args) ? data.args.map(String) : [];
          const timeout = typeof data.timeoutMs === 'number' ? data.timeoutMs : undefined;
          const env = typeof data.env === 'object' ? (data.env as Record<string, string>) : undefined;

          const pluginPackagesDir = pythonManager.getToolPackagesDir(ctx.tool.id);
          return pythonManager.runScript(scriptPath, args, {
            timeout,
            env: {
              PYTHONPATH: pluginPackagesDir,
              ...env,
            },
          });
        }

        throw new Error(`Unknown shell method: ${method}`);
      },
    });
  }

  private registerFsModule() {
    this.host.registerModule({
      name: 'fs',
      requiredPermissions: {
        readFile: ['fs.read'],
        writeFile: ['fs.write'],
        listDir: ['fs.list'],
        stat: ['fs.stat'],
      },
      handle: async (ctx, method, payload) => {
        const data = ensureRecord(payload, `fs.${method}`);
        const relativePath = ensureString(data.path ?? '.', 'path');
        const target = resolveSandboxPath(ctx.dataDir, relativePath);

        if (method === 'readFile') {
          const encoding = typeof data.encoding === 'string' ? (data.encoding as BufferEncoding) : 'utf8';
          const contents = await fs.readFile(target, { encoding });
          return { success: true, data: contents };
        }

        if (method === 'writeFile') {
          const content = data.content;
          if (typeof content !== 'string' && !(content instanceof Uint8Array)) {
            throw new Error('fs.writeFile requires string or Uint8Array content');
          }
          const encoding = typeof data.encoding === 'string' ? (data.encoding as BufferEncoding) : undefined;
          await fs.mkdir(path.dirname(target), { recursive: true });
          await fs.writeFile(target, content, encoding ? { encoding } : undefined);
          return { success: true };
        }

        if (method === 'listDir') {
          const entries = await fs.readdir(target, { withFileTypes: true });
          return {
            success: true,
            entries: await Promise.all(
              entries.map(async (entry) => {
                const entryPath = path.join(target, entry.name);
                const stat = await fs.stat(entryPath);
                return {
                  name: entry.name,
                  isDirectory: entry.isDirectory(),
                  size: stat.size,
                  modifiedAt: stat.mtime.toISOString(),
                };
              }),
            ),
          };
        }

        if (method === 'stat') {
          const stat = await fs.stat(target);
          return {
            success: true,
            entry: {
              name: path.basename(target),
              isDirectory: stat.isDirectory(),
              size: stat.size,
              modifiedAt: stat.mtime.toISOString(),
            },
          };
        }

        throw new Error(`Unknown fs method: ${method}`);
      },
    });
  }

  private registerStorageModule() {
    this.host.registerModule({
      name: 'storage',
      requiredPermissions: {
        get: ['storage.get'],
        set: ['storage.set'],
        delete: ['storage.delete'],
        list: ['storage.get'],
      },
      handle: async (ctx, method, payload) => {
        const dbPath = path.join(ctx.dataDir, 'kv-storage.json');
        const store = (await readJson<Record<string, unknown>>(dbPath)) ?? {};

        if (method === 'get') {
          const data = ensureRecord(payload, 'storage.get');
          const key = ensureString(data.key, 'key');
          return store[key];
        }

        if (method === 'set') {
          const data = ensureRecord(payload, 'storage.set');
          const key = ensureString(data.key, 'key');
          store[key] = data.value;
          await writeJson(dbPath, store);
          return { success: true };
        }

        if (method === 'delete') {
          const data = ensureRecord(payload, 'storage.delete');
          const key = ensureString(data.key, 'key');
          delete store[key];
          await writeJson(dbPath, store);
          return { success: true };
        }

        if (method === 'list') {
          return Object.keys(store);
        }

        throw new Error(`Unknown storage method: ${method}`);
      },
    });
  }

  private registerPythonModule() {
    this.host.registerModule({
      name: 'python',
      requiredPermissions: {
        installDeps: ['python.install'],
        runCode: ['python.run'],
        runScript: ['python.run'],
        listDeps: ['python.inspect'],
      },
      handle: async (ctx, method, payload) => {
        if (method === 'getStatus') {
          return pythonManager.getStatus();
        }

        if (method === 'ensure') {
          try {
            await pythonManager.ensurePython();
            return { success: true };
          } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : String(error) };
          }
        }

        if (method === 'installDeps') {
          const data = ensureRecord(payload, 'python.installDeps');
          const packages = Array.isArray(data.packages) ? data.packages.map(String) : [];
          if (packages.length === 0) throw new Error('python.installDeps requires at least one package');
          await pythonManager.installToolPackages(ctx.tool.id, packages);
          return { success: true };
        }

        if (method === 'listDeps') {
          try {
            const packages = pythonManager.listToolPackages(ctx.tool.id);
            return { success: true, packages };
          } catch (error) {
            return { success: false, packages: [], error: error instanceof Error ? error.message : String(error) };
          }
        }

        if (method === 'runCode') {
          const data = ensureRecord(payload, 'python.runCode');
          const code = ensureString(data.code, 'code');
          const timeout = typeof data.timeout === 'number' ? data.timeout : undefined;
          const env = typeof data.env === 'object' ? (data.env as Record<string, string>) : undefined;

          const pluginPackagesDir = pythonManager.getToolPackagesDir(ctx.tool.id);
          return pythonManager.runCode(code, {
            timeout,
            env: {
              PYTHONPATH: pluginPackagesDir,
              ...env,
            },
          });
        }

        if (method === 'runScript') {
          const data = ensureRecord(payload, 'python.runScript');
          const scriptPath = ensureString(data.scriptPath, 'scriptPath');
          const args = Array.isArray(data.args) ? data.args.map(String) : [];
          const timeout = typeof data.timeout === 'number' ? data.timeout : undefined;
          const env = typeof data.env === 'object' ? (data.env as Record<string, string>) : undefined;

          const pluginPackagesDir = pythonManager.getToolPackagesDir(ctx.tool.id);
          return pythonManager.runScript(scriptPath, args, {
            timeout,
            env: {
              PYTHONPATH: pluginPackagesDir,
              ...env,
            },
          });
        }

        throw new Error(`Unknown python method: ${method}`);
      },
    });
  }

  private registerBackendModule() {
    this.host.registerModule({
      name: 'backend',
      requiredPermissions: {
        register: ['backend.register'],
        postMessage: ['backend.message'],
        dispose: ['backend.message'],
        call: ['backend.message'],
        notify: ['backend.message'],
      },
      handle: async (ctx, method, payload) => {
        if (method === 'register') {
          const explicitConfig = coerceBackendConfig(payload);
          const runtimeConfig = ctx.tool.manifest.runtime;
          const manifestConfig =
            runtimeConfig && runtimeConfig.type !== 'standalone' && runtimeConfig.type !== 'binary'
              ? runtimeConfig.backend
              : undefined;
          const config = explicitConfig ?? manifestConfig;
          if (!config) {
            throw new Error('Backend configuration missing. Provide definition or manifest.runtime.backend');
          }
          return backendRunner.registerBackend(ctx.tool, config, ctx.sender.id);
        }

        if (method === 'postMessage') {
          const data = ensureRecord(payload, 'backend.postMessage');
          const channelId = ensureString(data.channelId, 'channelId');
          await backendRunner.postMessage(channelId, data.payload ?? null);
          return { success: true };
        }

        if (method === 'dispose') {
          const data = ensureRecord(payload, 'backend.dispose');
          const channelId = ensureString(data.channelId, 'channelId');
          backendRunner.dispose(channelId);
          return { success: true };
        }

        // JSON-RPC call method
        if (method === 'call') {
          const data = ensureRecord(payload, 'backend.call');
          const channelId = ensureString(data.channelId, 'channelId');
          const rpcMethod = ensureString(data.method, 'method');
          const params = data.params;
          const timeoutMs = typeof data.timeoutMs === 'number' ? data.timeoutMs : undefined;

          return backendRunner.call(channelId, rpcMethod, params, timeoutMs);
        }

        // JSON-RPC notify method
        if (method === 'notify') {
          const data = ensureRecord(payload, 'backend.notify');
          const channelId = ensureString(data.channelId, 'channelId');
          const rpcMethod = ensureString(data.method, 'method');
          const params = data.params;

          await backendRunner.notify(channelId, rpcMethod, params);
          return { success: true };
        }

        throw new Error(`Unknown backend method: ${method}`);
      },
    });
  }

  private registerTelemetryModule() {
    this.host.registerModule({
      name: 'telemetry',
      requiredPermissions: {
        send: ['telemetry.send'],
      },
      handle: async (_ctx, method) => {
        if (method === 'send') {
          logger.debug('[Telemetry] Event dropped (not implemented)');
          return { success: false, reason: 'not-implemented' };
        }
        throw new Error(`Unknown telemetry method: ${method}`);
      },
    });
  }
}

export const toolApiHandler = new BooltoxExtensionHostService();
