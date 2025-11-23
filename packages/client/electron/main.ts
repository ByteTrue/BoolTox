/**
 * Electron Main Process - 极简版
 * 
 * 只做必要的事情：
 * 1. 创建窗口
 * 2. 注册IPC处理器
 * 3. 管理内部模块
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'os';
import { getAllDisksInfo, formatOSName } from './utils/system-info.js';
import { moduleStoreService } from './services/module-store.service.js';
import { AutoUpdateService } from './services/auto-update.service.js';
import { gitOpsService, type GitOpsConfig } from './services/git-ops.service.js';
import { pluginManager } from './services/plugin/plugin-manager.js';
import { pluginRunner } from './services/plugin/plugin-runner.js';
import { pluginInstaller } from './services/plugin/plugin-installer.js';
import './services/plugin/plugin-api-handler.js'; // Initialize API handlers
import type { StoredModuleInfo } from '../src/shared/types/module-store.types.js';
import type { PluginRegistryEntry } from '@booltox/shared';

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
let autoUpdateService: AutoUpdateService | null = null;

/**
 * 创建主窗口
 */
function createWindow() {
  // 基础窗口配置
  const baseConfig: Electron.BrowserWindowConstructorOptions = {
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
  const platformConfig: Partial<Electron.BrowserWindowConstructorOptions> = (() => {
    switch (process.platform) {
      case 'win32':
        // Windows 11 特定优化
        return {
          backgroundMaterial: 'mica', // Mica 材质（自动圆角）
          titleBarStyle: 'hidden', // 隐藏标题栏但保留窗口控制
        };
      
      case 'darwin':
        // macOS 特定优化
        return {
          titleBarStyle: 'hiddenInset', // macOS 隐藏标题栏（保留红绿灯按钮）
          trafficLightPosition: { x: 16, y: 16 }, // 红绿灯按钮位置
          vibrancy: 'under-window', // macOS 毛玻璃效果
          visualEffectState: 'active', // 始终激活视觉效果
          transparent: false, // macOS 不需要透明窗口即可圆角
        };
      
      case 'linux':
        // Linux 特定优化
        return {
          transparent: false, // Linux 避免透明窗口问题
          backgroundColor: '#1c1e23', // 深色背景（与应用主题一致）
        };
      
      default:
        return {};
    }
  })();

  mainWindow = new BrowserWindow({
    ...baseConfig,
    ...platformConfig,
  });

  // 隐藏菜单栏
  mainWindow.setMenuBarVisibility(false);
  mainWindow.setMenu(null);

  // macOS 特定：设置窗口外观
  if (process.platform === 'darwin') {
    // 自动跟随系统深色模式
    mainWindow.setWindowButtonVisibility(true);
  }

  // 加载页面
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // 开发环境打开开发者工具（独立窗口）
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

/**
 * 窗口控制
 */
ipcMain.handle('window:control', (_event, action: string) => {
  if (!mainWindow) return;

  switch (action) {
    case 'minimize':
      mainWindow.minimize();
      break;
    case 'toggle-maximize':
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
      break;
    case 'close':
      mainWindow.close();
      break;
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
    console.error('Failed to get system info:', error);
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
    console.error('[IPC] Failed to get installed modules:', error);
    return [];
  }
});

// 获取单个模块信息
ipcMain.handle('module-store:get', (_event, id: string) => {
  try {
    return moduleStoreService.getModuleInfo(id) || null;
  } catch (error) {
    console.error('[IPC] Failed to get module info:', error);
    return null;
  }
});

// 添加模块记录
ipcMain.handle('module-store:add', (_event, info: StoredModuleInfo) => {
  try {
    moduleStoreService.addModule(info);
    return { success: true };
  } catch (error) {
    console.error('[IPC] Failed to add module:', error);
    return { success: false, error: String(error) };
  }
});

// 更新模块信息 (完整更新)
ipcMain.handle('module-store:update', (_event, id: string, partialInfo: Partial<StoredModuleInfo>) => {
  try {
    moduleStoreService.updateModuleInfo(id, partialInfo);
    return { success: true };
  } catch (error) {
    console.error('[IPC] Failed to update module info:', error);
    return { success: false, error: String(error) };
  }
});

// 删除模块记录
ipcMain.handle('module-store:remove', (_event, id: string) => {
  try {
    moduleStoreService.removeModule(id);
    return { success: true };
  } catch (error) {
    console.error('[IPC] Failed to remove module:', error);
    return { success: false, error: String(error) };
  }
});

// 获取模块缓存路径
ipcMain.handle('module-store:get-cache-path', (_event, moduleId: string) => {
  try {
    return moduleStoreService.getModuleCachePath(moduleId);
  } catch (error) {
    console.error('[IPC] Failed to get cache path:', error);
    return null;
  }
});

// 删除模块缓存
ipcMain.handle('module-store:remove-cache', (_event, moduleId: string) => {
  try {
    return moduleStoreService.removeModuleCache(moduleId);
  } catch (error) {
    console.error('[IPC] Failed to remove module cache:', error);
    return false;
  }
});

// 获取配置文件路径（调试用）
ipcMain.handle('module-store:get-config-path', () => {
  try {
    return moduleStoreService.getConfigPath();
  } catch (error) {
    console.error('[IPC] Failed to get config path:', error);
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

ipcMain.handle('git-ops:get-plugins', async () => {
  return await gitOpsService.getPluginRegistry();
});

/**
 * Plugin System - IPC Handlers
 */
ipcMain.handle('plugin:get-all', () => {
  return pluginManager.getAllPlugins();
});

ipcMain.handle('plugin:start', async (_event, id: string) => {
  if (!mainWindow) throw new Error('Main window not found');
  return await pluginRunner.startPlugin(id, mainWindow);
});

ipcMain.handle('plugin:stop', (_event, id: string) => {
  if (!mainWindow) return;
  pluginRunner.stopPlugin(id, mainWindow);
});

ipcMain.handle('plugin:resize', (_event, id: string, bounds: Electron.Rectangle) => {
  pluginRunner.resizePlugin(id, bounds);
});

ipcMain.handle('plugin:focus', (_event, id: string) => {
  pluginRunner.focusPlugin(id);
});

/**
 * Plugin Installation - IPC Handlers
 */
ipcMain.handle('plugin:install', async (_event, entry: PluginRegistryEntry) => {
  try {
    const pluginDir = await pluginInstaller.installPlugin(
      entry,
      (progress) => {
        // 发送进度更新到渲染进程
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('plugin:install-progress', progress);
        }
      },
      mainWindow || undefined
    );
    
    // 安装完成后,重新加载插件列表
    await pluginManager.loadPlugins();
    
    return { success: true, path: pluginDir };
  } catch (error) {
    console.error('[Main] Plugin installation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('plugin:uninstall', async (_event, pluginId: string) => {
  try {
    // 先停止插件
    if (mainWindow) {
      pluginRunner.stopPlugin(pluginId, mainWindow);
    }
    
    // 卸载插件
    await pluginInstaller.uninstallPlugin(pluginId);
    
    // 重新加载插件列表
    await pluginManager.loadPlugins();
    
    return { success: true };
  } catch (error) {
    console.error('[Main] Plugin uninstallation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
});

ipcMain.handle('plugin:cancel-install', (_event, pluginId: string) => {
  pluginInstaller.cancelDownload(pluginId);
  return { success: true };
});

/**
 * 应用启动
 */
app.whenReady().then(() => {
  // 平台特定的应用级优化
  setupPlatformOptimizations();
  
  createWindow();
  autoUpdateService = new AutoUpdateService(() => mainWindow);
  
  // Initialize Plugin System
  pluginInstaller.init().catch(err => console.error('Failed to init plugin installer:', err));
  pluginManager.init().catch(err => console.error('Failed to init plugin manager:', err));

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
