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
    BrowserWindow: vi.fn().mockImplementation(() => ({
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
    })),
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
  const Store = vi.fn().mockImplementation(() => {
    const data = new Map();
    return {
      get: vi.fn((key, defaultValue) => data.get(key) ?? defaultValue),
      set: vi.fn((key, value) => data.set(key, value)),
      delete: vi.fn((key) => data.delete(key)),
      clear: vi.fn(() => data.clear()),
      path: '/test/config.json',
    };
  });
  return { default: Store };
});
