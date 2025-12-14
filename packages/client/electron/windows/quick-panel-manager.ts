/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { BrowserWindow, screen, globalShortcut, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { IpcChannel } from '../../src/shared/constants/ipc-channels.js';
import { createLogger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logger = createLogger('QuickPanel');

class QuickPanelManager {
  private window: BrowserWindow | null = null;
  private mainWindow: BrowserWindow | null = null;

  /**
   * 设置主窗口引用
   */
  setMainWindow(window: BrowserWindow) {
    this.mainWindow = window;
  }

  /**
   * 创建快捷面板窗口
   */
  createWindow() {
    if (this.window && !this.window.isDestroyed()) {
      return;
    }

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    this.window = new BrowserWindow({
      width: 700,
      height: 500,
      x: Math.floor((screenWidth - 700) / 2),
      y: Math.floor((screenHeight - 500) / 3), // 偏上显示
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      show: false,
      minimizable: false,
      maximizable: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    // 加载快捷面板页面
    if (process.env.VITE_DEV_SERVER_URL) {
      this.window.loadURL(`${process.env.VITE_DEV_SERVER_URL}#/quick-panel`);
      // 开发环境：打开开发者工具（方便调试）
      this.window.webContents.openDevTools({ mode: 'detach' });
    } else {
      this.window.loadFile(path.join(__dirname, '../renderer/index.html'), {
        hash: '/quick-panel',
      });
    }

    // 失去焦点时隐藏
    this.window.on('blur', () => {
      this.hide();
    });

    // 窗口关闭时清理
    this.window.on('closed', () => {
      this.window = null;
    });

    logger.info('Quick panel window created');
  }

  /**
   * 注册全局快捷键
   */
  registerShortcut() {
    // 注册 Cmd+Shift+Space（macOS）或 Ctrl+Shift+Space（Windows/Linux）
    const shortcut = process.platform === 'darwin' ? 'Command+Shift+Space' : 'Ctrl+Shift+Space';

    const success = globalShortcut.register(shortcut, () => {
      this.toggle();
    });

    if (success) {
      logger.info(`Quick panel shortcut registered: ${shortcut}`);
    } else {
      logger.error(`Failed to register quick panel shortcut: ${shortcut}`);
    }
  }

  /**
   * 注销全局快捷键
   */
  unregisterShortcut() {
    globalShortcut.unregisterAll();
    logger.info('Quick panel shortcut unregistered');
  }

  /**
   * 显示快捷面板
   */
  show() {
    if (!this.window || this.window.isDestroyed()) {
      this.createWindow();
    }

    // 重新居中显示
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;
    this.window?.setBounds({
      x: Math.floor((screenWidth - 700) / 2),
      y: Math.floor((screenHeight - 500) / 3),
      width: 700,
      height: 500,
    });

    this.window?.show();
    this.window?.focus();
    logger.info('Quick panel shown');
  }

  /**
   * 隐藏快捷面板
   */
  hide() {
    this.window?.hide();
    logger.info('Quick panel hidden');
  }

  /**
   * 切换快捷面板显示/隐藏
   */
  toggle() {
    logger.info('🔥 快捷面板切换触发！当前可见:', this.window?.isVisible());

    if (this.window?.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * 显示主窗口并隐藏快捷面板
   */
  showMainWindow() {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
      this.mainWindow.focus();
      this.hide();
      logger.info('Main window shown from quick panel');
    }
  }

  /**
   * 导航到指定路由并显示主窗口
   */
  navigateTo(route: string) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('navigate-to', route);
      this.mainWindow.show();
      this.mainWindow.focus();
      this.hide();
      logger.info(`Navigating to ${route} from quick panel`);
    }
  }

  /**
   * 注册 IPC 处理器
   */
  registerIPCHandlers() {
    // 隐藏快捷面板
    ipcMain.handle(IpcChannel.QuickPanel_Hide, () => {
      this.hide();
    });

    // 显示主窗口
    ipcMain.handle(IpcChannel.QuickPanel_ShowMain, () => {
      this.showMainWindow();
    });

    // 导航到指定路由
    ipcMain.handle(IpcChannel.QuickPanel_Navigate, (_event, route: string) => {
      this.navigateTo(route);
    });

    logger.info('Quick panel IPC handlers registered');
  }

  /**
   * 清理资源
   */
  destroy() {
    this.unregisterShortcut();
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
    this.window = null;
    logger.info('Quick panel manager destroyed');
  }
}

export const quickPanelManager = new QuickPanelManager();
