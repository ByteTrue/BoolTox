/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Vitest 设置文件（渲染进程）
 */

import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 Vitest 的 expect 方法
expect.extend(matchers);

// 每个测试后自动清理
afterEach(() => {
  cleanup();
});

// Mock window.ipc
global.window = global.window || {};
(global.window as any).ipc = {
  invoke: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  send: vi.fn(),
};

// Mock window.electron
(global.window as any).electron = {
  window: {
    minimize: vi.fn(),
    toggleMaximize: vi.fn(),
    close: vi.fn(),
  },
};
