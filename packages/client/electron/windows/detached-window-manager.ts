/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { BrowserWindow, screen, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { IpcChannel } from '../../src/shared/constants/ipc-channels.js';
import { createLogger } from '../utils/logger.js';
import { getPlatformWindowConfig } from '../utils/window-platform-config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('DetachedWindow');

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

class DetachedWindowManager {
  private windows: Map<string, BrowserWindow> = new Map();
  private closingWindowIds: Set<string> = new Set();
  private closeReasonByWindowId: Map<string, string> = new Map();
  private bootStateByWindowId: Map<string, unknown> = new Map();
  private pendingBootStateWindowIds: Set<string> = new Set(); // 等待握手的窗口

  /**
   * 创建分离窗口
   */
  createDetachedWindow(windowId: string, bounds?: Partial<Bounds>): BrowserWindow {
    // 如果窗口已存在，直接返回
    if (this.windows.has(windowId)) {
      const existingWindow = this.windows.get(windowId);
      if (existingWindow && !existingWindow.isDestroyed()) {
        existingWindow.focus();
        return existingWindow;
      }
      // 窗口已销毁，从 Map 中移除
      this.windows.delete(windowId);
    }

    // 获取屏幕工作区大小
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // 默认窗口尺寸和位置
    const defaultBounds = {
      width: 1200,
      height: 800,
      x: Math.floor((screenWidth - 1200) / 2),
      y: Math.floor((screenHeight - 800) / 2),
    };

    const finalBounds = { ...defaultBounds, ...bounds };

    const window = new BrowserWindow({
      width: finalBounds.width,
      height: finalBounds.height,
      x: finalBounds.x,
      y: finalBounds.y,
      minWidth: 960,
      minHeight: 720,
      frame: false,
      show: false,
      resizable: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        webviewTag: true, // 支持工具 webview
      },
      ...getPlatformWindowConfig({ frameless: true }),
    });

    // 加载分离窗口页面
    if (process.env.VITE_DEV_SERVER_URL) {
      window.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/detached/${windowId}`);
    } else {
      window.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: `/detached/${windowId}`,
      });
    }

    // 窗口准备好后显示
    window.once('ready-to-show', () => {
      window.show();
    });

    // 窗口关闭时通知所有渲染进程
    window.on('close', () => {
      logger.info(`Detached window closing: ${windowId}`);
      this.closingWindowIds.add(windowId);
      const reason = this.closeReasonByWindowId.get(windowId) ?? 'user';

      // 广播窗口关闭事件到所有窗口（包括主窗口）
      BrowserWindow.getAllWindows().forEach(win => {
        if (!win.isDestroyed()) {
          win.webContents.send('window:closing', { windowId, reason });
        }
      });
    });

    // 窗口关闭后从 Map 中移除
    window.on('closed', () => {
      this.windows.delete(windowId);
      this.closingWindowIds.delete(windowId);
      this.closeReasonByWindowId.delete(windowId);
      this.bootStateByWindowId.delete(windowId);
      this.pendingBootStateWindowIds.delete(windowId);
      logger.info(`Detached window closed: ${windowId}`);
    });

    // 保存窗口引用
    this.windows.set(windowId, window);

    logger.info(`Detached window created: ${windowId}`);
    return window;
  }

  /**
   * 关闭分离窗口
   */
  closeDetachedWindow(windowId: string, reason: string = 'api'): void {
    if (this.closingWindowIds.has(windowId)) return;
    const window = this.windows.get(windowId);
    if (window && !window.isDestroyed()) {
      this.closingWindowIds.add(windowId);
      this.closeReasonByWindowId.set(windowId, reason);
      window.close();
      logger.info(`Closing detached window: ${windowId}`);
    } else {
      logger.warn(`Window not found or already destroyed: ${windowId}`);
    }
  }

  /**
   * 获取窗口实例
   */
  getWindow(windowId: string): BrowserWindow | undefined {
    const window = this.windows.get(windowId);
    if (window && window.isDestroyed()) {
      this.windows.delete(windowId);
      return undefined;
    }
    return window;
  }

  /**
   * 获取所有分离窗口 ID
   */
  getAllWindowIds(): string[] {
    return Array.from(this.windows.keys());
  }

  /**
   * 注册 IPC 处理器
   */
  registerIPCHandlers(): void {
    // 创建分离窗口
    ipcMain.handle(
      IpcChannel.Window_CreateDetached,
      async (
        _event,
        params: { windowId: string; tabId: string; bounds?: Partial<Bounds>; bootState?: unknown }
      ) => {
        const { windowId, bounds, bootState } = params;

        logger.info(`Creating detached window ${windowId}, bootState: ${bootState ? 'provided' : 'none'}`);

        // 创建窗口
        const detachedWindow = this.createDetachedWindow(windowId, bounds);

        if (bootState) {
          this.bootStateByWindowId.set(windowId, bootState);
          this.pendingBootStateWindowIds.add(windowId);
          // 日志输出 bootState 中的标签信息
          if (typeof bootState === 'object' && bootState !== null && 'toolTabs' in bootState) {
            const state = bootState as { toolTabs?: unknown[] };
            logger.info(`bootState contains ${Array.isArray(state.toolTabs) ? state.toolTabs.length : 0} tabs`);
          }
          // 注意：bootState 将在收到 window:renderer-ready 握手后发送
          // 同时保留 invoke 方式作为备份（渲染进程主动拉取）
        }

        // 广播窗口创建事件到所有窗口
        BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) {
            win.webContents.send('window:state-changed', {
              action: 'window-created',
              windowId,
            });
          }
        });

        return { windowId, success: true };
      }
    );

    // 获取新窗口启动状态（一次性消费）
    ipcMain.handle(IpcChannel.Window_GetDetachedBootState, async (_event, windowId: string) => {
      const state = this.bootStateByWindowId.get(windowId) ?? null;
      // 注意：不立即删除，等握手或显式消费后再删除
      return state;
    });

    // 渲染进程准备就绪握手
    ipcMain.handle(IpcChannel.Window_RendererReady, async (event, windowId: string) => {
      if (!this.pendingBootStateWindowIds.has(windowId)) {
        logger.debug(`Window ${windowId} ready signal received, but no pending bootState`);
        return { success: true, hasBootState: false };
      }

      const bootState = this.bootStateByWindowId.get(windowId);
      if (!bootState) {
        logger.warn(`Window ${windowId} ready signal received, but bootState not found`);
        this.pendingBootStateWindowIds.delete(windowId);
        return { success: true, hasBootState: false };
      }

      // 找到对应的窗口并发送 bootState
      const win = this.windows.get(windowId);
      if (win && !win.isDestroyed()) {
        win.webContents.send('window:boot-state', bootState);
        logger.info(`Sent boot-state to window ${windowId} via handshake`);
      }

      // 清理
      this.pendingBootStateWindowIds.delete(windowId);
      this.bootStateByWindowId.delete(windowId);

      return { success: true, hasBootState: true };
    });

    // 关闭分离窗口
    ipcMain.handle(IpcChannel.Window_CloseDetached, async (_event, payload: unknown) => {
      if (typeof payload === 'string') {
        this.closeDetachedWindow(payload, 'api');
        return { success: true };
      }

      if (!payload || typeof payload !== 'object') {
        logger.warn('Invalid payload for window:close-detached');
        return { success: false };
      }

      const data = payload as { windowId?: unknown; reason?: unknown };
      const windowId = typeof data.windowId === 'string' ? data.windowId : null;
      const reason = typeof data.reason === 'string' ? data.reason : 'api';
      if (!windowId) {
        logger.warn('Invalid windowId for window:close-detached');
        return { success: false };
      }

      this.closeDetachedWindow(windowId, reason);
      return { success: true };
    });

    // 移动标签到窗口（用于跨窗口拖拽）
    ipcMain.handle(
      IpcChannel.Window_MoveTab,
      async (_event, params: { tabId: string; targetWindowId: string }) => {
        const { tabId, targetWindowId } = params;

        // 广播标签移动事件到所有窗口
        BrowserWindow.getAllWindows().forEach(win => {
          if (!win.isDestroyed()) {
            win.webContents.send('window:tab-moved', {
              tabId,
              targetWindowId,
            });
          }
        });

        return { success: true };
      }
    );

    logger.info('Detached window IPC handlers registered');
  }

  /**
   * 清理所有窗口
   */
  destroy(): void {
    this.windows.forEach(window => {
      if (!window.isDestroyed()) {
        window.close();
      }
    });
    this.windows.clear();
    logger.info('All detached windows destroyed');
  }
}

export const detachedWindowManager = new DetachedWindowManager();
