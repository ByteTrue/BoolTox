/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // 多项目配置（主进程 + 渲染进程分离）
    projects: [
      // 主进程单元测试
      {
        test: {
          name: 'main',
          environment: 'node',
          include: ['electron/**/*.{test,spec}.{ts,tsx}'],
          globals: true,
          setupFiles: ['./vitest.setup.main.ts'],
        },
      },
      // 渲染进程单元测试
      {
        test: {
          name: 'renderer',
          environment: 'happy-dom',
          include: ['src/renderer/**/*.{test,spec}.{ts,tsx}'],
          globals: true,
          setupFiles: ['./vitest.setup.ts'],
        },
      },
    ],

    // 全局配置
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/dist-electron/**',
        '**/*.config.{js,ts}',
        '**/coverage/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
