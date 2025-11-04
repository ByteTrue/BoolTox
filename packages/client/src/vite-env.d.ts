/// <reference types="vite/client" />
/// <reference path="../vite-env.d.ts" />

import type {
  UpdateDownloadPayload,
  UpdateStatus,
  UpdateDownloadResult,
  UpdateOperationResult,
} from '../electron/services/update-manager.service';
import type { StoredModuleInfo } from './shared/types/module-store.types';

declare const __APP_VERSION__: string;

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
      download: (payload: UpdateDownloadPayload) => Promise<UpdateDownloadResult>;
      cancel: () => Promise<UpdateOperationResult>;
      install: () => Promise<UpdateOperationResult>;
      getStatus: () => Promise<UpdateStatus>;
      onStatus: (listener: (status: UpdateStatus) => void) => () => void;
    };
  }
}

export {};
