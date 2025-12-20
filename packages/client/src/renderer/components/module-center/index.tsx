/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useModulePlatform } from '@/contexts/module-context';
import { useTheme } from '../theme-provider';
import { ModuleGrid } from './module-grid';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebar } from './module-sidebar';
import { BatchActionsBar } from './batch-actions-bar';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import { ModuleRecommendations } from './module-recommendations';
import { useRecommendations } from './hooks/use-recommendations';
import { CustomSelect } from './custom-select';
import { Search, ArrowUpDown, Plus, CheckSquare, LayoutGrid, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { iconButtonInteraction } from '@/utils/animation-presets';
import { DropZone } from './drop-zone';
import type { ModuleSortConfig, ViewMode } from './types';
import type { ModuleInstance } from '@/types/module';
import type { ToolSourceConfig } from '@booltox/shared';

/**
 * 工具中心 - 重新设计的侧边栏布局
 */
export function ModuleCenter() {
  const navigate = useNavigate();
  const {
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
  const isDark = theme === 'dark';

  // --- 状态管理 ---

  // 视图状态: 'installed' | 'favorites' | 'store'
  const [currentView, setCurrentView] = useState<string>('installed');
  const [currentCategory, setCurrentCategory] = useState<string>('all');

  // UI 状态
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  // 批量操作状态
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());

  // 搜索与排序
  const { inputValue, debouncedValue, setInputValue } = useSearchInput();
  const [sortConfig, setSortConfig] = useState<ModuleSortConfig>({
    by: 'default',
    order: 'asc',
  });

  // 工具源列表（用于侧边栏显示）
  const [toolSources, setToolSources] = useState<ToolSourceConfig[]>([]);

  useEffect(() => {
    const loadToolSources = async () => {
      try {
        const sources = (await window.ipc.invoke('tool-sources:list')) as
          | ToolSourceConfig[]
          | undefined;
        setToolSources(sources || []);
      } catch (error) {
        console.error('[ModuleCenter] Failed to load tool sources:', error);
        setToolSources([]);
      }
    };
    loadToolSources();
  }, []);

  // --- 数据处理 ---

  // 1. 准备基础数据集
  // 将 availablePlugins 转换为 ModuleInstance 格式（不过滤已安装）
  const allAvailableModules = useMemo(() => {
    return availablePlugins.map(
      plugin =>
        ({
          id: plugin.id,
          definition: {
            id: plugin.id,
            name: plugin.name,
            description: plugin.description || '',
            version: plugin.version,
            category: plugin.category || 'utilities',
            keywords: plugin.keywords || [],
            icon: plugin.icon || '🔌',
            screenshots: plugin.screenshots || [],
            installedByDefault: false,
            source: 'remote' as const,
            runtime: plugin.runtime,
            runtimeMode: plugin.runtime?.type === 'standalone' ? 'standalone' : 'webview',
          },
          runtime: {
            component: null,
            loading: false,
            error: null,
            installed: toolRegistry.some(t => t.id === plugin.id), // 标记是否已安装
            launchState: 'idle' as const,
            lastError: null,
          },
          isFavorite: false,
          sourceId: plugin.sourceId || 'unknown',
          sourceName: plugin.sourceName || '未知来源',
        }) as ModuleInstance
    );
  }, [availablePlugins, toolRegistry]);

  // 官方工具（来自官方工具源）
  const officialTools = useMemo(() => {
    return allAvailableModules.filter(m => m.sourceId === 'official');
  }, [allAvailableModules]);

  // 自定义工具（来自非官方工具源）
  const customTools = useMemo(() => {
    return allAvailableModules.filter(m => m.sourceId && m.sourceId !== 'official');
  }, [allAvailableModules]);

  // 未安装的工具（用于旧的 store 视图）
  const storeModules = useMemo(() => {
    return allAvailableModules.filter(m => !m.runtime.installed);
  }, [allAvailableModules]);

  // 计算运行中的工具数
  const runningCount = useMemo(() => {
    return installedModules.filter(m => m.runtime.launchState === 'running').length;
  }, [installedModules]);

  // 计算每个工具源的可安装工具数量
  const sourceToolCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allAvailableModules.forEach(m => {
      if (!m.runtime.installed && m.sourceId) {
        counts[m.sourceId] = (counts[m.sourceId] || 0) + 1;
      }
    });
    return counts;
  }, [allAvailableModules]);

  const displayedModulesRaw = useMemo(() => {
    let modules: ModuleInstance[] = [];

    // 检查是否为动态工具源视图（格式：source:sourceId）
    if (currentView.startsWith('source:')) {
      const sourceId = currentView.replace('source:', '');
      modules = allAvailableModules.filter(m => m.sourceId === sourceId && !m.runtime.installed);
    } else {
      switch (currentView) {
        case 'installed':
          modules = installedModules;
          break;
        case 'favorites':
          modules = installedModules.filter(m => m.isFavorite);
          break;
        case 'running':
          // 运行中的工具
          modules = installedModules.filter(m => m.runtime.launchState === 'running');
          break;
        case 'store-grouped':
          // 工具市场：按工具源分组展示（保留所有未安装工具用于分组）
          modules = allAvailableModules.filter(m => !m.runtime.installed);
          break;
        case 'store':
          // 旧的商店视图：只显示未安装的
          modules = storeModules;
          break;
        case 'official':
          // 官方工具商店：只显示未安装的官方工具
          modules = officialTools.filter(m => !m.runtime.installed);
          break;
        case 'custom':
          // 自定义工具：只显示未安装的自定义工具（来自远程工具源）
          modules = customTools.filter(m => !m.runtime.installed);
          break;
        default:
          modules = installedModules;
      }
    }
    return modules;
  }, [
    currentView,
    installedModules,
    storeModules,
    officialTools,
    customTools,
    allAvailableModules,
  ]);

  // 2. 应用分类过滤
  const categoryFilteredModules = useMemo(() => {
    if (currentCategory === 'all') return displayedModulesRaw;
    return displayedModulesRaw.filter(
      m => (m.definition.category || 'utilities').toLowerCase() === currentCategory.toLowerCase()
    );
  }, [displayedModulesRaw, currentCategory]);

  // 3. 应用搜索
  const searchedModules = useModuleSearch(categoryFilteredModules, debouncedValue);

  // 4. 应用排序
  const finalModules = useModuleSort(searchedModules, sortConfig);

  // 获取所有可用分类（基于当前视图）
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    displayedModulesRaw.forEach(m => {
      const cat = m.definition.category;
      if (cat) categories.add(cat);
    });
    storeModules.forEach(m => {
      const cat = m.definition.category;
      if (cat) categories.add(cat);
    });
    return Array.from(categories).sort();
  }, [displayedModulesRaw, storeModules]);

  // 获取推荐
  const recommendations = useRecommendations(installedModules, availableModules);
  const showRecommendations =
    (currentView === 'store' || currentView === 'official') &&
    !debouncedValue &&
    currentCategory === 'all';

  // --- 回调函数 ---

  // 详情 Modal 数据
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;

    const installed = installedModules.find(m => m.id === selectedModuleId);
    if (installed) return installed;

    const available = availableModules.find(m => m.id === selectedModuleId);
    if (available) return available;

    const onlinePlugin = availablePlugins.find(p => p.id === selectedModuleId);
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
          screenshots: onlinePlugin.screenshots || [],
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
      } as unknown as ModuleInstance;
    }
    return null;
  }, [selectedModuleId, installedModules, availableModules, availablePlugins]);

  const isSelectedModuleInstalled = useMemo(() => {
    return installedModules.some(m => m.id === selectedModuleId);
  }, [selectedModuleId, installedModules]);

  // 操作回调
  const handleInstall = useCallback(
    async (moduleId: string) => {
      setProcessingModuleId(moduleId);
      try {
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

  const handleUninstall = useCallback(
    (moduleId: string) => {
      uninstallModule(moduleId);
      if (selectedModuleId === moduleId) setSelectedModuleId(null);
    },
    [uninstallModule, selectedModuleId]
  );

  const handlePinToggle = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find(m => m.id === moduleId);
      if (!module) return;
      if (module.isFavorite) {
        await removeFavorite(moduleId);
      } else {
        await addFavorite(moduleId);
      }
    },
    [addFavorite, installedModules, removeFavorite]
  );

  const handleOpen = useCallback(
    (moduleId: string) => {
      const targetModule = installedModules.find(m => m.id === moduleId);
      if (!targetModule) return;
      if (targetModule.runtime.launchState === 'running') {
        void focusModuleWindow(moduleId);
      } else {
        void openModule(moduleId);
      }
    },
    [focusModuleWindow, installedModules, openModule]
  );

  // 拖拽处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && e.dataTransfer.types.indexOf('Files') !== -1) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有离开当前容器时才取消（通过关联目标判断）
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (files: FileList) => {
      setIsDragActive(false);
      if (files.length === 0) return;

      // 假设 installLocalModule 可以处理文件对象
      // 这里需要根据实际 API 调整，暂时使用 addLocalBinaryTool 模拟
      // 实际上应该调用处理文件路径的逻辑

      // 如果有处理文件的逻辑，可以在这里调用
      // await installLocalModule(files[0].path);

      // 临时：打开手动添加对话框
      addLocalBinaryTool();
    },
    [addLocalBinaryTool]
  );

  // 视图切换处理
  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setCurrentCategory('all');
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  };

  // 批量操作回调... (省略重复逻辑)
  const handleSelect = useCallback((toolId: string) => {
    setSelectedToolIds(prev => {
      const next = new Set(prev);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  }, []);

  const handleStartAll = useCallback(async () => {
    const toolIds = Array.from(selectedToolIds);
    for (const toolId of toolIds) await openModule(toolId);
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }, [selectedToolIds, openModule]);

  const handleStopAll = useCallback(async () => {
    const toolIds = Array.from(selectedToolIds);
    for (const toolId of toolIds) {
      const tool = installedModules.find(m => m.id === toolId);
      if (tool?.definition.runtime?.type === 'http-service') {
        await stopModule(toolId);
      }
    }
  }, [selectedToolIds, installedModules, stopModule]);

  const handleUninstallAll = useCallback(async () => {
    if (!confirm(`确定要卸载 ${selectedToolIds.size} 个工具吗？`)) return;
    for (const toolId of Array.from(selectedToolIds)) await uninstallModule(toolId);
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  }, [selectedToolIds, uninstallModule]);

  const hasHttpServiceSelected = useMemo(() => {
    return Array.from(selectedToolIds).some(toolId => {
      const tool = installedModules.find(m => m.id === toolId);
      return (
        tool?.definition.runtime?.type === 'http-service' && tool.runtime.launchState === 'running'
      );
    });
  }, [selectedToolIds, installedModules]);

  return (
    <div
      className="flex h-full overflow-hidden bg-transparent relative"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={e => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files.length > 0) {
          handleDrop(e.dataTransfer.files);
        }
      }}
    >
      {/* 拖拽覆盖层 */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-8"
          >
            <div className="w-full max-w-2xl">
              <DropZone onDrop={handleDrop} onBrowse={addLocalBinaryTool} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 左侧侧边栏 */}
      <ModuleSidebar
        currentView={currentView}
        currentCategory={currentCategory}
        onViewChange={handleViewChange}
        onCategoryChange={setCurrentCategory}
        onAddToolSource={() => navigate('/tools/add-source')}
        stats={{
          installed: installedModules.length,
          store: storeModules.length,
          official: officialTools.filter(m => !m.runtime.installed).length,
          custom: customTools.filter(m => !m.runtime.installed).length,
          favorites: installedModules.filter(m => m.isFavorite).length,
          running: runningCount,
          sourceCount: sourceToolCounts,
        }}
        categories={availableCategories}
        toolSources={toolSources}
      />

      {/* 右侧主内容区 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 顶部工具栏 */}
        <div
          className={`flex flex-none items-center justify-between gap-4 border-b px-6 py-4 ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}
        >
          <div className="relative max-w-md flex-1">
            <Search
              size={18}
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${
                isDark ? 'text-white/60' : 'text-slate-500'
              }`}
            />
            <input
              type="text"
              placeholder={`在 ${
                currentView === 'store' ? '商店' : currentView === 'favorites' ? '收藏' : '已安装'
              }中搜索...`}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              className={`w-full rounded-lg border py-2 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                isDark
                  ? 'border-white/10 bg-white/5 text-white placeholder:text-white/50'
                  : 'border-slate-200 bg-white/80 text-slate-800 placeholder:text-slate-400'
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            {currentView === 'installed' && (
              <>
                <motion.button
                  {...iconButtonInteraction}
                  onClick={addLocalBinaryTool}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isDark
                      ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      : 'border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">本地工具</span>
                </motion.button>

                <motion.button
                  {...iconButtonInteraction}
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedToolIds(new Set());
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    isSelectionMode
                      ? 'border-blue-500/50 bg-blue-500/20 text-blue-500'
                      : isDark
                        ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                        : 'border-slate-200 bg-white/50 text-slate-700 hover:bg-white/80'
                  }`}
                >
                  <CheckSquare size={16} />
                  <span className="hidden sm:inline">管理</span>
                </motion.button>
              </>
            )}

            <CustomSelect
              value={sortConfig.by}
              onChange={val =>
                setSortConfig(prev => ({ ...prev, by: val as ModuleSortConfig['by'] }))
              }
              options={[
                { value: 'default', label: '默认' },
                { value: 'name', label: '名称' },
                { value: 'updatedAt', label: '时间' },
              ]}
              icon={<ArrowUpDown size={16} />}
              minimal
            />

            <div
              className={`flex items-center rounded-lg border p-1 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/50'
              }`}
            >
              <button
                onClick={() => setViewMode('grid')}
                className={`rounded p-1 transition-colors ${
                  viewMode === 'grid'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200 text-slate-900'
                    : isDark
                      ? 'text-white/40 hover:text-white/80'
                      : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`rounded p-1 transition-colors ${
                  viewMode === 'list'
                    ? isDark
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-200 text-slate-900'
                    : isDark
                      ? 'text-white/40 hover:text-white/80'
                      : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* 滚动内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-6 elegant-scroll relative">
          {showRecommendations && (
            <div className="mb-8">
              <h2 className={`mb-4 text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
                💡 推荐工具
              </h2>
              <ModuleRecommendations
                recommendations={recommendations}
                onInstall={handleInstall}
                onCardClick={id => setSelectedModuleId(id)}
                processingModuleId={processingModuleId}
              />
              <div className={`my-8 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`} />
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {currentCategory === 'all'
                ? currentView === 'running'
                  ? '▶️ 运行中'
                  : currentView === 'store'
                    ? '🛍️ 全部工具'
                    : currentView === 'official'
                      ? '🏪 官方工具库'
                      : currentView === 'custom'
                        ? '🌐 社区工具'
                        : currentView === 'favorites'
                          ? '⭐ 我的收藏'
                          : currentView.startsWith('source:')
                            ? `📂 ${allAvailableModules.find(m => m.sourceId === currentView.replace('source:', ''))?.sourceName || '工具源'}`
                            : '📦 已安装工具'
                : `📂 ${currentCategory}`}
            </h2>
            <span className={`text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {finalModules.length} 个项目
            </span>
          </div>

          <ModuleGrid
            modules={finalModules}
            viewMode={viewMode}
            processingModuleId={processingModuleId}
            onUninstall={handleUninstall}
            onOpen={handleOpen}
            onStop={stopModule}
            onPinToggle={handlePinToggle}
            onCardClick={id => setSelectedModuleId(id)}
            isDevPlugin={isDevPlugin}
            isSelectionMode={isSelectionMode}
            selectedToolIds={selectedToolIds}
            onSelect={handleSelect}
            emptyMessage={
              currentView === 'favorites'
                ? '暂无收藏的工具'
                : currentView === 'store'
                  ? '没有找到匹配的工具'
                  : '还没有安装任何工具'
            }
          />
        </div>

        {/* 批量操作浮层 */}
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
      </div>

      {/* 详情弹窗 */}
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
