/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Manifest JSON Schema 定义
 */
export const MANIFEST_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  type: "object",
  required: ["name", "version"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      description: "工具显示名称",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+",
      description: "语义化版本号（如 1.0.0）",
    },
    description: {
      type: "string",
      description: "工具描述",
    },
    // 简化配置
    start: {
      type: "string",
      minLength: 1,
      description: "启动命令（简化配置）",
    },
    port: {
      type: "number",
      minimum: 1024,
      maximum: 65535,
      description: "HTTP 服务端口",
    },
    // 完整配置
    id: {
      type: "string",
      pattern: "^[a-z0-9.-]+$",
      description: "工具 ID（可选，自动生成）",
    },
    protocol: {
      type: "string",
      description: "协议版本",
    },
    runtime: {
      type: "object",
      description: "运行时配置",
    },
    icon: {
      type: "string",
      description: "图标路径或 emoji",
    },
    author: {
      type: "string",
      description: "作者",
    },
    category: {
      type: "string",
      description: "分类",
    },
    keywords: {
      type: "array",
      items: { type: "string" },
      description: "关键词",
    },
    screenshots: {
      type: "array",
      items: { type: "string" },
      description: "截图 URL 列表",
    },
    window: {
      type: "object",
      properties: {
        width: { type: "number" },
        height: { type: "number" },
        minWidth: { type: "number" },
        minHeight: { type: "number" },
        resizable: { type: "boolean" },
      },
    },
  },
  // 至少需要 start 或 runtime
  anyOf: [
    { required: ["start"] },
    { required: ["runtime"] },
  ],
};
