/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Electron Preload - 极简版
 * 
 * 暴露安全的API给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type { StoredModuleInfo } from '../src/shared/types/module-store.types';
import type { Announcement, GitOpsConfig, PluginRegistry } from './services/git-ops.service';
import type { AutoUpdateStatus } from './services/auto-update.service';
import { IpcChannel } from '../src/shared/constants/ipc-channels';

/**
 * 窗口控制API
 */
const windowAPI = {
  minimize: async () => {
    await ipcRenderer.invoke('window:control', 'minimize');
  },
  toggleMaximize: async () => {
    await ipcRenderer.invoke('window:control', 'toggle-maximize');
  },
  close: async () => {
    await ipcRenderer.invoke('window:control', 'close');
  },
};

/**
 * 快捷面板API
 */
const quickPanelAPI = {
  hide: async () => {
    await ipcRenderer.invoke('quick-panel:hide');
  },
  showMain: async () => {
    await ipcRenderer.invoke('quick-panel:show-main');
  },
  navigateTo: async (route: string) => {
    await ipcRenderer.invoke('quick-panel:navigate', route);
  },
};

/**
 * 简单的IPC通信
 */
const ipcAPI = {
  invoke: (channel: string, ...args: unknown[]) => ipcRenderer.invoke(channel, ...args) as Promise<unknown>,
  on: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...listenerArgs) => listener(...listenerArgs));
  },
  off: (channel: string, listener: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
  },
  send: (channel: string, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  },
};

/**
 * 模块存储API
 */
const moduleStoreAPI = {
  /**
   * 获取所有已安装模块
   */
  getAll: async (): Promise<StoredModuleInfo[]> => {
    return await ipcRenderer.invoke('module-store:get-all') as StoredModuleInfo[];
  },

  /**
   * 获取单个模块信息
   */
  get: async (id: string): Promise<StoredModuleInfo | null> => {
    return await ipcRenderer.invoke('module-store:get', id) as StoredModuleInfo | null;
  },

  /**
   * 添加模块记录
   */
  add: async (info: StoredModuleInfo): Promise<{ success: boolean; error?: string }> => {
    return await ipcRenderer.invoke('module-store:add', info) as { success: boolean; error?: string };
  },

  /**
   * 更新模块信息 (完整更新)
   */
  update: async (id: string, info: Partial<StoredModuleInfo>): Promise<{ success: boolean; error?: string }> => {
    return await ipcRenderer.invoke('module-store:update', id, info) as { success: boolean; error?: string };
  },

  /**
   * 更新模块状态
   */


  /**
   * 删除模块记录
   */
  remove: async (id: string): Promise<{ success: boolean; error?: string }> => {
    return await ipcRenderer.invoke('module-store:remove', id) as { success: boolean; error?: string };
  },

  /**
   * 获取模块缓存路径
   */
  getCachePath: async (moduleId: string): Promise<string | null> => {
    return await ipcRenderer.invoke('module-store:get-cache-path', moduleId) as string | null;
  },

  /**
   * 删除模块缓存
   */
  removeCache: async (moduleId: string): Promise<boolean> => {
    return await ipcRenderer.invoke('module-store:remove-cache', moduleId) as boolean;
  },

  /**
   * 获取配置文件路径（调试用）
   */
  getConfigPath: async (): Promise<string | null> => {
    return await ipcRenderer.invoke('module-store:get-config-path') as string | null;
  },
};

const updateAPI = {
  check: async () => {
    return await ipcRenderer.invoke('auto-update:check');
  },
  download: async () => {
    return await ipcRenderer.invoke('auto-update:download');
  },
  install: async () => {
    return await ipcRenderer.invoke('auto-update:quit-and-install');
  },
  getStatus: async (): Promise<AutoUpdateStatus> => {
    return await ipcRenderer.invoke('auto-update:get-status') as AutoUpdateStatus;
  },
  onStatus: (listener: (status: AutoUpdateStatus) => void) => {
    const channel = 'update:status';
    const handler = (_event: unknown, status: AutoUpdateStatus) => listener(status);
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },
};

const gitOpsAPI = {
  getConfig: async (): Promise<GitOpsConfig> => {
    return await ipcRenderer.invoke('git-ops:get-config') as GitOpsConfig;
  },
  updateConfig: async (config: Partial<GitOpsConfig>): Promise<GitOpsConfig> => {
    return await ipcRenderer.invoke('git-ops:update-config', config) as GitOpsConfig;
  },
  getAnnouncements: async (): Promise<Announcement[]> => {
    return await ipcRenderer.invoke('git-ops:get-announcements') as Announcement[];
  },
  getTools: async (): Promise<PluginRegistry> => {
    return await ipcRenderer.invoke('git-ops:get-tools') as PluginRegistry;
  },
};

/**
 * Plugin API - 工具安装相关
 */
