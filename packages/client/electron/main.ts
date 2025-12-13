/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Electron Main Process - 极简版
 * 
 * 只做必要的事情:
 * 1. 创建窗口
 * 2. 注册IPC处理器
 * 3. 管理内部模块
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import type { BrowserWindowConstructorOptions, Rectangle } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'os';
import { setupLogger, createLogger, openLogFolder, getLogPath } from './utils/logger.js';
import { getPlatformWindowConfig } from './utils/window-platform-config.js';
import { getAllDisksInfo, formatOSName } from './utils/system-info.js';
import { moduleStoreService } from './services/module-store.service.js';
import { AutoUpdateService } from './services/auto-update.service.js';
import { gitOpsService, type GitOpsConfig } from './services/git-ops.service.js';
import { toolManager } from './services/tool/tool-manager.js';
import { toolRunner } from './services/tool/tool-runner.js';
import { toolInstaller } from './services/tool/tool-installer.js';
import { pythonManager } from './services/python-manager.service.js';
import { TrayService } from './services/tray.service.js';
import { toolUpdater } from './services/tool/tool-updater.service.js';
import './services/tool/tool-api-handler.js'; // Initialize API handlers
import type { StoredModuleInfo } from '../src/shared/types/module-store.types.js';
import type { ToolRegistryEntry, ToolManifest } from '@booltox/shared';
import { IPC_CHANNELS, type RendererConsolePayload } from '../src/shared/constants/ipc-channels.js';

// 初始化日志系统 (必须在所有其他代码之前)
setupLogger();
const logger = createLogger('Main');
const rendererConsoleLogger = createLogger('RendererConsole');

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CPU 使用率计算相关变量
let previousCpuUsage = {
  idle: 0,
  total: 0,
};

// 环境变量
process.env.APP_ROOT = path.join(__dirname, '..');
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

let mainWindow: BrowserWindow | null = null;
let trayService: TrayService | null = null;

const processRendererConsoleLog = (payload?: RendererConsolePayload) => {
  if (!payload || typeof payload !== 'object') return;
  const { level, args } = payload;
  const logArgs = Array.isArray(args) ? args : [];
  const label = `console.${level ?? 'log'}`;

  switch (level) {
    case 'error':
      rendererConsoleLogger.error(label, ...logArgs);
      break;
    case 'warn':
      rendererConsoleLogger.warn(label, ...logArgs);
      break;
    case 'debug':
      rendererConsoleLogger.debug(label, ...logArgs);
      break;
    case 'info':
      rendererConsoleLogger.info(label, ...logArgs);
      break;
    case 'log':
    default:
      rendererConsoleLogger.info(label, ...logArgs);
      break;
  }
};

ipcMain.on(IPC_CHANNELS.RENDERER_CONSOLE_LOG, (_event, payload: RendererConsolePayload) => {
  processRendererConsoleLog(payload);
});

ipcMain.handle(IPC_CHANNELS.RENDERER_CONSOLE_LOG, async (_event, payload: RendererConsolePayload) => {
  processRendererConsoleLog(payload);
  return { success: true };
});

/**
 * 创建主窗口
 */
function createWindow() {
  // 基础窗口配置
  const baseConfig: BrowserWindowConstructorOptions = {
    width: 1200,
    height: 800,
    minWidth: 960,  // 最小宽度：侧边栏 268px + 内容区最小 650px + 间距
    minHeight: 720, // 最小高度：标题栏 + 内容区合理显示
    frame: false, // 无边框窗口
    resizable: true, // 允许调整窗口大小
    maximizable: true, // 允许最大化窗口
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      v8CacheOptions: 'code', // 启用 V8 代码缓存
      backgroundThrottling: false, // 防止后台限流影响性能
    },
  };

  // 平台特定优化
  const platformConfig = getPlatformWindowConfig({ frameless: true });

  mainWindow = new BrowserWindow({
    ...baseConfig,
    ...platformConfig,
  });

  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  // macOS 特定：设置窗口外观
  if (process.platform === 'darwin') {
    // 自定义标题栏场景下隐藏系统窗口按钮
    mainWindow.setWindowButtonVisibility(false);
  }

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // 开发环境打开开发者工具（独立窗口）
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  // 窗口关闭事件处理：最小化到托盘 vs 退出应用
  mainWindow.on('close', (event) => {
    // 获取用户设置
    const store = moduleStoreService.getStore();
    const closeToTray = store.get('settings.closeToTray', true) as boolean;

    if (closeToTray && trayService) {
      // 最小化到托盘而不是退出
      event.preventDefault();
      mainWindow?.hide();
      logger.info('Window minimized to tray');
    } else {
      // 直接退出，清理所有资源
      logger.info('Application closing');
    }
  });
}

