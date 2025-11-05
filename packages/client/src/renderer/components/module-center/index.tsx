import { useState, useMemo, useCallback } from "react";
import { useModulePlatform } from "@/contexts/module-context";
import { useTheme } from "../theme-provider";
import { ModuleToolbar } from "./module-toolbar";
import { ModuleTabs } from "./module-tabs";
import { ModuleStats } from "./module-stats";
import { ModuleGrid } from "./module-grid";
import { ModuleDetailModal } from "./module-detail-modal";
import { ModuleRecommendations } from "./module-recommendations";
import { useModuleSearch, useSearchInput } from "./hooks/use-module-search";
import { useModuleFilter } from "./hooks/use-module-filter";
import { useModuleSort } from "./hooks/use-module-sort";
import { useRecommendations } from "./hooks/use-recommendations";
import type { ModuleTab, ModuleFilter, ModuleSortConfig, ViewMode } from "./types";

/**
 * 模块中心 - 重构版
 * Tab 切换 + 增强型卡片网格布局
 */
export function ModuleCenter() {
  const {
    moduleStats,
    installedModules,
    availableModules,
    toggleModuleStatus,
    uninstallModule,
    installModule,
    setActiveModuleId,
    pinToQuickAccess,
    unpinFromQuickAccess,
  } = useModulePlatform();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 状态管理
  const [activeTab, setActiveTab] = useState<ModuleTab>("installed");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null);

  // 搜索状态
  const { inputValue, debouncedValue, setInputValue } = useSearchInput();

  // 过滤状态
  const [filter, setFilter] = useState<ModuleFilter>({
    status: "all",
    source: "all",
    category: "all",
  });

  // 排序状态
  const [sortConfig, setSortConfig] = useState<ModuleSortConfig>({
    by: "default",
    order: "asc",
  });

  // 应用过滤器
  const { filteredInstalled, filteredAvailable, availableCategories } = useModuleFilter(
    installedModules,
    availableModules,
    filter
  );

  // 应用搜索
  const searchedInstalled = useModuleSearch(filteredInstalled, debouncedValue);
  const searchedAvailable = useModuleSearch(filteredAvailable, debouncedValue);

  // 应用排序
  const sortedInstalled = useModuleSort(searchedInstalled, sortConfig);
  const sortedAvailable = useModuleSort(searchedAvailable, sortConfig);

  // 获取推荐
  const recommendations = useRecommendations(installedModules, availableModules);

  // 当前显示的模块列表
  const currentModules = useMemo(() => {
    switch (activeTab) {
      case "installed":
        return sortedInstalled;
      case "store":
        return sortedAvailable; // 商店页显示所有可用模块
      default:
        return [];
    }
  }, [activeTab, sortedInstalled, sortedAvailable]);

  // 详情 Modal 的模块数据
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    
    const installed = installedModules.find((m) => m.id === selectedModuleId);
    if (installed) return installed;
    
    const available = availableModules.find((m) => m.id === selectedModuleId);
    return available || null;
  }, [selectedModuleId, installedModules, availableModules]);

  const isSelectedModuleInstalled = useMemo(() => {
    return installedModules.some((m) => m.id === selectedModuleId);
  }, [selectedModuleId, installedModules]);

  // 处理安装
  const handleInstall = useCallback(
    async (moduleId: string) => {
      setProcessingModuleId(moduleId);
      try {
        await installModule(moduleId);
      } finally {
        setProcessingModuleId(null);
      }
    },
    [installModule]
  );

  // 处理卸载
  const handleUninstall = useCallback(
    (moduleId: string) => {
      uninstallModule(moduleId);
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
      }
    },
    [uninstallModule, selectedModuleId]
  );

  // 处理状态切换
  const handleToggleStatus = useCallback(
    (moduleId: string) => {
      toggleModuleStatus(moduleId);
    },
    [toggleModuleStatus]
  );

  // 处理固定/取消固定到快速访问
  const handlePinToggle = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find((m) => m.id === moduleId);
      if (!module) return;

      if (module.pinnedToQuickAccess) {
        await unpinFromQuickAccess(moduleId);
      } else {
        await pinToQuickAccess(moduleId);
      }
    },
    [installedModules, pinToQuickAccess, unpinFromQuickAccess]
  );

  // 处理打开模块
  const handleOpen = useCallback(
    (moduleId: string) => {
      setActiveModuleId(moduleId);
    },
    [setActiveModuleId]
  );

  // 处理卡片点击
  const handleCardClick = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId);
  }, []);

  // 处理分类变更
  const handleCategoryChange = useCallback((category: string) => {
    setFilter((prev) => ({ ...prev, category }));
  }, []);

  // 处理排序变更
  const handleSortChange = useCallback((sortBy: ModuleSortConfig["by"]) => {
    setSortConfig((prev) => ({ ...prev, by: sortBy }));
  }, []);

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 工具栏 */}
      <ModuleToolbar
        searchQuery={inputValue}
        onSearchChange={setInputValue}
        sortBy={sortConfig.by}
        onSortChange={handleSortChange}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        categories={availableCategories}
        selectedCategory={filter.category || "all"}
        onCategoryChange={handleCategoryChange}
      />

      {/* Tab 切换 */}
      <ModuleTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          installed: installedModules.length,
          store: filteredAvailable.length,
        }}
      />

      {/* 统计卡片 */}
      <ModuleStats stats={moduleStats} />

      {/* 内容区域 - 添加 padding 为阴影预留空间 */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {activeTab === "store" ? (
          <div className="space-y-6">
            {/* 推荐区域 */}
            {(recommendations.popular.length > 0 || 
              recommendations.newReleases.length > 0 || 
              recommendations.smart.length > 0) && (
              <div>
                <h2 className={`mb-4 text-xl font-bold ${
                  isDark ? "text-white" : "text-slate-800"
                }`}>
                  💡 为您推荐
                </h2>
                <ModuleRecommendations
                  recommendations={recommendations}
                  onInstall={handleInstall}
                  onCardClick={handleCardClick}
                  processingModuleId={processingModuleId}
                />
              </div>
            )}

            {/* 全部可用模块 */}
            <div>
              <h2 className={`mb-4 text-xl font-bold ${
                isDark ? "text-white" : "text-slate-800"
              }`}>
                🛍️ 全部模块
              </h2>
              <ModuleGrid
                modules={currentModules}
                viewMode={viewMode}
                processingModuleId={processingModuleId}
                onInstall={handleInstall}
                onCardClick={handleCardClick}
                emptyMessage="没有找到可用模块"
              />
            </div>
          </div>
        ) : (
          <ModuleGrid
            modules={currentModules}
            viewMode={viewMode}
            processingModuleId={processingModuleId}
            onToggleStatus={handleToggleStatus}
            onUninstall={handleUninstall}
            onOpen={handleOpen}
            onPinToggle={handlePinToggle}
            onCardClick={handleCardClick}
            emptyMessage="还没有安装任何模块,前往商店看看吧"
          />
        )}
      </div>

      {/* 详情 Modal */}
      <ModuleDetailModal
        module={selectedModule}
        isOpen={selectedModuleId !== null}
        onClose={() => setSelectedModuleId(null)}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        onToggleStatus={handleToggleStatus}
        onOpen={handleOpen}
        isInstalled={isSelectedModuleInstalled}
      />
    </div>
  );
}
