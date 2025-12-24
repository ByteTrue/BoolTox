/// <reference types="vite/client" />
/// <reference path="../vite-env.d.ts" />

import type { StoredModuleInfo } from './shared/types/module-store.types';
import type {
  Announcement,
  GitOpsConfig,
  ToolRegistry,
} from '../electron/services/git-ops.service';
import type { AutoUpdateStatus } from '../electron/services/auto-update.service';
import type { ToolRegistryEntry, ToolInstallProgress } from '@booltox/shared';

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
      send: (channel: string, ...args: unknown[]) => void;
    };
    moduleStore: {
      getAll: () => Promise<StoredModuleInfo[]>;
      get: (id: string) => Promise<StoredModuleInfo | null>;
      add: (info: StoredModuleInfo) => Promise<{ success: boolean; error?: string }>;
      update: (
        id: string,
        info: Partial<StoredModuleInfo>
      ) => Promise<{ success: boolean; error?: string }>;
      updateStatus: (
        id: string,
        status: 'enabled' | 'disabled'
      ) => Promise<{ success: boolean; error?: string }>;
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
      getTools: () => Promise<ToolRegistry>;
    };
    tool: {
      start: (toolId: string) => Promise<void>;
      stop: (toolId: string) => Promise<void>;
      focus: (toolId: string) => Promise<void>;
      install: (
        entry: ToolRegistryEntry
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      uninstall: (toolId: string) => Promise<{ success: boolean; error?: string }>;
      cancelInstall: (toolId: string) => Promise<{ success: boolean }>;
      onInstallProgress: (callback: (progress: ToolInstallProgress) => void) => () => void;
      checkUpdates: () => Promise<{ success: boolean; updates: unknown[]; error?: string }>;
      updateTool: (toolId: string) => Promise<{ success: boolean; error?: string }>;
      updateAllTools: (
        toolIds: string[]
      ) => Promise<{ success: boolean; updated: string[]; failed: string[]; error?: string }>;
    };
    appSettings: {
      getAutoLaunch: () => Promise<boolean>;
      setAutoLaunch: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      getCloseToTray: () => Promise<boolean>;
      setCloseToTray: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
    };
    quickPanel: {
      hide: () => Promise<void>;
      showMain: () => Promise<void>;
      navigateTo: (route: string) => Promise<void>;
    };
    toast?: {
      success: (message: string) => void;
      error: (message: string) => void;
      info: (message: string) => void;
      warning: (message: string) => void;
    };
  }
}

export {};
