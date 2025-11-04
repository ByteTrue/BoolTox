/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_DEV_SERVER_URL?: string;
    APP_ROOT: string;
  }
}

import type { StoredModuleInfo } from '../src/shared/types/module-store.types';
import type { UpdateDownloadPayload, UpdateStatus } from './services/update-manager.service';

interface Window {
  electron: {
    window: {
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<void>;
      close: () => Promise<void>;
    };
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
    download: (payload: UpdateDownloadPayload) => Promise<{ success: boolean; error?: string; aborted?: boolean; filePath?: string }>;
    cancel: () => Promise<{ success: boolean; error?: string }>;
    install: () => Promise<{ success: boolean; error?: string }>;
    getStatus: () => Promise<UpdateStatus>;
    onStatus: (listener: (status: UpdateStatus) => void) => () => void;
  };
}
