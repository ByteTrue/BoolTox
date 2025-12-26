/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Vitest 设置文件（渲染进程）
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 方法
expect.extend(matchers);

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

const globalWindow = (globalThis as unknown as { window: Record<string, unknown> }).window ?? {};
(globalThis as unknown as { window: Record<string, unknown> }).window = globalWindow;

// Mock window.ipc
globalWindow.ipc = {
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn(),
};

// Mock window.electron
globalWindow.electron = {
  window: {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  },
};
