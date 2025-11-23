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
}
