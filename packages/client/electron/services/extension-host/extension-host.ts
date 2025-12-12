/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent, type WebContents } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { BooltoxPermission, ToolRuntime } from '@booltox/shared';
import { toolRunner } from '../tool/tool-runner.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ExtensionHost');

export interface ExtensionModuleContext {
  tool: ToolRuntime;
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
  private readonly toolDataRoot: string;

  constructor(channel = 'booltox:api:call') {
    this.channel = channel;
    this.toolDataRoot = path.join(app.getPath('userData'), 'tool-data');
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

    const tool = this.resolvePlugin(event.sender.id);
    const context = await this.createContext(event, tool);

    this.ensurePermissions(tool, module.requiredPermissions?.[method], moduleName, method);

    try {
      return await module.handle(context, method, payload);
    } catch (error) {
      logger.error(
        `[ExtensionHost] Module ${moduleName}.${method} failed for ${tool.id}`,
        error,
      );
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  private resolvePlugin(webContentsId: number): ToolRuntime {
    // 新架构中不再支持 webview 模式，工具运行在浏览器中
    const error = new Error(`ExtensionHost is no longer supported. Tools should use http-service runtime and run in the browser. (webContentsId: ${webContentsId})`);
    logger.warn(`[ExtensionHost] ${error.message}`);
    throw error;
  }

  private async createContext(event: IpcMainInvokeEvent, tool: ToolRuntime): Promise<ExtensionModuleContext> {
    await fs.mkdir(this.toolDataRoot, { recursive: true });
    const toolDir = path.join(this.toolDataRoot, tool.id);
    await fs.mkdir(toolDir, { recursive: true });

    const sender = event.sender;
    if (sender.isDestroyed()) {
      // 窗口已销毁，这通常是正常的竞态条件（窗口关闭时还有异步 API 调用）
      // 不抛出错误，而是抛出一个特殊的可识别错误，调用者可以选择静默处理
      const error = new Error(`Tool window already destroyed for ${tool.id}`);
      (error as any).code = 'WINDOW_DESTROYED';
      logger.debug(`[ExtensionHost] ${error.message} (this is usually a normal race condition)`);
      throw error;
    }

    let window: BrowserWindow | undefined;
    try {
      window = BrowserWindow.fromWebContents(sender) ?? undefined;
    } catch (error) {
      if (error instanceof Error && error.message.includes('Object has been destroyed')) {
        const destroyedError = new Error(`Tool window already destroyed for ${tool.id}`);
        (destroyedError as any).code = 'WINDOW_DESTROYED';
        logger.debug(`[ExtensionHost] ${destroyedError.message} (this is usually a normal race condition)`);
        throw destroyedError;
      }
      throw error;
    }

    return {
      tool,
      sender,
      window,
      dataDir: toolDir,
    };
  }

  private ensurePermissions(
    tool: ToolRuntime,
    required: BooltoxPermission[] | undefined,
    moduleName: string,
    method: string,
  ) {
    if (!required || required.length === 0) {
      return;
    }

    const declared = new Set(tool.manifest.permissions ?? []);
    const missing = required.filter((permission) => !declared.has(permission));
    if (missing.length > 0) {
      const error = new Error(
        `Permission denied for ${tool.id} on ${moduleName}.${method}: missing [${missing.join(', ')}]`,
      );
      logger.warn(`[ExtensionHost] ${error.message}`);
      throw error;
    }
  }
}
