/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * WindowService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { windowService } from './window.service';
import { BrowserWindow } from 'electron';

// Mock Electron BrowserWindow
vi.mock('electron', () => ({
  BrowserWindow: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
    loadURL: vi.fn(),
    loadFile: vi.fn(),
    setMenuBarVisibility: vi.fn(),
    setMenu: vi.fn(),
    setWindowButtonVisibility: vi.fn(),
    webContents: {
      openDevTools: vi.fn(),
    },
    on: vi.fn(),
  })),
  app: {
    isPackaged: false,
    getPath: vi.fn(() => '/test/path'),
  },
}));

describe('WindowService', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = windowService;
      const instance2 = windowService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('创建主窗口', () => {
    it('应该能创建主窗口', () => {
      const window = windowService.createMainWindow();

      expect(window).toBeDefined();
      expect(BrowserWindow).toHaveBeenCalled();
    });

    it('如果窗口已存在，应该直接返回', () => {
      const window1 = windowService.createMainWindow();
      const window2 = windowService.createMainWindow();

      expect(window1).toBe(window2);
      // BrowserWindow 应该只被调用一次
    });
  });

  describe('窗口管理', () => {
    beforeEach(() => {
      windowService.createMainWindow();
    });

    it('应该能获取主窗口', () => {
      const window = windowService.getMainWindow();

      expect(window).toBeDefined();
    });

    it('应该能显示主窗口', () => {
      const window = windowService.getMainWindow();
      windowService.showMainWindow();

      expect(window?.show).toHaveBeenCalled();
    });

    it('应该能隐藏主窗口', () => {
      const window = windowService.getMainWindow();
      windowService.hideMainWindow();

      expect(window?.hide).toHaveBeenCalled();
    });
  });
});
