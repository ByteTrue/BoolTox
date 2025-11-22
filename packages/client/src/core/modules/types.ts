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
  remote?: RemoteModuleConfig; // 远程模块配置
}

export interface RemoteModuleConfig {
  manifestUrl?: string; // manifest.json 地址
  bundleUrl: string; // 模块包地址 (js bundle)
  checksum?: string; // 文件校验和
  size?: number; // 文件大小（字节）
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
}

export interface ModuleStats {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
}

// 远程模块清单
export interface RemoteModuleManifest {
  version: string;
  modules: RemoteModuleEntry[];
  updatedAt: string;
}

export interface RemoteModuleEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  keywords: string[];
  icon: string;
  bundleUrl: string;
  checksum: string;
  size: number;
  screenshots?: string[];
  changelog?: string;
}
