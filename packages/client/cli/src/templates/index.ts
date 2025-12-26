/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Manifest 模板生成器
 *
 * Linus 式简化原则：
 * - 不做智能推断，只生成最基础的模板
 * - 让开发者自己填空，运行时验证
 * - 如果填错 → 运行时报错 → 开发者修改
 */

import type { ToolManifest } from '@booltox/shared';

export function getTemplate(options: {
  id: string;
  name: string;
  description: string;
  runtimeType: 'http-service' | 'standalone' | 'cli' | 'binary';
  language?: 'python' | 'node';
  port?: number;
}): ToolManifest {
  const base = {
    id: options.id,
    version: '1.0.0',
    name: options.name,
    description: options.description,
    protocol: '^2.0.0',
    author: 'Your Name',  // 开发者需要填写
    keywords: [],
  };

  // HTTP Service 模式
  if (options.runtimeType === 'http-service') {
    return {
      ...base,
      runtime: {
        type: 'http-service',
        backend: {
          type: options.language!,
          entry: options.language === 'python' ? 'main.py' : 'index.js',
          requirements: options.language === 'python' ? 'requirements.txt' : undefined,
          port: options.port || 8000,
          host: '127.0.0.1',
        },
        path: '/',
        readyTimeout: 30000,
      },
    };
  }

  // Standalone 模式
  if (options.runtimeType === 'standalone') {
    return {
      ...base,
      runtime: {
        type: 'standalone',
        entry: options.language === 'python' ? 'main.py' : 'index.js',
        requirements: options.language === 'python' ? 'requirements.txt' : undefined,
      },
    };
  }

  // CLI 模式
  if (options.runtimeType === 'cli') {
    return {
      ...base,
      runtime: {
        type: 'cli',
        backend: {
          type: options.language!,
          entry: options.language === 'python' ? 'main.py' : 'index.js',
          requirements: options.language === 'python' ? 'requirements.txt' : undefined,
        },
        title: options.name,
        keepOpen: true,
      },
    };
  }

  // Binary 模式
  return {
    ...base,
    runtime: {
      type: 'binary',
      command: 'FIXME: your-tool.exe',  // 开发者必须修改
      args: [],
    },
  };
}
