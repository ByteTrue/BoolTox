import { ipcMain, BrowserWindow, BrowserView, app } from 'electron';
import { pluginManager } from './plugin-manager';
import { pluginRunner } from './plugin-runner';
import { exec, spawn } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = util.promisify(exec);

type ApiModule = 'window' | 'shell' | 'fs' | 'db';

export class PluginApiHandler {
  private pluginDataDir: string;

  constructor() {
    this.pluginDataDir = path.join(app.getPath('userData'), 'plugin-data');
    this.registerHandlers();
  }

  private registerHandlers() {
    ipcMain.handle('booltox:api:call', async (event, module: ApiModule, method: string, params: any) => {
      // Find which plugin owns this view
      const plugin = pluginRunner.getRunningPlugin(event.sender.id);

      if (!plugin) {
        console.warn(`[API] Blocked call from unidentified plugin view: ${event.sender.id}`);
        throw new Error('Access Denied: Plugin not identified');
      }

      console.log(`[API] Call from ${plugin.id}: ${module}.${method}`, params);

      // Dispatch to specific handlers
      switch (module) {
        case 'window':
          return this.handleWindowApi(plugin.id, method, params);
        case 'shell':
          return this.handleShellApi(plugin.id, method, params);
        case 'fs':
          return this.handleFsApi(plugin.id, method, params);
        case 'db':
          return this.handleDbApi(plugin.id, method, params);
        default:
          throw new Error(`Unknown API module: ${module}`);
      }
    });
  }

  private async handleWindowApi(pluginId: string, method: string, params: any) {
    // TODO: Implement window controls
    console.log(`[API:Window] ${pluginId} called ${method}`);
    return { success: true };
  }

  private async handleShellApi(pluginId: string, method: string, params: any) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    // Check permissions
    if (method === 'exec') {
      if (!plugin.manifest.permissions?.includes('shell.exec')) {
        throw new Error('Permission denied: shell.exec');
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
      } catch (error: any) {
        return { success: false, error: error.message, stderr: error.stderr };
      }
    }

    if (method === 'runPython') {
      if (!plugin.manifest.permissions?.includes('shell.python')) {
        throw new Error('Permission denied: shell.python');
      }

      const { scriptPath, args } = params;
      // TODO: Locate python executable properly
      const pythonPath = 'python'; 
      
      return new Promise((resolve) => {
        const child = spawn(pythonPath, [scriptPath, ...args]);
        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => stdout += data.toString());
        child.stderr.on('data', (data) => stderr += data.toString());

        child.on('close', (code) => {
          resolve({ 
            success: code === 0, 
            code, 
            stdout, 
            stderr 
          });
        });
        
        child.on('error', (err) => {
          resolve({ success: false, error: err.message });
        });
      });
    }

    throw new Error(`Unknown shell method: ${method}`);
  }

  private async handleFsApi(pluginId: string, method: string, params: any) {
    const plugin = pluginManager.getPlugin(pluginId);
    if (!plugin) throw new Error('Plugin not found');

    // Ensure plugin data directory exists
    const pluginDir = path.join(this.pluginDataDir, pluginId);
    await fs.mkdir(pluginDir, { recursive: true });

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
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    if (method === 'writeFile') {
      try {
        await fs.writeFile(targetPath, content, 'utf-8');
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    }

    throw new Error(`Unknown fs method: ${method}`);
  }

  private async handleDbApi(pluginId: string, method: string, params: any) {
    const pluginDir = path.join(this.pluginDataDir, pluginId);
    await fs.mkdir(pluginDir, { recursive: true });
    const dbPath = path.join(pluginDir, 'db.json');

    let db: Record<string, any> = {};
    try {
      const content = await fs.readFile(dbPath, 'utf-8');
      db = JSON.parse(content);
    } catch {
      // Ignore error, db is empty
    }

    if (method === 'get') {
      const { key } = params;
      return db[key];
    }

    if (method === 'set') {
      const { key, value } = params;
      db[key] = value;
      await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf-8');
      return { success: true };
    }

    throw new Error(`Unknown db method: ${method}`);
  }
}

export const pluginApiHandler = new PluginApiHandler();