const toolAPI = {
  getAll: async (): Promise<unknown[]> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_GetAll) as unknown[];
  },
  start: async (toolId: string): Promise<unknown> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Start, toolId);
  },
  stop: async (toolId: string): Promise<void> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Stop, toolId);
  },
  focus: async (toolId: string): Promise<void> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Focus, toolId);
  },
  install: async (entry: unknown): Promise<{success: boolean; path?: string; error?: string}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Install, entry) as {success: boolean; path?: string; error?: string};
  },
  uninstall: async (pluginId: string): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Uninstall, pluginId) as {success: boolean; error?: string};
  },
  cancelInstall: async (pluginId: string): Promise<{success: boolean}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_CancelInstall, pluginId) as {success: boolean};
  },
  onInstallProgress: (callback: (progress: unknown) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, progress: unknown) => callback(progress);
    ipcRenderer.on('tool:install-progress', listener);
    return () => ipcRenderer.removeListener('tool:install-progress', listener);
  },
  checkUpdates: async (): Promise<{success: boolean; updates: unknown[]; error?: string}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_CheckUpdates) as {success: boolean; updates: unknown[]; error?: string};
  },
  updateTool: async (toolId: string): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_Update, toolId) as {success: boolean; error?: string};
  },
  updateAllTools: async (toolIds: string[]): Promise<{success: boolean; updated: string[]; failed: string[]; error?: string}> => {
    return await ipcRenderer.invoke(IpcChannel.Tool_UpdateAll, toolIds) as {success: boolean; updated: string[]; failed: string[]; error?: string};
  },
};

/**
 * 应用设置 API
 */
const appSettingsAPI = {
  getAutoLaunch: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('app-settings:get-auto-launch') as boolean;
  },
  setAutoLaunch: async (enabled: boolean): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke('app-settings:set-auto-launch', enabled) as {success: boolean; error?: string};
  },
  getCloseToTray: async (): Promise<boolean> => {
    return await ipcRenderer.invoke('app-settings:get-close-to-tray') as boolean;
  },
  setCloseToTray: async (enabled: boolean): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke('app-settings:set-close-to-tray', enabled) as {success: boolean; error?: string};
  },
};

/**
 * Python 运行时 API
 */
interface PythonStatus {
  uvAvailable: boolean;
  uvVersion?: string;
  pythonInstalled: boolean;
  pythonVersion?: string;
  pythonPath?: string;
  venvExists: boolean;
  venvPath?: string;
  error?: string;
}

interface PythonRunResult {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

interface PythonProgress {
  stage: 'download' | 'install' | 'venv' | 'deps';
  message: string;
  percent?: number;
}

const pythonAPI = {
  /**
   * 获取 Python 环境状态
   */
  getStatus: async (): Promise<PythonStatus> => {
    return await ipcRenderer.invoke('python:status') as PythonStatus;
  },

  /**
   * 确保 Python 环境就绪
   */
  ensure: async (): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke('python:ensure') as {success: boolean; error?: string};
  },

  /**
   * 安装全局依赖
   */
  installGlobal: async (packages: string[]): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke('python:install-global', packages) as {success: boolean; error?: string};
  },

  /**
   * 列出全局已安装包
   */
  listGlobal: async (): Promise<string[]> => {
    return await ipcRenderer.invoke('python:list-global') as string[];
  },

  /**
   * 执行 Python 代码
   */
  runCode: async (code: string, options?: { cwd?: string; timeout?: number }): Promise<PythonRunResult> => {
    return await ipcRenderer.invoke('python:run-code', code, options) as PythonRunResult;
  },

  /**
   * 执行 Python 脚本
   */
  runScript: async (
    scriptPath: string, 
    args?: string[], 
    options?: { cwd?: string; timeout?: number; pythonPath?: string }
  ): Promise<PythonRunResult> => {
    return await ipcRenderer.invoke('python:run-script', scriptPath, args, options) as PythonRunResult;
  },

  /**
   * 监听进度事件
   */
  onProgress: (callback: (progress: PythonProgress) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, progress: PythonProgress) => callback(progress);
    ipcRenderer.on('python:progress', listener);
    return () => ipcRenderer.removeListener('python:progress', listener);
  },

  /**
   * 监听输出事件
   */
  onOutput: (callback: (data: { data: string; type: 'stdout' | 'stderr' }) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, data: { data: string; type: 'stdout' | 'stderr' }) => callback(data);
    ipcRenderer.on('python:output', listener);
    return () => ipcRenderer.removeListener('python:output', listener);
  },
};

/**
 * 暴露API到渲染进程
 */
contextBridge.exposeInMainWorld('electron', {
  window: windowAPI,
});

contextBridge.exposeInMainWorld('ipc', ipcAPI);

contextBridge.exposeInMainWorld('moduleStore', moduleStoreAPI);

contextBridge.exposeInMainWorld('update', updateAPI);

contextBridge.exposeInMainWorld('gitOps', gitOpsAPI);

contextBridge.exposeInMainWorld('tool', toolAPI);

contextBridge.exposeInMainWorld('appSettings', appSettingsAPI);

contextBridge.exposeInMainWorld('python', pythonAPI);

contextBridge.exposeInMainWorld('quickPanel', quickPanelAPI);
