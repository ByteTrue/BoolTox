import type { ComponentType } from "react";

export type ModuleStatus = "enabled" | "disabled";

export type ModuleLoader = () => Promise<ComponentType> | ComponentType;

export type ModuleSource = "local" | "remote";

export interface ModuleDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  category?: string;
  keywords?: string[];
  icon?: string;
  installedByDefault?: boolean;
  loader: ModuleLoader;
  source?: ModuleSource; // 本地或远程模块
}

export type ModuleLaunchState = "idle" | "launching" | "running" | "stopping" | "error";

export interface ModuleRuntime {
  status: ModuleStatus;
  loading: boolean;
  component: ComponentType | null;
  error: string | null;
  installed: boolean; // 是否已下载到本地
  installedPath?: string; // 本地安装路径
  updateAvailable?: boolean; // 是否有新版本
  launchState: ModuleLaunchState;
  lastLaunchAt?: string;
  runningWindowId?: number;
  lastError?: string | null;
}

export interface ModuleInstance {
  id: string;
  definition: ModuleDefinition;
  runtime: ModuleRuntime;
  // 收藏相关 (从存储读取)
  isFavorite?: boolean;
  favoriteOrder?: number;
  favoritedAt?: string;
  // 开发模式标记 (从开发目录加载的插件)
  isDev?: boolean;
}

export interface ModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
}
