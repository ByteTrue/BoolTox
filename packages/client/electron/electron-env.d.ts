/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_DEV_SERVER_URL?: string;
    APP_ROOT: string;
  }
}

import type { StoredModuleInfo } from '../src/shared/types/module-store.types';
import type { AutoUpdateStatus } from './services/auto-update.service';

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
    update: (id: string, info: Partial<StoredModuleInfo>) => Promise<{ success: boolean; error?: string }>;
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
  appSettings: {
    getAutoLaunch: () => Promise<boolean>;
    setAutoLaunch: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
    getCloseToTray: () => Promise<boolean>;
    setCloseToTray: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
  };
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
  };
  tool: {
    start: (toolId: string) => Promise<void>;
    stop: (toolId: string) => Promise<void>;
    focus: (toolId: string) => Promise<void>;
    install: (entry: unknown) => Promise<{ success: boolean; path?: string; error?: string }>;
    uninstall: (toolId: string) => Promise<{ success: boolean; error?: string }>;
    cancelInstall: (toolId: string) => Promise<{ success: boolean }>;
    checkUpdates: () => Promise<{ success: boolean; updates: unknown[]; error?: string }>;
    update: (toolId: string) => Promise<{ success: boolean; error?: string }>;
    updateAllTools: (toolIds: string[]) => Promise<{ success: boolean; updated: string[]; failed: string[]; error?: string }>;
  };
}
