/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Manifest 推断工具
 *
 * 将简化的 manifest.json 配置推断为完整的 ToolRuntimeConfig
 *
 * 推断规则：
 * 1. 从 start 命令推断语言类型（python / node / binary）
 * 2. 从 port 字段推断运行模式（有 port → http-service）
 * 3. 无 port 且 start 包含 GUI 关键词 → standalone
 * 4. start 是二进制文件 → binary/cli
 */

import type { ToolManifest } from '@booltox/shared';
import type { ToolRuntimeConfig, ToolBackendConfig } from '@booltox/shared';
import path from 'path';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ManifestInfer');

/**
 * 从 start 命令推断后端类型
 */
function inferBackendType(start: string): 'python' | 'node' | 'process' {
  const lowerStart = start.toLowerCase();

  if (lowerStart.startsWith('python') || lowerStart.includes('python3')) {
    return 'python';
  }

  if (lowerStart.startsWith('node') || lowerStart.startsWith('npm') || lowerStart.startsWith('npx')) {
    return 'node';
  }

  // 默认为 process（二进制可执行文件）
  return 'process';
}

/**
 * 从 start 命令提取入口文件
 */
function extractEntry(start: string): string {
  const parts = start.split(/\s+/);

  // 跳过解释器（python / node）
  if (parts[0] === 'python' || parts[0] === 'python3' || parts[0] === 'node') {
    return parts[1] || 'main.py';
  }

  // npm/npx 命令
  if (parts[0] === 'npm' || parts[0] === 'npx') {
    // 例如 "npm start" -> 默认 package.json
    // 例如 "npx tsx server.ts" -> server.ts
    if (parts.length > 2) {
      return parts[2];
    }
    return 'index.js'; // 占位
  }

  // 直接可执行文件
  return parts[0];
}

/**
 * 检查是否为 GUI 应用（standalone 模式）
 */
function isGuiApp(start: string): boolean {
  const guiKeywords = ['qt', 'tkinter', 'pyside', 'pyqt', 'electron', 'gui', 'window'];
  const lowerStart = start.toLowerCase();

  return guiKeywords.some(keyword => lowerStart.includes(keyword));
}

/**
 * 从简化配置推断完整的 runtime 配置
 *
 * @param manifest - 工具清单
 * @param toolPath - 工具目录路径（用于生成 ID）
 * @returns 完整的工具清单
 */
export function inferManifest(manifest: ToolManifest, toolPath: string): ToolManifest {
  // 如果已经有完整的 runtime 配置，只补充 ID 和 protocol
  if (manifest.runtime) {
    if (!manifest.id) {
      manifest.id = generateToolId(toolPath);
    }
    if (!manifest.protocol) {
      manifest.protocol = '^2.0.0'; // 使用当前协议版本
    }
    logger.info(`Tool "${manifest.name}" using explicit runtime configuration`);
    return manifest;
  }

  // 从文件夹名生成 ID
  if (!manifest.id) {
    manifest.id = generateToolId(toolPath);
  }

  // 自动设置协议版本
  if (!manifest.protocol) {
    manifest.protocol = '^2.0.0';
  }

  // 如果没有 start 字段，无法推断
  if (!manifest.start) {
    throw new Error(`Tool "${manifest.name}" is missing both "start" and "runtime" configuration`);
  }

  // 推断 runtime 配置
  const start = manifest.start;
  const backendType = inferBackendType(start);
  const entry = extractEntry(start);

  logger.info(`Inferring runtime for "${manifest.name}": start="${start}", type=${backendType}, entry=${entry}`);

  // 有 port → http-service 模式
  if (manifest.port) {
    const backend: ToolBackendConfig & { port: number; host?: string } = {
      type: backendType,
      entry,
      port: manifest.port,
      host: '127.0.0.1',
    };

    // Python 工具：添加 requirements.txt
    if (backendType === 'python') {
      (backend as any).requirements = 'requirements.txt';
    }

    const runtime: ToolRuntimeConfig = {
      type: 'http-service',
      backend,
      path: '/',
      readyTimeout: 30000,
    };

    logger.info(`Inferred as http-service on port ${manifest.port}`);

    return {
      ...manifest,
      runtime,
    };
  }

  // 无 port，检查是否为 GUI 应用
  if (isGuiApp(start)) {
    const backend: ToolBackendConfig = {
      type: backendType,
      entry,
    };

    // Python 工具：添加 requirements.txt
    if (backendType === 'python') {
      (backend as any).requirements = 'requirements.txt';
    }

    const runtime: ToolRuntimeConfig = {
      type: 'standalone',
      backend,
    };

    logger.info(`Inferred as standalone GUI application`);

    return {
      ...manifest,
      runtime,
    };
  }

  // 其他情况：CLI 模式
  const backend: ToolBackendConfig = {
    type: backendType,
    entry,
  };

  const runtime: ToolRuntimeConfig = {
    type: 'cli',
    backend,
    title: manifest.name,
    keepOpen: true,
  };

  logger.info(`Inferred as CLI application`);

  return {
    ...manifest,
    runtime,
  };
}

/**
 * 从工具路径生成 ID
 * 例如：/path/to/my-tool → com.booltox.my-tool
 */
function generateToolId(toolPath: string): string {
  const folderName = path.basename(toolPath);
  return `com.booltox.${folderName}`;
}

/**
 * 验证简化配置的完整性
 */
export function validateSimplifiedManifest(manifest: ToolManifest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 必需字段
  if (!manifest.name) {
    errors.push('Missing required field: "name"');
  }

  if (!manifest.version) {
    errors.push('Missing required field: "version"');
  }

  // 配置完整性
  if (!manifest.start && !manifest.runtime) {
    errors.push('Must provide either "start" (simplified) or "runtime" (full) configuration');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
