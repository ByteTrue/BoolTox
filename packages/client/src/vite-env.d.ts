/// <reference types="vite/client" />
/// <reference path="../vite-env.d.ts" />

import type { StoredModuleInfo } from './shared/types/module-store.types';
import type { Announcement, GitOpsConfig, PluginRegistry } from '../electron/services/git-ops.service';
import type { AutoUpdateStatus } from '../electron/services/auto-update.service';
import type { PluginRegistryEntry, PluginInstallProgress } from '@booltox/shared';

declare const __APP_VERSION__: string | undefined;

declare global {
  interface Window {
    electron: {
      window: {
        minimize: () => Promise<void>;
        toggleMaximize: () => Promise<void>;
        close: () => Promise<void>;
      };
    };
    ipc: {
      on: (channel: string, listener: (...args: unknown[]) => void) => void;
      off: (channel: string, listener: (...args: unknown[]) => void) => void;
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    };
    moduleStore: {
      getAll: () => Promise<StoredModuleInfo[]>;
      get: (id: string) => Promise<StoredModuleInfo | null>;
      add: (info: StoredModuleInfo) => Promise<{ success: boolean; error?: string }>;
      update: (id: string, info: Partial<StoredModuleInfo>) => Promise<{ success: boolean; error?: string }>;
      updateStatus: (id: string, status: 'enabled' | 'disabled') => Promise<{ success: boolean; error?: string }>;
      remove: (id: string) => Promise<{ success: boolean; error?: string }>;
      getCachePath: (moduleId: string) => Promise<string | null>;
      removeCache: (moduleId: string) => Promise<boolean>;
      getConfigPath: () => Promise<string | null>;
    };
    update: {
      check: () => Promise<unknown>;
      download: () => Promise<unknown>;
      install: () => Promise<unknown>;
      getStatus: () => Promise<AutoUpdateStatus>;
      onStatus: (listener: (status: AutoUpdateStatus) => void) => () => void;
    };
    gitOps: {
      getConfig: () => Promise<GitOpsConfig>;
      updateConfig: (config: Partial<GitOpsConfig>) => Promise<GitOpsConfig>;
      getAnnouncements: () => Promise<Announcement[]>;
      getPlugins: () => Promise<PluginRegistry>;
    };
    plugin: {
      install: (entry: PluginRegistryEntry) => Promise<{success: boolean; path?: string; error?: string}>;
      uninstall: (pluginId: string) => Promise<{success: boolean; error?: string}>;
      cancelInstall: (pluginId: string) => Promise<{success: boolean}>;
      onInstallProgress: (callback: (progress: PluginInstallProgress) => void) => () => void;
    };
  }
}

export {};
