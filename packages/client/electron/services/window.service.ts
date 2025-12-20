/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 窗口管理服务
 * 参考 Cherry Studio WindowService 设计
 */

import { BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { getPlatformWindowConfig } from '../utils/platform-utils.js';

const logger = createLogger('WindowService');

class WindowService {
  private static instance: WindowService;
  private mainWindow: BrowserWindow | null = null;
  private rendererDist: string;
  private devServerUrl: string | undefined;

  private constructor() {
    this.rendererDist = path.join(process.env.APP_ROOT || '', 'dist');
    this.devServerUrl = process.env.VITE_DEV_SERVER_URL;
  }

  /**
   * 获取单例
   */
  public static getInstance(): WindowService {
    if (!WindowService.instance) {
      WindowService.instance = new WindowService();
    }
    return WindowService.instance;
  }

  /**
   * 创建主窗口
   */
  public createMainWindow(): BrowserWindow {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
      return this.mainWindow;
    }

    // 基础配置
    const baseConfig: BrowserWindowConstructorOptions = {
      width: 1200,
      height: 800,
      minWidth: 960,
      minHeight: 720,
      frame: false,
      resizable: true,
      maximizable: true,
      webPreferences: {
        preload: path.join(__dirname, 'preload.mjs'),
        contextIsolation: true,
        nodeIntegration: false,
        v8CacheOptions: 'code',
        backgroundThrottling: false,
      },
    };

    // 平台特定优化
    const platformConfig = getPlatformWindowConfig({ frameless: true });

    this.mainWindow = new BrowserWindow({
      ...baseConfig,
      ...platformConfig,
    });

    // 隐藏菜单栏
    this.mainWindow.setMenuBarVisibility(false);
    this.mainWindow.setMenu(null);

    // macOS 特定
    if (process.platform === 'darwin') {
      this.mainWindow.setWindowButtonVisibility(false);
    }

    // 加载页面
    if (this.devServerUrl) {
      this.mainWindow.loadURL(this.devServerUrl);
      this.mainWindow.webContents.openDevTools({ mode: 'detach' });
      logger.info('主窗口加载开发服务器:', this.devServerUrl);
    } else {
      this.mainWindow.loadFile(path.join(this.rendererDist, 'index.html'));
      logger.info('主窗口加载生产页面');
    }

    logger.info('主窗口已创建');

    return this.mainWindow;
  }

  /**
   * 获取主窗口
   */
  public getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  /**
   * 显示主窗口
   */
  public showMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.show();
      this.mainWindow.focus();
    }
  }

  /**
   * 隐藏主窗口
   */
  public hideMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.hide();
    }
  }

  /**
   * 关闭主窗口
   */
  public closeMainWindow(): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.close();
    }
    this.mainWindow = null;
  }

  /**
   * 设置窗口关闭处理器
   */
  public setCloseHandler(handler: (event: Electron.Event) => void): void {
    if (this.mainWindow) {
      this.mainWindow.on('close', handler);
    }
  }

  /**
   * 清理资源
   */
  public destroy(): void {
    this.closeMainWindow();
    logger.info('WindowService 已销毁');
  }
}

export const windowService = WindowService.getInstance();
