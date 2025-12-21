/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Electron Main Process - 简洁版
 *
 * 职责：
 * 1. 创建窗口
 * 2. 初始化服务
 * 3. 管理应用生命周期
 *
 * IPC handlers 已迁移到 electron/ipc-registry.ts
 */

import { app, BrowserWindow } from 'electron';
import type { BrowserWindowConstructorOptions } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { setupLogger, createLogger } from './utils/logger.js';
import { getPlatformWindowConfig } from './utils/window-platform-config.js';
import { moduleStoreService } from './services/module-store.service.js';
import { AutoUpdateService } from './services/auto-update.service.js';
import { toolManager } from './services/tool/tool-manager.js';
import { toolRunner } from './services/tool/tool-runner.js';
import { toolInstaller } from './services/tool/tool-installer.js';
import { TrayService } from './services/tray.service.js';
import { quickPanelManager } from './windows/quick-panel-manager.js';
import { detachedWindowManager } from './windows/detached-window-manager.js';
import { registerAllIpcHandlers } from './ipc-registry.js';
import './services/tool/tool-api-handler.js'; // Initialize API handlers

// 初始化日志系统
setupLogger();
const logger = createLogger('Main');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 环境变量
process.env.APP_ROOT = path.join(__dirname, '..');
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let mainWindow: BrowserWindow | null = null;
let trayService: TrayService | null = null;

/**
 * 创建主窗口
 */
function createWindow() {
  // 基础窗口配置
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
      webviewTag: true, // 启用 webview 支持，用于嵌入工具前端
      v8CacheOptions: 'code',
      backgroundThrottling: false,
    },
  };

  // 平台特定优化
  // macOS 需要显示红绿灯按钮，不使用 frameless 模式
  const platformConfig = getPlatformWindowConfig({ frameless: false });

  mainWindow = new BrowserWindow({
    ...baseConfig,
    ...platformConfig,
  });

  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  // macOS 使用系统原生按钮，Windows/Linux 使用自定义按钮
  // 不需要隐藏 macOS 的红绿灯按钮，window-platform-config 已正确配置 trafficLightPosition

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // 窗口关闭事件处理
  mainWindow.on('close', (event) => {
    const store = moduleStoreService.getStore();
    const closeToTray = store.get('settings.closeToTray', true) as boolean;

    if (closeToTray && trayService) {
      event.preventDefault();
      mainWindow?.hide();
      logger.info('窗口最小化到托盘');
    } else {
      logger.info('应用关闭');
    }
  });

  // 设置主窗口引用
  quickPanelManager.setMainWindow(mainWindow);
}

/**
 * 平台特定的应用级优化
 */
function setupPlatformOptimizations() {
  switch (process.platform) {
    case 'win32':
      app.setAppUserModelId('com.booltox.app');
      break;

    case 'darwin':
      if (app.dock) {
        app.dock.show();
      }
      app.setName('Booltox');
      break;

    case 'linux':
      app.commandLine.appendSwitch('enable-features', 'VaapiVideoDecoder');
      break;
  }
}

/**
 * 应用启动
 */
app.whenReady().then(() => {
  setupPlatformOptimizations();

  createWindow();
  new AutoUpdateService(() => mainWindow);

  // 注册所有 IPC handlers（集中管理）
  registerAllIpcHandlers(mainWindow);

  // 初始化系统托盘
  if (mainWindow) {
    trayService = new TrayService(mainWindow);
    trayService.create();
  }

  // 初始化快捷面板
  quickPanelManager.createWindow();
  quickPanelManager.registerShortcut();
  quickPanelManager.registerIPCHandlers();

  // 注册分离窗口管理器的 IPC 处理器
  detachedWindowManager.registerIPCHandlers();

  // 初始化工具系统
  toolInstaller.init().catch(err => logger.error('工具安装器初始化失败:', err));
  toolManager.init().catch(err => logger.error('工具管理器初始化失败:', err));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 窗口全部关闭时退出（Windows/Linux）
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * 应用退出前清理资源
 */
app.on('before-quit', async () => {
  logger.info('应用退出，清理资源...');

  // 销毁托盘
  if (trayService) {
    trayService.destroy();
    trayService = null;
  }

  // 清理快捷面板
  quickPanelManager.destroy();

  // 清理所有分离窗口
  detachedWindowManager.destroy();

  // 停止所有运行中的工具
  try {
    await toolRunner.cleanupAllTools();
    logger.info('所有工具已停止');
  } catch (error) {
    logger.error('停止工具失败:', error);
  }
});

/**
 * 清理所有工具进程
 */
app.on('will-quit', async (event) => {
  event.preventDefault();

  logger.info('清理所有运行中的工具进程...');

  try {
    await toolRunner.cleanupAllTools();
    logger.info('✅ 所有工具进程已清理');
    app.exit(0);
  } catch (error) {
    logger.error('清理工具进程失败:', error);
    app.exit(1);
  }
});
