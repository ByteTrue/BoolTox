/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Fade from '@mui/material/Fade';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleGrid } from './module-grid';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebar } from './module-sidebar';
import { BatchActionsBar } from './batch-actions-bar';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import { ModuleRecommendations } from './module-recommendations';
import { useRecommendations } from './hooks/use-recommendations';
import { CustomSelect } from './custom-select';
import { Search, ArrowUpDown, Plus, CheckSquare } from 'lucide-react';
import { DropZone } from './drop-zone';
import type { ModuleSortConfig } from './types';
import type { ModuleInstance } from '@/types/module';
import type { ToolSourceConfig } from '@booltox/shared';

/**
 * 工具中心 - MUI 风格
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
    openModule,
    stopModule,
    focusModuleWindow,
    isDevPlugin,
    addLocalBinaryTool,
  } = useModulePlatform();

  // --- 状态管理 ---
  const [currentView, setCurrentView] = useState<string>('installed');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set());
  const { inputValue, debouncedValue, setInputValue } = useSearchInput();
  const [sortConfig, setSortConfig] = useState<ModuleSortConfig>({
    by: 'default',
    order: 'asc',
  });
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
            installed: toolRegistry.some(t => t.id === plugin.id),
            launchState: 'idle' as const,
            lastError: null,
          },
          isFavorite: false,
          sourceId: plugin.sourceId || 'unknown',
          sourceName: plugin.sourceName || '未知来源',
        }) as ModuleInstance
    );
  }, [availablePlugins, toolRegistry]);

  const officialTools = useMemo(() => {
    return allAvailableModules.filter(m => m.sourceId === 'official');
  }, [allAvailableModules]);

  const customTools = useMemo(() => {
    return allAvailableModules.filter(m => m.sourceId && m.sourceId !== 'official');
  }, [allAvailableModules]);

  const storeModules = useMemo(() => {
    return allAvailableModules.filter(m => !m.runtime.installed);
  }, [allAvailableModules]);

  const runningCount = useMemo(() => {
    return installedModules.filter(m => m.runtime.launchState === 'running').length;
  }, [installedModules]);

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
          modules = installedModules.filter(m => m.runtime.launchState === 'running');
          break;
        case 'store-grouped':
          modules = allAvailableModules.filter(m => !m.runtime.installed);
          break;
        case 'store':
          modules = storeModules;
          break;
        case 'official':
          modules = officialTools.filter(m => !m.runtime.installed);
          break;
        case 'custom':
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

  const categoryFilteredModules = useMemo(() => {
    if (currentCategory === 'all') return displayedModulesRaw;
    return displayedModulesRaw.filter(
      m => (m.definition.category || 'utilities').toLowerCase() === currentCategory.toLowerCase()
    );
  }, [displayedModulesRaw, currentCategory]);

  const searchedModules = useModuleSearch(categoryFilteredModules, debouncedValue);
  const finalModules = useModuleSort(searchedModules, sortConfig);

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

  const recommendations = useRecommendations(installedModules, availableModules);
  const showRecommendations =
    (currentView === 'store' || currentView === 'official') &&
    !debouncedValue &&
    currentCategory === 'all';

  // --- 回调函数 ---
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
      addLocalBinaryTool();
    },
    [addLocalBinaryTool]
  );

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setCurrentCategory('all');
    setIsSelectionMode(false);
    setSelectedToolIds(new Set());
  };

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

  const getViewTitle = () => {
    if (currentCategory !== 'all') return `📂 ${currentCategory}`;
    switch (currentView) {
      case 'running':
        return '▶️ 运行中';
      case 'store':
        return '🛍️ 全部工具';
      case 'official':
        return '🏪 官方工具库';
      case 'custom':
        return '🌐 社区工具';
      case 'favorites':
        return '⭐ 我的收藏';
      default:
        if (currentView.startsWith('source:')) {
          const sourceId = currentView.replace('source:', '');
          const sourceName = allAvailableModules.find(m => m.sourceId === sourceId)?.sourceName;
          return `📂 ${sourceName || '工具源'}`;
        }
        return '📦 已安装工具';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
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
      <Fade in={isDragActive}>
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            p: 4,
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            <DropZone onDrop={handleDrop} onBrowse={addLocalBinaryTool} />
          </Box>
        </Box>
      </Fade>

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
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部工具栏 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            borderBottom: 1,
            borderColor: 'divider',
            px: 3,
            py: 2,
          }}
        >
          <TextField
            placeholder={`在 ${
              currentView === 'store' ? '商店' : currentView === 'favorites' ? '收藏' : '已安装'
            }中搜索...`}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            size="small"
            sx={{ maxWidth: 400, flex: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {currentView === 'installed' && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Plus size={16} />}
                  onClick={addLocalBinaryTool}
                >
                  本地工具
                </Button>

                <Button
                  variant={isSelectionMode ? 'contained' : 'outlined'}
                  size="small"
                  startIcon={<CheckSquare size={16} />}
                  onClick={() => {
                    setIsSelectionMode(!isSelectionMode);
                    setSelectedToolIds(new Set());
                  }}
                >
                  管理
                </Button>
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
          </Box>
        </Box>

        {/* 滚动内容区 */}
        <Box sx={{ flex: 1, overflow: 'auto', px: 3, py: 3, position: 'relative' }}>
          {showRecommendations && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight="bold" color="text.primary" sx={{ mb: 2 }}>
                💡 推荐工具
              </Typography>
              <ModuleRecommendations
                recommendations={recommendations}
                onInstall={handleInstall}
                onCardClick={id => setSelectedModuleId(id)}
                processingModuleId={processingModuleId}
              />
              <Box sx={{ my: 4, borderTop: 1, borderColor: 'divider' }} />
            </Box>
          )}

          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              {getViewTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {finalModules.length} 个项目
            </Typography>
          </Box>

          <ModuleGrid
            modules={finalModules}
            processingModuleId={processingModuleId}
            onUninstall={handleUninstall}
            onOpen={handleOpen}
            onStop={stopModule}
            onCardClick={id => setSelectedModuleId(id)}
            isDevPlugin={isDevPlugin}
            emptyMessage={
              currentView === 'favorites'
                ? '暂无收藏的工具'
                : currentView === 'store'
                  ? '没有找到匹配的工具'
                  : '还没有安装任何工具'
            }
          />
        </Box>

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
      </Box>

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
    </Box>
  );
}
