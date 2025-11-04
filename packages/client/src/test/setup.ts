/**
 * Jest 测试环境设置
 * 配置全局测试工具和模拟 (遵循 DRY 原则：统一配置)
 */

// 导入测试工具库扩展
import '@testing-library/jest-dom';

// 模拟 React.act (修复 React 19 兼容性问题)
import { act } from 'react';
global.React = { ...global.React, act };

// 模拟 Electron IPC API (单一职责：专注 IPC 模拟)

declare global {
  interface Window {
    // 为 Electron 环境添加常用的全局对象
    electronAPI?: {
      platform: string;
      version: string;
    };
  }
}

const mockIPC = {
  invoke: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  send: jest.fn(),
  removeAllListeners: jest.fn(),
  fs: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    exists: jest.fn(),
    stat: jest.fn(),
    isDirectory: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
    rmdir: jest.fn(),
    copyFile: jest.fn(),
    rename: jest.fn(),
  },
  dialog: {
    openFile: jest.fn(),
  },
} as unknown as Window['ipc'];

Object.defineProperty(window, 'ipc', {
  value: mockIPC,
  writable: true,
  configurable: true, // 允许测试覆盖！
});

// 模拟 Electron API
Object.defineProperty(window, 'electronAPI', {
  writable: true,
  value: {
    platform: 'test',
    version: '1.0.0-test',
  },
});

// 模拟 ResizeObserver (某些组件可能需要)
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// 模拟 matchMedia (Tailwind CSS 可能需要)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// 模拟 localStorage (Context 可能使用)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// 模拟 Notification API (用于模块通知功能)
global.Notification = jest.fn().mockImplementation((title, options) => ({
  title,
  body: options?.body,
  icon: options?.icon,
  close: jest.fn(),
})) as unknown as typeof Notification;

// 每个测试前重置所有模拟
beforeEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
});

// 在测试后清理
afterEach(() => {
  jest.restoreAllMocks();
});

export { mockIPC, localStorageMock };
