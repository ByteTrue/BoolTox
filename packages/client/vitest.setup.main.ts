/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Vitest 设置文件（主进程）
 * Mock Electron APIs
 */

import { vi } from 'vitest';

// Mock Electron app
vi.mock('electron', async () => {
  return {
    app: {
      isPackaged: false,
      getVersion: () => '0.0.1',
      getPath: (name: string) => `/test/${name}`,
      setAppUserModelId: vi.fn(),
      setName: vi.fn(),
      getLoginItemSettings: vi.fn(() => ({ openAtLogin: false })),
      setLoginItemSettings: vi.fn(),
      quit: vi.fn(),
      exit: vi.fn(),
      whenReady: vi.fn(() => Promise.resolve()),
      on: vi.fn(),
      dock: {
        show: vi.fn(),
      },
      commandLine: {
        appendSwitch: vi.fn(),
      },
    },
    ipcMain: {
      handle: vi.fn(),
      on: vi.fn(),
      removeHandler: vi.fn(),
    },
    BrowserWindow: vi.fn().mockImplementation(function () {
      return {
        show: vi.fn(),
        hide: vi.fn(),
        close: vi.fn(),
        focus: vi.fn(),
        isDestroyed: vi.fn(() => false),
        isMaximized: vi.fn(() => false),
        minimize: vi.fn(),
        maximize: vi.fn(),
        unmaximize: vi.fn(),
        loadURL: vi.fn(),
        loadFile: vi.fn(),
        setMenuBarVisibility: vi.fn(),
        setMenu: vi.fn(),
        setWindowButtonVisibility: vi.fn(),
        webContents: {
          openDevTools: vi.fn(),
          send: vi.fn(),
        },
        on: vi.fn(),
      };
    }),
    screen: {
      getPrimaryDisplay: vi.fn(() => ({
        workAreaSize: { width: 1920, height: 1080 },
      })),
    },
    globalShortcut: {
      register: vi.fn(() => true),
      unregisterAll: vi.fn(),
    },
    shell: {
      openPath: vi.fn(() => Promise.resolve('')),
    },
    dialog: {
      showOpenDialog: vi.fn(() => Promise.resolve({ filePaths: [] })),
    },
  };
});

// Mock electron-store
vi.mock('electron-store', () => {
  const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  };

  const deepGet = (obj: unknown, path: string): unknown => {
    if (!isObject(obj)) return undefined;
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (!isObject(current) || !(part in current)) return undefined;
      current = current[part];
    }
    return current;
  };

  const deepSet = (obj: Record<string, unknown>, path: string, value: unknown) => {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      const next = current[part];
      if (!isObject(next)) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  };

  const deepDelete = (obj: Record<string, unknown>, path: string) => {
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let index = 0; index < parts.length - 1; index += 1) {
      const part = parts[index];
      const next = current[part];
      if (!isObject(next)) return;
      current = next;
    }
    delete current[parts[parts.length - 1]];
  };

  const deepMerge = (base: unknown, override: unknown): unknown => {
    if (Array.isArray(base)) {
      return override !== undefined ? override : base;
    }
    if (isObject(base)) {
      const result: Record<string, unknown> = { ...base };
      if (isObject(override)) {
        for (const [key, value] of Object.entries(override)) {
          const baseValue = (base as Record<string, unknown>)[key];
          result[key] = deepMerge(baseValue, value);
        }
      }
      return result;
    }
    return override !== undefined ? override : base;
  };

  class StoreMock {
    public path = '/test/config.json';
    private defaults: Record<string, unknown>;
    private values: Record<string, unknown> = {};

    constructor(options?: { defaults?: Record<string, unknown> }) {
      this.defaults = options?.defaults ?? {};
    }

    public get = vi.fn((key: string, defaultValue?: unknown) => {
      const defaultsValue = deepGet(this.defaults, key);
      const overrideValue = deepGet(this.values, key);

      if (isObject(defaultsValue) || Array.isArray(defaultsValue)) {
        return deepMerge(defaultsValue, overrideValue);
      }

      if (overrideValue !== undefined) return overrideValue;
      if (defaultsValue !== undefined) return defaultsValue;
      return defaultValue;
    });

    public set = vi.fn((key: string, value: unknown) => {
      deepSet(this.values, key, value);
    });

    public delete = vi.fn((key: string) => {
      deepDelete(this.values, key);
    });

    public clear = vi.fn(() => {
      this.values = {};
    });
  }

  return { __esModule: true, default: StoreMock };
});

