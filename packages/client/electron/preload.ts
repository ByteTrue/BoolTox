/**
 * Electron Preload - 极简版
 * 
 * 暴露安全的API给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { StoredModuleInfo } from '../src/shared/types/module-store.types';
import type { Announcement, GitOpsConfig, PluginRegistry } from './services/git-ops.service';
import type { AutoUpdateStatus } from './services/auto-update.service';

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
  updateStatus: async (id: string, status: 'enabled' | 'disabled'): Promise<{ success: boolean; error?: string }> => {
    return await ipcRenderer.invoke('module-store:update-status', id, status) as { success: boolean; error?: string };
  },

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
  getPlugins: async (): Promise<PluginRegistry> => {
    return await ipcRenderer.invoke('git-ops:get-plugins') as PluginRegistry;
  },
};

/**
 * Plugin API - 插件安装相关
 */
const pluginAPI = {
  install: async (entry: unknown): Promise<{success: boolean; path?: string; error?: string}> => {
    return await ipcRenderer.invoke('plugin:install', entry) as {success: boolean; path?: string; error?: string};
  },
  uninstall: async (pluginId: string): Promise<{success: boolean; error?: string}> => {
    return await ipcRenderer.invoke('plugin:uninstall', pluginId) as {success: boolean; error?: string};
  },
  cancelInstall: async (pluginId: string): Promise<{success: boolean}> => {
    return await ipcRenderer.invoke('plugin:cancel-install', pluginId) as {success: boolean};
  },
  onInstallProgress: (callback: (progress: unknown) => void): (() => void) => {
    const listener = (_event: Electron.IpcRendererEvent, progress: unknown) => callback(progress);
    ipcRenderer.on('plugin:install-progress', listener);
    return () => ipcRenderer.removeListener('plugin:install-progress', listener);
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

contextBridge.exposeInMainWorld('plugin', pluginAPI);
