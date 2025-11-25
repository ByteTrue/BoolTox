import { ipcMain, app } from 'electron';
import { pluginManager } from './plugin-manager';
import { pluginRunner } from './plugin-runner';
import { pythonManager } from '../python-manager.service.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';
import { createLogger } from '../../utils/logger.js';

const execAsync = util.promisify(exec);
const logger = createLogger('PluginAPI');

type ApiModule = 'window' | 'shell' | 'fs' | 'db' | 'python';
type ShellExecParams = { command: string; args: string[] };
type ShellPythonParams = { scriptPath: string; args: string[] };
type FsRequestParams = { path: string; content?: string };
type DbGetParams = { key: string };
type DbSetParams = { key: string; value: unknown };
type PythonInstallParams = { packages: string[] };
type PythonRunCodeParams = { code: string; timeout?: number };
type PythonRunScriptParams = { scriptPath: string; args?: string[]; timeout?: number };

function isShellExecParams(params: unknown): params is ShellExecParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as ShellExecParams).command === 'string' &&
      Array.isArray((params as ShellExecParams).args),
  );
}

function isShellPythonParams(params: unknown): params is ShellPythonParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as ShellPythonParams).scriptPath === 'string' &&
      Array.isArray((params as ShellPythonParams).args),
  );
}

function isFsParams(params: unknown): params is FsRequestParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as FsRequestParams).path === 'string',
  );
}

function isDbGetParams(params: unknown): params is DbGetParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as DbGetParams).key === 'string',
  );
}

function isDbSetParams(params: unknown): params is DbSetParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as DbSetParams).key === 'string',
  );
}

function isPythonInstallParams(params: unknown): params is PythonInstallParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      Array.isArray((params as PythonInstallParams).packages),
  );
}

function isPythonRunCodeParams(params: unknown): params is PythonRunCodeParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as PythonRunCodeParams).code === 'string',
  );
}

function isPythonRunScriptParams(params: unknown): params is PythonRunScriptParams {
  return Boolean(
    params &&
      typeof params === 'object' &&
      typeof (params as PythonRunScriptParams).scriptPath === 'string',
  );
}

export class PluginApiHandler {
  private pluginDataDir: string;

  constructor() {
    this.pluginDataDir = path.join(app.getPath('userData'), 'plugin-data');
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle('booltox:api:call', async (event, module: ApiModule, method: string, params: unknown) => {
      // Find which plugin owns this view
      const plugin = pluginRunner.getRunningPlugin(event.sender.id);

      if (!plugin) {
        logger.warn(`[API] Blocked call from unidentified plugin view: ${event.sender.id}`);
        throw new Error('Access Denied: Plugin not identified');
      }

      logger.debug(`[API] Call from ${plugin.id}: ${module}.${method}`, params);

      // Dispatch to specific handlers
      switch (module) {
        case 'window':
          return this.handleWindowApi(plugin.id, method);
        case 'shell':
          return this.handleShellApi(plugin.id, method, params);
        case 'fs':
          return this.handleFsApi(plugin.id, method, params);
        case 'db':
          return this.handleDbApi(plugin.id, method, params);
        case 'python':
          return this.handlePythonApi(plugin.id, method, params);
        default:
          throw new Error(`Unknown API module: ${module}`);
      }
    });
  }

  private async handleWindowApi(pluginId: string, method: string) {
    // TODO: Implement window controls
    logger.debug(`[API:Window] ${pluginId} called ${method}`);
    return { success: true };
  }

  private async handleShellApi(pluginId: string, method: string, params: unknown) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    // Check permissions
    if (method === 'exec') {
      if (!plugin.manifest.permissions?.includes('shell.exec')) {
        throw new Error('Permission denied: shell.exec');
      }
      
      if (!isShellExecParams(params)) {
        throw new Error('Invalid parameters for shell.exec');
      }
      const { command, args } = params;
      // Basic security check: don't allow chaining commands
      if (command.includes('&&') || command.includes('|') || command.includes(';')) {
        throw new Error('Security Error: Command chaining not allowed');
      }

      try {
        const cmdStr = `${command} ${args.join(' ')}`;
        const { stdout, stderr } = await execAsync(cmdStr);
        return { success: true, stdout, stderr };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const stderr = error && typeof error === 'object' && 'stderr' in error ? (error as { stderr?: string }).stderr : undefined;
        return { success: false, error: message, stderr };
      }
    }

