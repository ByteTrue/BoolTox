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
import Ajv from 'ajv';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('ManifestInfer');

// Manifest Schema 定义（内联，避免导入问题）
const MANIFEST_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["name", "version"],
  properties: {
    name: { type: "string", minLength: 1 },
    version: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+" },
    description: { type: "string" },
    start: { type: "string", minLength: 1 },
    port: { type: "number", minimum: 1024, maximum: 65535 },
    id: { type: "string", pattern: "^[a-z0-9.-]+$" },
    protocol: { type: "string" },
    runtime: { type: "object" },
    icon: { type: "string" },
    author: { type: "string" },
    category: { type: "string" },
    keywords: { type: "array", items: { type: "string" } },
    screenshots: { type: "array", items: { type: "string" } },
    window: { type: "object" },
  },
  anyOf: [
    { required: ["start"] },
    { required: ["runtime"] },
  ],
};

// 创建 AJV 实例
const ajv = new Ajv({ allErrors: true, verbose: true });
const validateSchema = ajv.compile(MANIFEST_SCHEMA);

export interface ValidationError {
  field: string;
  message: string;
  suggestedFix?: string;
}

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
      backend.requirements = 'requirements.txt';
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
    const runtime: ToolRuntimeConfig = {
      type: 'standalone',
      entry,
      ...(backendType === 'python' ? { requirements: 'requirements.txt' } : {}),
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
export function validateSimplifiedManifest(manifest: ToolManifest): { valid: boolean; errors: ValidationError[] } {
  // 使用 JSON Schema 验证
  const valid = validateSchema(manifest);

  if (valid) {
    return { valid: true, errors: [] };
  }

  const errors: ValidationError[] = (validateSchema.errors || []).map(error => {
    const field = error.instancePath?.replace(/^\//, '') || error.params?.missingProperty || 'unknown';
    let message = error.message || '验证失败';
    let suggestedFix: string | undefined;

    // 自定义错误信息
    if (error.keyword === 'required') {
      const missing = error.params.missingProperty;
      message = `缺少必需字段 "${missing}"`;

      // 提供修复建议
      if (missing === 'name') {
        suggestedFix = '添加: "name": "工具名称"';
      } else if (missing === 'version') {
        suggestedFix = '添加: "version": "1.0.0"';
      } else if (missing === 'start') {
        suggestedFix = '添加: "start": "python main.py" 或配置 "runtime" 字段';
      }
    } else if (error.keyword === 'pattern') {
      message = `字段 "${field}" 格式不正确`;

      if (field.includes('version')) {
        suggestedFix = '版本号格式：1.0.0 或 1.2.3-beta';
      } else if (field.includes('id')) {
        suggestedFix = 'ID 格式：com.booltox.tool-name（小写字母、数字、点、连字符）';
      }
    } else if (error.keyword === 'type') {
      message = `字段 "${field}" 类型错误，期望 ${error.params.type}`;

      if (field.includes('port')) {
        suggestedFix = '端口必须是数字：8001（不要用引号）';
      }
    } else if (error.keyword === 'minimum' || error.keyword === 'maximum') {
      message = `字段 "${field}" 超出范围`;

      if (field.includes('port')) {
        suggestedFix = '端口范围：1024-65535';
      }
    } else if (error.keyword === 'minLength') {
      message = `字段 "${field}" 不能为空`;
    } else if (error.keyword === 'anyOf') {
      message = '缺少必需配置';
      suggestedFix = '必须提供 "start" 字段（简化配置）或 "runtime" 字段（完整配置）';
    }

    return {
      field,
      message,
      suggestedFix,
    };
  });

  return { valid: false, errors };
}
