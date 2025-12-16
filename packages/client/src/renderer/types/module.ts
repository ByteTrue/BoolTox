/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ComponentType } from "react";
import type { ToolRuntimeConfig } from "@booltox/shared";

export type ModuleLoader = () => Promise<ComponentType> | ComponentType;

export type ModuleSource = "local" | "remote" | "dev";

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  category?: string;
  keywords?: string[];
  icon?: string;
  screenshots?: string[]; // 工具截图 URL 列表
  installedByDefault?: boolean;
  loader?: ModuleLoader;
  source?: ModuleSource;
  runtimeMode?: 'webview' | 'standalone';
  runtime?: ToolRuntimeConfig;  // 新增：运行时配置（用于判断工具类型）
}

export type ModuleLaunchState = "idle" | "launching" | "running" | "stopping" | "error";

export interface ModuleRuntime {
  loading: boolean;
  component?: ComponentType | null;
  error: string | null;
  installed: boolean;
  installedPath?: string;
  updateAvailable?: boolean;
  launchState: ModuleLaunchState;
  lastLaunchedAt?: number; // 时间戳（毫秒）
  runningWindowId?: number;
  lastError?: string | null;
}

export interface ModuleInstance {
  id: string;
  definition: ModuleDefinition;
  runtime: ModuleRuntime;
  isFavorite?: boolean;
  favoriteOrder?: number;
  favoritedAt?: string;
  isDev?: boolean;
  sourceId?: string;      // 工具来源 ID（官方/自定义工具源）
  sourceName?: string;    // 工具来源名称（用于 UI 显示）
}

export interface ModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
}
