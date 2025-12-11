/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ModuleDefinition } from "@/types/module";

/**
 * 工具中心类型定义
 */

// Tab 类型
export type ModuleTab = "installed" | "store";

// 排序方式
export type SortBy = "name" | "updatedAt" | "downloads" | "default";

// 排序方向
export type SortOrder = "asc" | "desc";

// 视图模式
export type ViewMode = "grid" | "list";

// 过滤器配置
export interface ModuleFilter {
  status?: "enabled" | "disabled" | "all";
  source?: "local" | "remote" | "all";
  category?: string | "all";
  searchQuery?: string;
}

// 排序配置
export interface ModuleSortConfig {
  by: SortBy;
  order: SortOrder;
}

// 推荐模块分组
export interface RecommendedModules {
  popular: ModuleDefinition[];
  newReleases: ModuleDefinition[];
  smart: ModuleDefinition[];
}

// 工具中心状态
export interface ModuleCenterState {
  activeTab: ModuleTab;
  filter: ModuleFilter;
  sort: ModuleSortConfig;
  viewMode: ViewMode;
  selectedModuleId: string | null;
  isDetailModalOpen: boolean;
}

// 模块卡片数据
export interface ModuleCardData {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  category?: string;
  icon?: string;
  keywords?: string[];
  installed: boolean;
  enabled?: boolean;
  hasUpdate?: boolean;
  isNew?: boolean;
  source?: "local" | "remote";
}

// 统计数据
export interface ModuleStatsData {
  total: number;
  enabled: number;
  disabled: number;
  local: number;
  remote: number;
}
