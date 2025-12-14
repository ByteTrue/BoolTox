/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useMemo, useCallback } from "react";
import { useModulePlatform } from "@/contexts/module-context";
import { useTheme } from "../theme-provider";
import { ModuleGrid } from "./module-grid";
import { ModuleDetailModal } from "./module-detail-modal";
import { ModuleRecommendations } from "./module-recommendations";
import { BatchActionsBar } from "./batch-actions-bar";
import { useModuleSearch, useSearchInput } from "./hooks/use-module-search";
import { useModuleFilter } from "./hooks/use-module-filter";
import { useModuleSort } from "./hooks/use-module-sort";
import { useRecommendations } from "./hooks/use-recommendations";
import { CustomSelect } from "./custom-select";
import { Search, SlidersHorizontal, ArrowUpDown, Plus, CheckSquare } from "lucide-react";
import { motion } from "framer-motion";
import { iconButtonInteraction } from "@/utils/animation-presets";
import { getGlassStyle } from "@/utils/glass-layers";
import type { ModuleTab, ModuleFilter, ModuleSortConfig, ViewMode } from "./types";

/**
 * 工具中心（Launchpad 风格）
 * 收藏区 + 全部工具 + 商店推荐
 */
export function ModuleCenter() {
  const {
    moduleStats,
    installedModules,
    toolRegistry,
    availableModules,
    availablePlugins,
    uninstallModule,
    installModule,
    installOnlinePlugin,
    addFavorite,
    removeFavorite,
    openModule,
    stopModule,
    focusModuleWindow,
    isDevPlugin,
    addLocalBinaryTool,
  } = useModulePlatform();

  const { theme } = useTheme();
  const isDark = theme === "dark";

  // 状态管理
  const [activeTab, setActiveTab] = useState<ModuleTab>("installed");
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null);

  // 批量操作状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

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
  const { filteredInstalled, availableCategories } = useModuleFilter(
    installedModules,
    availableModules,
    availablePlugins, // 传递在线工具列表
    filter
  );

  // 应用搜索
  const searchedInstalled = useModuleSearch(filteredInstalled, debouncedValue);

  // 应用排序
  const sortedInstalled = useModuleSort(searchedInstalled, sortConfig);

  // 获取推荐
  const recommendations = useRecommendations(installedModules, availableModules);

  // 当前显示的模块列表
  const favoriteModules = useMemo(
    () => sortedInstalled.filter((module) => module.isFavorite),
    [sortedInstalled],
  );

  const regularModules = useMemo(
    () => sortedInstalled.filter((module) => !module.isFavorite),
    [sortedInstalled],
  );

  const availableStoreModules = useMemo(() => {
    // 将在线工具转换为可以在UI中显示的格式
    // 过滤掉所有已安装的工具(包括开发模式和正式安装的)
    const installedPluginIds = new Set(toolRegistry.map(p => p.id));
    return availablePlugins.filter(p => !installedPluginIds.has(p.id));
  }, [availablePlugins, toolRegistry]);

  // 详情 Modal 的模块数据
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    
    // 优先从已安装模块查找
    const installed = installedModules.find((m) => m.id === selectedModuleId);
    if (installed) return installed;
    
    // 从本地可用模块查找
    const available = availableModules.find((m) => m.id === selectedModuleId);
    if (available) return available;
    
    // 从在线工具查找并转换为 ModuleInstance 格式
    const onlinePlugin = availablePlugins.find((p) => p.id === selectedModuleId);
    if (onlinePlugin) {
      return {
        id: onlinePlugin.id,
        definition: {
          id: onlinePlugin.id,
          name: onlinePlugin.name,
          description: onlinePlugin.description || '',
          version: onlinePlugin.version,
          category: onlinePlugin.category || 'utilities',
          keywords: onlinePlugin.keywords || [],
          icon: onlinePlugin.icon || '🔌',
          screenshots: onlinePlugin.screenshots || [], // 截图列表
          installedByDefault: false,
          source: 'remote' as const,
          loader: () => Promise.resolve(() => null),
        },
        runtime: {
          component: null,
          loading: false,
          error: null,
          installed: false,
          launchState: 'idle' as const,
          lastError: null,
        },
        isFavorite: false,
      };
    }
    
    return null;
  }, [selectedModuleId, installedModules, availableModules, availablePlugins]);

  const isSelectedModuleInstalled = useMemo(() => {
    return installedModules.some((m) => m.id === selectedModuleId);
  }, [selectedModuleId, installedModules]);

  // 处理安装
  const handleInstall = useCallback(
    async (moduleId: string) => {
      setProcessingModuleId(moduleId);
      try {
        // 检查是否是在线工具
        const onlinePlugin = availablePlugins.find(p => p.id === moduleId);
        if (onlinePlugin) {
          await installOnlinePlugin(onlinePlugin);
        } else {
          await installModule(moduleId);
        }
      } finally {
        setProcessingModuleId(null);
      }
    },
    [installModule, installOnlinePlugin, availablePlugins]
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

  // 处理收藏/取消收藏
  const handlePinToggle = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find((m) => m.id === moduleId);
      if (!module) return;

      if (module.isFavorite) {
        await removeFavorite(moduleId);
      } else {
        await addFavorite(moduleId);
      }
    },
    [addFavorite, installedModules, removeFavorite]
  );

  // 批量操作：切换选择
  const handleSelect = useCallback((toolId: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) {
        next.delete(toolId);
      } else {
        next.add(toolId);
      }
      return next;
    });
  }, []);

  // 批量操作：启动全部
  const handleStartAll = useCallback(async () => {
    const toolIds = Array.from(selectedToolIds);
    for (const toolId of toolIds) {
      await openModule(toolId);
    }
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }, [selectedToolIds, openModule]);

  // 批量操作：停止全部（仅 http-service）
  const handleStopAll = useCallback(async () => {
    const toolIds = Array.from(selectedToolIds);
    for (const toolId of toolIds) {
      const tool = installedModules.find(m => m.id === toolId);
      if (tool?.definition.runtime?.type === 'http-service') {
        await stopModule(toolId);
      }
    }
  }, [selectedToolIds, installedModules, stopModule]);

  // 批量操作：卸载全部
  const handleUninstallAll = useCallback(async () => {
    const count = selectedToolIds.size;
    if (!confirm(`确定要卸载 ${count} 个工具吗？此操作不可恢复。`)) {
      return;
    }

    const toolIds = Array.from(selectedToolIds);
    for (const toolId of toolIds) {
      await uninstallModule(toolId);
    }
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }, [selectedToolIds, uninstallModule]);

  // 检查选中的工具中是否有 http-service 类型
  const hasHttpServiceSelected = useMemo(() => {
    return Array.from(selectedToolIds).some(toolId => {
      const tool = installedModules.find(m => m.id === toolId);
      return tool?.definition.runtime?.type === 'http-service' && tool.runtime.launchState === 'running';
    });
  }, [selectedToolIds, installedModules]);

  // 处理打开模块
  const handleOpen = useCallback(
    (moduleId: string) => {
      const targetModule = installedModules.find((m) => m.id === moduleId);
      if (!targetModule) {
        return;
      }

      if (targetModule.runtime.launchState === "running") {
        void focusModuleWindow(moduleId);
        return;
      }

      void openModule(moduleId);
    },
    [focusModuleWindow, installedModules, openModule],
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

  const viewMode: ViewMode = "grid";

  const statsChips = [
    { label: "工具总数", value: moduleStats.total },
    { label: "正在使用", value: moduleStats.enabled },
    { label: "已停用", value: moduleStats.disabled },
  ];

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 min-w-[220px] md:max-w-lg">
            <Search
              size={18}
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? "text-white/60" : "text-slate-500"
              }`}
            />
            <input
              type="text"
              placeholder="搜索工具..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className={`w-full rounded-full border py-2.5 pl-10 pr-4 text-sm transition-[border-color,box-shadow] duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                isDark
                  ? "border-white/10 bg-white/5 text-white placeholder:text-white/50"
                  : "border-slate-200 bg-white/90 text-slate-800 placeholder:text-slate-400"
              }`}
            />
          </div>
          <div className="flex items-center gap-2">
            {/* 添加本地工具按钮 */}
            <motion.button
              {...iconButtonInteraction}
              onClick={addLocalBinaryTool}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-250 ease-swift ${
                isDark
                  ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                  : "border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80"
              }`}
              style={getGlassStyle('BUTTON', theme)}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">添加本地工具</span>
            </motion.button>

            {/* 选择模式按钮 */}
            {activeTab === "installed" && (
              <motion.button
                {...iconButtonInteraction}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedToolIds(new Set());
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-[background-color,border-color,box-shadow] duration-250 ease-swift ${
                  isSelectionMode
                    ? "border-blue-500/50 bg-blue-500/20 text-blue-500"
                    : isDark
                    ? "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    : "border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80"
                }`}
                style={getGlassStyle('BUTTON', theme)}
              >
                <CheckSquare size={16} />
                <span className="hidden sm:inline">{isSelectionMode ? "取消选择" : "选择"}</span>
              </motion.button>
            )}

            {/* 分类过滤 */}
            <CustomSelect
              value={filter.category || "all"}
              onChange={handleCategoryChange}
              options={[
                { value: "all", label: "全部分类" },
                ...availableCategories.map((cat) => ({ value: cat, label: cat || "未分类" })),
              ]}
              icon={<SlidersHorizontal size={16} />}
            />
            <CustomSelect
              value={sortConfig.by}
              onChange={(val) => handleSortChange(val as ModuleSortConfig["by"])}
              options={[
                { value: "default", label: "默认排序" },
                { value: "name", label: "按名称" },
                { value: "updatedAt", label: "按更新时间" },
              ]}
              icon={<ArrowUpDown size={16} />}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex rounded-full border p-1 text-sm shadow-sm ${
              isDark ? "border-white/10 bg-white/5" : "border-slate-200 bg-white"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveTab("installed")}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                activeTab === "installed"
                  ? isDark
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-900"
                  : isDark
                    ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              已安装 ({installedModules.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("store")}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                activeTab === "store"
                  ? isDark
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-900"
                  : isDark
                    ? "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                    : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              工具商店 ({availableStoreModules.length})
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {statsChips.map((chip) => (
              <span
                key={chip.label}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  isDark ? "bg-white/5 text-white/80" : "bg-slate-100 text-slate-600"
                }`}
              >
                {chip.label}：{chip.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 内容区域 - 添加 padding 为阴影预留空间 */}
      <div className="flex-1 overflow-y-auto px-2 py-2 elegant-scroll">
        {activeTab === "store" ? (
          <div className="space-y-8">
            {(recommendations.popular.length > 0 ||
              recommendations.newReleases.length > 0 ||
              recommendations.smart.length > 0) && (
              <div>
                <h2
                  className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                >
                  💡 为您推荐的工具
                </h2>
                <ModuleRecommendations
                  recommendations={recommendations}
                  onInstall={handleInstall}
                  onCardClick={handleCardClick}
                  processingModuleId={processingModuleId}
                />
              </div>
            )}

            <div>
              <h2
                className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                🛍️ 全部可用工具
              </h2>
              <ModuleGrid
                modules={availableStoreModules}
                viewMode={viewMode}
                processingModuleId={processingModuleId}
                onInstall={handleInstall}
                onCardClick={handleCardClick}
                emptyMessage="没有找到可用工具"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {favoriteModules.length > 0 && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
                  >
                    ★ 收藏的工具
                  </h2>
                  <p
                    className={`text-xs md:text-sm ${
                      isDark ? "text-white/60" : "text-slate-500"
                    }`}
                  >
                    常用工具会显示在这里，可随时取消收藏。
                  </p>
                </div>
                <ModuleGrid
                  modules={favoriteModules}
                  viewMode={viewMode}
                  processingModuleId={processingModuleId}
                  onUninstall={handleUninstall}
                  onOpen={handleOpen}
                  onStop={stopModule}
                  onPinToggle={handlePinToggle}
                  onCardClick={handleCardClick}
                  isDevPlugin={isDevPlugin}
                  isSelectionMode={isSelectionMode}
                  selectedToolIds={selectedToolIds}
                  onSelect={handleSelect}
                  emptyMessage="给喜爱的工具点亮一颗星星吧"
                />
              </section>
            )}

            <section>
              <h2
                className={`mb-4 text-xl font-bold ${isDark ? "text-white" : "text-slate-800"}`}
              >
                所有工具
              </h2>
              <ModuleGrid
                modules={regularModules}
                viewMode={viewMode}
                processingModuleId={processingModuleId}
                onUninstall={handleUninstall}
                onOpen={handleOpen}
                onStop={stopModule}
                onPinToggle={handlePinToggle}
                onCardClick={handleCardClick}
                isDevPlugin={isDevPlugin}
                isSelectionMode={isSelectionMode}
                selectedToolIds={selectedToolIds}
                onSelect={handleSelect}
                emptyMessage="还没有安装任何工具,前往工具商店看看吧"
              />
            </section>
          </div>
        )}
      </div>

      {/* 批量操作栏 */}
      {isSelectionMode && selectedToolIds.size > 0 && (
        <BatchActionsBar
          selectedCount={selectedToolIds.size}
          onStartAll={handleStartAll}
          onStopAll={handleStopAll}
          onUninstallAll={handleUninstallAll}
          onCancel={() => {
            setIsSelectionMode(false);
            setSelectedToolIds(new Set());
          }}
          hasHttpService={hasHttpServiceSelected}
        />
      )}

      {/* 详情 Modal */}
      <ModuleDetailModal
        module={selectedModule}
        isOpen={selectedModuleId !== null}
        onClose={() => setSelectedModuleId(null)}
        onInstall={handleInstall}
        onUninstall={handleUninstall}
        onOpen={handleOpen}
        isInstalled={isSelectedModuleInstalled}
      />
    </div>
  );
}