    if (method === 'runPython') {
      if (!plugin.manifest.permissions?.includes('shell.python')) {
        throw new Error('Permission denied: shell.python');
      }

      if (!isShellPythonParams(params)) {
        throw new Error('Invalid parameters for shell.python');
      }
      const { scriptPath, args } = params;
      
      // 使用 PythonManager 执行脚本
      try {
        // 设置插件隔离的 PYTHONPATH
        const pluginPackagesDir = pythonManager.getPluginPackagesDir(pluginId);
        const result = await pythonManager.runScript(scriptPath, args, {
          env: { PYTHONPATH: pluginPackagesDir }
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    }

    throw new Error(`Unknown shell method: ${method}`);
  }

  /**
   * Python API 处理器
   * 提供完整的 Python 环境管理能力
   */
  private async handlePythonApi(pluginId: string, method: string, params: unknown) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    // 获取环境状态（不需要权限）
    if (method === 'getStatus') {
      try {
        return await pythonManager.getStatus();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    }

    // 确保 Python 环境就绪（不需要权限）
    if (method === 'ensure') {
      try {
        await pythonManager.ensurePython();
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    }

    // 以下操作需要 python.install 权限
    if (method === 'installDeps') {
      if (!plugin.manifest.permissions?.includes('python.install')) {
        throw new Error('Permission denied: python.install');
      }

      if (!isPythonInstallParams(params)) {
        throw new Error('Invalid parameters for python.installDeps');
      }
      const { packages } = params;

      try {
        // 安装到插件隔离目录
        await pythonManager.installPluginPackages(pluginId, packages);
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message };
      }
    }

    // 列出插件已安装的包
    if (method === 'listDeps') {
      try {
        const packages = pythonManager.listPluginPackages(pluginId);
        return { success: true, packages };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, error: message, packages: [] };
      }
    }

    // 以下操作需要 python.run 权限
    if (method === 'runCode') {
      if (!plugin.manifest.permissions?.includes('python.run')) {
        throw new Error('Permission denied: python.run');
      }

      if (!isPythonRunCodeParams(params)) {
        throw new Error('Invalid parameters for python.runCode');
      }
      const { code, timeout } = params;

      try {
        // 设置插件隔离的 PYTHONPATH
        const pluginPackagesDir = pythonManager.getPluginPackagesDir(pluginId);
        const result = await pythonManager.runCode(code, {
          timeout,
          env: { PYTHONPATH: pluginPackagesDir }
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, code: null, stdout: '', stderr: '', error: message };
      }
    }

    if (method === 'runScript') {
      if (!plugin.manifest.permissions?.includes('python.run')) {
        throw new Error('Permission denied: python.run');
      }

      if (!isPythonRunScriptParams(params)) {
        throw new Error('Invalid parameters for python.runScript');
      }
      const { scriptPath, args, timeout } = params;

      try {
        // 设置插件隔离的 PYTHONPATH
        const pluginPackagesDir = pythonManager.getPluginPackagesDir(pluginId);
        const result = await pythonManager.runScript(scriptPath, args || [], {
          timeout,
          env: { PYTHONPATH: pluginPackagesDir }
        });
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { success: false, code: null, stdout: '', stderr: '', error: message };
      }
    }

    throw new Error(`Unknown python method: ${method}`);
  }

  private async handleFsApi(pluginId: string, method: string, params: unknown) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    // Ensure plugin data directory exists
    const pluginDir = path.join(this.pluginDataDir, pluginId);
    await fs.mkdir(pluginDir, { recursive: true });

    if (!isFsParams(params)) {
      throw new Error('Invalid fs parameters');
    }

    const { path: relativePath, content } = params;
    
    // Security check: Prevent directory traversal
    const targetPath = path.resolve(pluginDir, relativePath);
    if (!targetPath.startsWith(pluginDir)) {
      throw new Error('Security Error: Access denied to path outside plugin directory');
    }

    if (method === 'readFile') {
      try {
        const data = await fs.readFile(targetPath, 'utf-8');
        return { success: true, data };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    if (method === 'writeFile') {
      try {
        await fs.writeFile(targetPath, content, 'utf-8');
        return { success: true };
      } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : String(error) };
      }
    }

    throw new Error(`Unknown fs method: ${method}`);
  }

  private async handleDbApi(pluginId: string, method: string, params: unknown) {
    const pluginDir = path.join(this.pluginDataDir, pluginId);
    await fs.mkdir(pluginDir, { recursive: true });
    const dbPath = path.join(pluginDir, 'db.json');

    let db: Record<string, unknown> = {};
    try {
      const content = await fs.readFile(dbPath, 'utf-8');
      db = JSON.parse(content);
    } catch {
      // Ignore error, db is empty
    }

    if (method === 'get') {
      if (!isDbGetParams(params)) {
        throw new Error('Invalid db get parameters');
      }
      const { key } = params;
      return db[key];
    }

    if (method === 'set') {
      if (!isDbSetParams(params)) {
        throw new Error('Invalid db set parameters');
      }
      const { key, value } = params;
      db[key] = value;
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
      return { success: true };
    }

    throw new Error(`Unknown db method: ${method}`);
  }
}

export const pluginApiHandler = new PluginApiHandler();
