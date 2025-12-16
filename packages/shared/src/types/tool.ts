/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type {
  BooltoxPermission,
  ToolActivationEvent,
  ToolCapabilityRequest,
  ToolRuntimeConfig,
} from './protocol.js';

export interface ToolManifest {
  /** Unique identifier (e.g., "com.booltox.todo") - 可选，将从文件夹名自动生成 */
  id?: string;
  /** Semantic version string */
  version: string;
  /** Display name */
  name: string;
  /** Short description */
  description?: string;

  // ===== 简化配置（新架构推荐） =====
  /** 启动命令（简化配置）- 例如 "python main.py" 或 "node server.js" */
  start?: string;
  /** HTTP 服务端口（简化配置）- 有端口表示 http-service 类型 */
  port?: number;
  // ===================================

  /** Entry HTML file path relative to tool root (legacy) */
  main?: string;
  /** Icon file path relative to tool root */
  icon?: string;
  /** Requested permissions */
  permissions?: BooltoxPermission[];
  /** Protocol version range, e.g. "^2.0.0" - 可选，不再要求工具知道 BoolTox 版本 */
  protocol?: string;
  /** Activation events */
  activation?: ToolActivationEvent[];
  /** Capability requests (fine-grained permissions) */
  capabilities?: ToolCapabilityRequest[];
  /** Runtime configuration describing UI/backend - 完整配置（向后兼容） */
  runtime?: ToolRuntimeConfig;
  /** Default window configuration */
  window?: {
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    resizable?: boolean;
  };
  author?: string;
  homepage?: string;
  keywords?: string[];
  category?: string;
}

export interface ToolRuntime {
  id: string;
  manifest: ToolManifest;
  /** Absolute path to the tool directory on disk */
  path: string;
  status: 'stopped' | 'running' | 'loading' | 'error';
  mode?: 'webview' | 'standalone';
  /** WebContents ID of the BrowserView (if running) */
  viewId?: number;
  /** BrowserWindow ID (when running in dedicated window mode) */
  windowId?: number;
  error?: string;
  /** Whether this tool is loaded from dev directory (not installed by user) */
  isDev?: boolean;
}

/**
 * 工具注册表条目 - 用于在线工具商店
 * 注意: downloadUrl 不保存在 metadata.json 中,由 GitOpsService 根据配置自动生成
 */
export interface ToolRegistryEntry {
  id: string;
  version: string;
  name: string;
  description: string;
  author: string;
  icon?: string;
  category?: string;
  keywords?: string[];
  /** SHA-256校验和 */
  hash?: string;
  /** 文件大小(字节) */
  size?: number;
  /** 截图 */
  screenshots?: string[];
  /** 更新日志 */
  changelog?: string;
  /** ZIP包下载地址 (运行时生成,不保存在metadata.json) */
  downloadUrl?: string;
  /** 工具在 Git 仓库中的路径（用于 GitOps 安装）*/
  gitPath?: string;
  /** 标记是否为二进制工具 */
  isBinaryTool?: boolean;
  /** 工具来源 ID（运行时添加，用于区分不同工具源）*/
  sourceId?: string;
  /** 工具来源名称（运行时添加）*/
  sourceName?: string;
  /** 唯一标识（运行时添加，格式：sourceId:toolId）*/
  _uniqueKey?: string;
  /** 运行时配置（从 booltox.json 读取）*/
  runtime?: ToolRuntimeConfig;
  /** 二进制工具的多平台资源 */
  binaryAssets?: {
    windows?: {
      url: string;
      checksum: string; // SHA-256
      size: number;
    };
    darwin?: {
      url: string;
      checksum: string;
      size: number;
    };
    linux?: {
      url: string;
      checksum: string;
      size: number;
    };
  };
}

/**
 * 工具安装进度
 */
export interface ToolInstallProgress {
  stage: 'downloading' | 'extracting' | 'verifying' | 'installing' | 'complete' | 'error';
  percent: number;
  message?: string;
  error?: string;
}
