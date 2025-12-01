import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BooltoxPermission, PluginRuntime } from '@booltox/shared';
import { pluginRunner } from '../plugin/plugin-runner.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ExtensionHost');

export interface ExtensionModuleContext {
  plugin: PluginRuntime;
  sender: WebContents;
  window?: BrowserWindow;
  dataDir: string;
}

export interface ExtensionModuleDefinition {
  name: string;
  requiredPermissions?: Record<string, BooltoxPermission[]>;
  handle(context: ExtensionModuleContext, method: string, payload: unknown): Promise<unknown>;
}

export class ExtensionHost {
  private readonly modules = new Map<string, ExtensionModuleDefinition>();
  private readonly channel: string;
  private readonly pluginDataRoot: string;

  constructor(channel = 'booltox:api:call') {
    this.channel = channel;
    this.pluginDataRoot = path.join(app.getPath('userData'), 'plugin-data');
  }

  registerModule(definition: ExtensionModuleDefinition) {
    if (this.modules.has(definition.name)) {
      logger.warn(`[ExtensionHost] Module ${definition.name} already registered, overriding.`);
    }
    this.modules.set(definition.name, definition);
  }

  attach() {
    ipcMain.removeHandler(this.channel);
    ipcMain.handle(this.channel, (event, moduleName: string, method: string, payload: unknown) =>
      this.dispatch(event, moduleName, method, payload),
    );
    logger.info(`[ExtensionHost] IPC channel "${this.channel}" ready, registered modules: ${Array.from(this.modules.keys()).join(', ')}`);
  }

  private async dispatch(event: IpcMainInvokeEvent, moduleName: string, method: string, payload: unknown) {
    const module = this.modules.get(moduleName);
    if (!module) {
      const error = new Error(`Unknown API module: ${moduleName}`);
      logger.warn(`[ExtensionHost] ${error.message}`);
      throw error;
    }

    const plugin = this.resolvePlugin(event.sender.id);
    const context = await this.createContext(event, plugin);

    this.ensurePermissions(plugin, module.requiredPermissions?.[method], moduleName, method);

    try {
      return await module.handle(context, method, payload);
    } catch (error) {
      logger.error(
        `[ExtensionHost] Module ${moduleName}.${method} failed for ${plugin.id}`,
        error,
      );
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private resolvePlugin(webContentsId: number): PluginRuntime {
    const plugin = pluginRunner.getRunningPlugin(webContentsId);
    if (!plugin) {
      const error = new Error(`Access denied: plugin runtime missing for webContents ${webContentsId}`);
      logger.warn(`[ExtensionHost] ${error.message}`);
      throw error;
    }
    return plugin;
  }

  private async createContext(event: IpcMainInvokeEvent, plugin: PluginRuntime): Promise<ExtensionModuleContext> {
    await fs.mkdir(this.pluginDataRoot, { recursive: true });
    const pluginDir = path.join(this.pluginDataRoot, plugin.id);
    await fs.mkdir(pluginDir, { recursive: true });

    const sender = event.sender;
    if (sender.isDestroyed()) {
      const error = new Error(`Access denied: plugin window already destroyed for ${plugin.id}`);
      logger.warn(`[ExtensionHost] ${error.message}`);
      throw error;
    }

    let window: BrowserWindow | undefined;
    try {
      window = BrowserWindow.fromWebContents(sender) ?? undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Object has been destroyed')) {
        const destroyedError = new Error(`Access denied: plugin window already destroyed for ${plugin.id}`);
        logger.warn(`[ExtensionHost] ${destroyedError.message}`);
        throw destroyedError;
      }
      throw error;
    }

    return {
      plugin,
      sender,
      window,
      dataDir: pluginDir,
    };
  }

  private ensurePermissions(
    plugin: PluginRuntime,
    required: BooltoxPermission[] | undefined,
    moduleName: string,
    method: string,
  ) {
    if (!required || required.length === 0) {
      return;
    }

    const declared = new Set(plugin.manifest.permissions ?? []);
    const missing = required.filter((permission) => !declared.has(permission));
    if (missing.length > 0) {
      const error = new Error(
        `Permission denied for ${plugin.id} on ${moduleName}.${method}: missing [${missing.join(', ')}]`,
      );
      logger.warn(`[ExtensionHost] ${error.message}`);
      throw error;
    }
  }
}