/**
 * 窗口控制 - 支持主窗口和所有工具窗口
 */
ipcMain.handle('window:control', (event, action: string) => {
  // 获取发送请求的窗口
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (!senderWindow) return;

  switch (action) {
    case 'minimize':
      senderWindow.minimize();
      break;
    case 'toggle-maximize':
      if (senderWindow.isMaximized()) {
        senderWindow.unmaximize();
      } else {
        senderWindow.maximize();
      }
      break;
    case 'close':
      senderWindow.close();
      break;
  }
});

/**
 * 应用设置 - 开机启动
 */
ipcMain.handle('app-settings:get-auto-launch', () => {
  try {
    return app.getLoginItemSettings().openAtLogin;
  } catch (error) {
    logger.error('Failed to get auto launch status:', error);
    return false;
  }
});

ipcMain.handle('app-settings:set-auto-launch', (_event, enabled: boolean) => {
  try {
    app.setLoginItemSettings({
      openAtLogin: enabled,
      openAsHidden: false,
    });
    logger.info(`Auto launch ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to set auto launch:', error);
    return { success: false, error: String(error) };
  }
});

/**
 * 应用设置 - 关闭到托盘
 */
ipcMain.handle('app-settings:get-close-to-tray', () => {
  try {
    const store = moduleStoreService.getStore();
    return store.get('settings.closeToTray', true) as boolean;
  } catch (error) {
    logger.error('Failed to get close to tray setting:', error);
    return true; // 默认启用
  }
});

ipcMain.handle('app-settings:set-close-to-tray', (_event, enabled: boolean) => {
  try {
    const store = moduleStoreService.getStore();
    store.set('settings.closeToTray', enabled);
    logger.info(`Close to tray ${enabled ? 'enabled' : 'disabled'}`);
    return { success: true };
  } catch (error) {
    logger.error('Failed to set close to tray:', error);
    return { success: false, error: String(error) };
  }
});

/**
 * 计算 CPU 使用率
 */
function getCpuUsage(): number {
  const cpus = os.cpus();
  
  let idle = 0;
  let total = 0;
  
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }
  
  const idleDiff = idle - previousCpuUsage.idle;
  const totalDiff = total - previousCpuUsage.total;
  
  previousCpuUsage = { idle, total };
  
  if (totalDiff === 0) return 0;
  
  const usage = 100 - (100 * idleDiff / totalDiff);
  return Math.max(0, Math.min(100, Math.round(usage * 10) / 10)); // 保留1位小数，限制在0-100
}

/**
 * 获取系统信息
 */
ipcMain.handle('get-system-info', async () => {
  try {
    const cpus = os.cpus();
    const disks = await getAllDisksInfo();
    const cpuUsage = getCpuUsage();

    return {
      os: {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        name: formatOSName(),
        arch: os.arch(),
      },
      cpu: {
        model: cpus[0]?.model || 'Unknown',
        cores: cpus.length,
        speed: cpus[0]?.speed || 0,
        architecture: os.arch(),
        usage: cpuUsage,
      },
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
      },
      disks,
      uptime: process.uptime(),
    };
  } catch (error) {
    logger.error('Failed to get system info:', error);
    return {
      os: { platform: 'unknown', release: '', type: '', name: 'Unknown' },
      cpu: { model: 'Unknown', cores: 0, speed: 0, usage: 0 },
      memory: { total: 0, free: 0, used: 0 },
      disks: [],
      uptime: 0,
    };
  }
});

/**
 * 模块存储服务 - IPC Handlers
 */

// 获取所有已安装模块
ipcMain.handle('module-store:get-all', () => {
  try {
    return moduleStoreService.getInstalledModules();
  } catch (error) {
    logger.error('[IPC] Failed to get installed modules:', error);
    return [];
  }
});

// 获取单个模块信息
ipcMain.handle('module-store:get', (_event, id: string) => {
  try {
    return moduleStoreService.getModuleInfo(id) || null;
  } catch (error) {
    logger.error('[IPC] Failed to get module info:', error);
    return null;
  }
});

// 添加模块记录
ipcMain.handle('module-store:add', (_event, info: StoredModuleInfo) => {
  try {
    moduleStoreService.addModule(info);
    return { success: true };
  } catch (error) {
    logger.error('[IPC] Failed to add module:', error);
    return { success: false, error: String(error) };
  }
});

// 更新模块信息 (完整更新)
ipcMain.handle('module-store:update', (_event, id: string, partialInfo: Partial<StoredModuleInfo>) => {
  try {
    moduleStoreService.updateModuleInfo(id, partialInfo);
    return { success: true };
  } catch (error) {
    logger.error('[IPC] Failed to update module info:', error);
    return { success: false, error: String(error) };
  }
});

// 删除模块记录
ipcMain.handle('module-store:remove', (_event, id: string) => {
  try {
    moduleStoreService.removeModule(id);
    return { success: true };
  } catch (error) {
    logger.error('[IPC] Failed to remove module:', error);
    return { success: false, error: String(error) };
  }
});

// 获取模块缓存路径
ipcMain.handle('module-store:get-cache-path', (_event, moduleId: string) => {
  try {
    return moduleStoreService.getModuleCachePath(moduleId);
  } catch (error) {
    logger.error('[IPC] Failed to get cache path:', error);
    return null;
  }
});

// 删除模块缓存
ipcMain.handle('module-store:remove-cache', (_event, moduleId: string) => {
  try {
    return moduleStoreService.removeModuleCache(moduleId);
  } catch (error) {
    logger.error('[IPC] Failed to remove module cache:', error);
    return false;
  }
});

// 获取配置文件路径（调试用）
ipcMain.handle('module-store:get-config-path', () => {
  try {
    return moduleStoreService.getConfigPath();
  } catch (error) {
    logger.error('[IPC] Failed to get config path:', error);
    return null;
  }
});

/**
 * GitOps 服务 - IPC Handlers
 */
ipcMain.handle('git-ops:get-config', () => {
  return gitOpsService.getConfig();
});

ipcMain.handle('git-ops:update-config', (_event, config: Partial<GitOpsConfig>) => {
  gitOpsService.updateConfig(config);
  return gitOpsService.getConfig();
});

ipcMain.handle('git-ops:get-announcements', async () => {
  return await gitOpsService.getAnnouncements();
});

ipcMain.handle('git-ops:get-tools', async () => {
  return await gitOpsService.getPluginRegistry();
});

/**
 * Logger - IPC Handlers
 */
ipcMain.handle('logger:get-log-path', () => {
  return getLogPath();
});

ipcMain.handle('logger:open-log-folder', async () => {
  await openLogFolder();
  return { success: true };
});

/**
 * Plugin System - IPC Handlers
 */
ipcMain.handle('tool:get-all', () => {
  return toolManager.getAllTools();
});

ipcMain.handle('tool:start', async (_event, id: string) => {
  if (!mainWindow) throw new Error('Main window not found');
  return await toolRunner.startTool(id, mainWindow);
});

ipcMain.handle('tool:stop', (_event, id: string) => {
  if (!mainWindow) return;
  toolRunner.stopTool(id, mainWindow);
});

ipcMain.handle('tool:focus', (_event, id: string) => {
  toolRunner.focusTool(id);
});

/**
 * Plugin Installation - IPC Handlers
 */
ipcMain.handle('tool:install', async (_event, entry: ToolRegistryEntry) => {
  try {
    const toolDir = await toolInstaller.installTool(
      entry,
      (progress) => {
        // 发送进度更新到渲染进程
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('tool:install-progress', progress);
        }
      },
      mainWindow || undefined
    );
    
    // 安装完成后,重新加载工具列表
    await toolManager.loadTools();
    
    return { success: true, path: toolDir };
  } catch (error) {
    logger.error('[Main] Plugin installation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('tool:uninstall', async (_event, pluginId: string) => {
  try {
    // 先停止工具
    if (mainWindow) {
      toolRunner.stopTool(pluginId, mainWindow);
    }
    
    // 卸载工具
    await toolInstaller.uninstallTool(pluginId);
    
    // 重新加载工具列表
    await toolManager.loadTools();
    
    return { success: true };
  } catch (error) {
    logger.error('[Main] Plugin uninstallation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('tool:cancel-install', (_event, pluginId: string) => {
  toolInstaller.cancelDownload(pluginId);
  return { success: true };
});

/**
 * 工具更新 - IPC Handlers
 */
ipcMain.handle('tool:check-updates', async () => {
  try {
    const updates = await toolUpdater.checkUpdates();
    return { success: true, updates };
  } catch (error) {
    logger.error('[Main] Failed to check updates:', error);
    return { success: false, error: String(error), updates: [] };
  }
});

ipcMain.handle('tool:update', async (_event, toolId: string) => {
  try {
    await toolUpdater.updateTool(toolId);
    // 重新加载工具列表
    await toolManager.loadTools();
    return { success: true };
  } catch (error) {
    logger.error(`[Main] Failed to update tool ${toolId}:`, error);
    return { success: false, error: String(error) };
  }
});

ipcMain.handle('tool:update-all', async (_event, toolIds: string[]) => {
  try {
    const result = await toolUpdater.updateAllTools(toolIds);
    // 重新加载工具列表
    await toolManager.loadTools();
    return { success: true, ...result };
  } catch (error) {
    logger.error('[Main] Failed to batch update tools:', error);
    return { success: false, error: String(error) };
  }
});

// ============ 用户本地添加二进制工具 ============
ipcMain.handle(
  'tool:add-local-binary',
  async (_event, params: { name: string; exePath: string; description?: string; args?: string[] }) => {
    try {
      const { name, exePath, description, args } = params;

      // 1. 验证文件存在
      if (!fs.existsSync(exePath)) {
        throw new Error('文件不存在');
      }

      // 2. 生成工具 ID（local. 前缀 + 文件名）
      const baseName = path.basename(exePath, path.extname(exePath));
      const id = `local.${baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

      // 3. 创建工具目录
      const pluginsDir = path.join(app.getPath('userData'), 'plugins');
      const toolDir = path.join(pluginsDir, id);
      await fs.promises.mkdir(toolDir, { recursive: true });

      // 4. 生成 manifest.json（不复制可执行文件，只记录路径）
      const manifest: ToolManifest = {
        id,
        version: '1.0.0',
        name,
        description: description ?? `本地工具：${name}`,
        protocol: '^2.0.0', // 添加协议版本
        runtime: {
          type: 'binary',
          command: exePath, // 绝对路径
          localExecutablePath: exePath, // 标记为本地工具
          args: args ?? [],
        },
      };

      await fs.promises.writeFile(
        path.join(toolDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
      );

      logger.info(`[Main] Local binary tool added: ${id} -> ${exePath}`);

      // 5. 重新扫描工具
      await toolManager.loadTools();

      return { success: true, pluginId: id };
    } catch (error) {
      logger.error('[Main] Failed to add local binary tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
);

// 文件选择对话框
ipcMain.handle('dialog:openFile', async (_event, options) => {
  if (!mainWindow) {
    throw new Error('Main window not found');
  }
  return await dialog.showOpenDialog(mainWindow, options);
});

/**
 * Python Runtime - IPC Handlers
 */

// 获取 Python 环境状态
ipcMain.handle('python:status', async () => {
  try {
    return await pythonManager.getStatus();
  } catch (error) {
    logger.error('[IPC] Failed to get Python status:', error);
    return {
      uvAvailable: false,
      pythonInstalled: false,
      venvExists: false,
      error: String(error)
    };
  }
});

// 确保 Python 环境就绪
ipcMain.handle('python:ensure', async () => {
  try {
    await pythonManager.ensurePython((progress) => {
      // 发送进度更新到渲染进程
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('python:progress', progress);
      }
    });
    return { success: true };
  } catch (error) {
    logger.error('[IPC] Failed to ensure Python:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 安装全局依赖
ipcMain.handle('python:install-global', async (_event, packages: string[]) => {
  try {
    await pythonManager.installGlobalPackages(packages, (progress) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('python:progress', progress);
      }
    });
    return { success: true };
  } catch (error) {
    logger.error('[IPC] Failed to install global packages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
});

// 列出全局已安装包
ipcMain.handle('python:list-global', async () => {
  try {
    return await pythonManager.listGlobalPackages();
  } catch (error) {
    logger.error('[IPC] Failed to list global packages:', error);
    return [];
  }
});

// 执行 Python 代码
ipcMain.handle('python:run-code', async (_event, code: string, options?: { cwd?: string; timeout?: number }) => {
  try {
    const result = await pythonManager.runCode(code, {
      cwd: options?.cwd,
      timeout: options?.timeout,
      onOutput: (data, type) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python:output', { data, type });
        }
      }
    });
    return result;
  } catch (error) {
    logger.error('[IPC] Failed to run Python code:', error);
    return {
      success: false,
      code: null,
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// 执行 Python 脚本文件
ipcMain.handle('python:run-script', async (
  _event, 
  scriptPath: string, 
  args?: string[], 
  options?: { cwd?: string; timeout?: number; pythonPath?: string }
) => {
  try {
    const result = await pythonManager.runScript(scriptPath, args || [], {
      cwd: options?.cwd,
      timeout: options?.timeout,
      env: options?.pythonPath ? { PYTHONPATH: options.pythonPath } : undefined,
      onOutput: (data, type) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('python:output', { data, type });
        }
      }
    });
    return result;
  } catch (error) {
    logger.error('[IPC] Failed to run Python script:', error);
    return {
      success: false,
      code: null,
      stdout: '',
      stderr: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

/**
 * 应用启动
 */
app.whenReady().then(() => {
  // 平台特定的应用级优化
  setupPlatformOptimizations();

  createWindow();
  new AutoUpdateService(() => mainWindow);

  // 初始化系统托盘
  if (mainWindow) {
    trayService = new TrayService(mainWindow);
    trayService.create();
  }

  // Initialize Plugin System
  toolInstaller.init().catch(err => logger.error('Failed to init tool installer:', err));
  toolManager.init().catch(err => logger.error('Failed to init tool manager:', err));

  app.on('activate', () => {
    // macOS 特性：点击 Dock 图标时重新创建窗口
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

/**
 * 平台特定的应用级优化
 */
function setupPlatformOptimizations() {
  switch (process.platform) {
    case 'win32':
      // Windows 特定优化
      // 1. 设置应用用户模型 ID（用于任务栏分组）
      app.setAppUserModelId('com.booltox.app');
      // 2. 禁用硬件加速（如果遇到渲染问题）
      // app.disableHardwareAcceleration();
      break;
    
    case 'darwin':
      // macOS 特定优化
      // 1. 设置 Dock 图标显示
      if (app.dock) {
        // app.dock.setIcon('path/to/icon.png'); // 可设置自定义图标
        app.dock.show();
      }
      // 2. 设置应用名称
      app.setName('Booltox');
      // 3. 关闭窗口时不退出应用（macOS 标准行为）
      app.on('window-all-closed', () => {
        // macOS 应用通常在所有窗口关闭后仍然保持运行
        // 不调用 app.quit()
      });
      break;
    
    case 'linux':
      // Linux 特定优化
      // 1. 设置应用名称
      app.setName('Booltox');
      // 2. 禁用 GPU 沙盒（某些 Linux 发行版需要）
      app.commandLine.appendSwitch('disable-gpu-sandbox');
      break;
  }
  
  // 通用优化：启用流畅滚动
  app.commandLine.appendSwitch('enable-smooth-scrolling');
  
  // 通用优化：启用原生窗口框架（如果支持）
  if (process.platform !== 'win32') {
    app.commandLine.appendSwitch('enable-transparent-visuals');
  }
}

/**
 * 所有窗口关闭时退出（macOS除外）
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
  logger.info('Application quitting, cleaning up resources...');

  // 销毁托盘
  if (trayService) {
    trayService.destroy();
    trayService = null;
  }

  // 停止所有运行中的工具
  try {
    await toolRunner.cleanupAllTools();
    logger.info('All tools stopped successfully');
  } catch (error) {
    logger.error('Failed to stop tools:', error);
  }
});

/**
 * BoolTox 退出前清理所有工具进程
 */
app.on('will-quit', async (event) => {
  event.preventDefault(); // 阻止立即退出

  logger.info('[Main] BoolTox 正在退出，清理所有运行中的工具进程...');

  try {
    await toolRunner.cleanupAllTools();
    logger.info('[Main] 所有工具进程已清理，BoolTox 退出');
  } catch (error) {
    logger.error('[Main] 清理工具进程时出错', error);
  } finally {
    app.exit(0); // 强制退出
  }
});
