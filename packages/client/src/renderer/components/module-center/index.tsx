/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Fade from '@mui/material/Fade';
import { Search, Add, CheckBox } from '@mui/icons-material';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebar } from './module-sidebar';
import { BatchActionsBar } from './batch-actions-bar';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import { ToolCard } from './tool-card';
import { DropZone } from './drop-zone';
import type { ModuleSortConfig } from './types';
import type { ModuleInstance } from '@/types/module';
import type { ToolSourceConfig } from '@booltox/shared';

/**
 * 工具中心 - Material Design 3 风格
 */
export function ModuleCenter() {
  const navigate = useNavigate();
  const {
    installedModules,
    toolRegistry,
    availablePlugins,
    uninstallModule,
    installOnlinePlugin,
    openModule,
    stopModule,
    focusModuleWindow,
    isDevPlugin,
    addLocalBinaryTool,
    addFavorite,
    removeFavorite,
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

  // --- 回调函数 ---
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;

    const installed = installedModules.find(m => m.id === selectedModuleId);
    if (installed) return installed;

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
  }, [selectedModuleId, installedModules, availablePlugins]);

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
        }
      } finally {
        setProcessingModuleId(null);
      }
    },
    [installOnlinePlugin, availablePlugins]
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

  const handleToggleFavorite = useCallback(
    (moduleId: string) => {
      const module = installedModules.find(m => m.id === moduleId);
      if (!module) return;
      if (module.isFavorite) {
        void removeFavorite(moduleId);
      } else {
        void addFavorite(moduleId);
      }
    },
    [installedModules, addFavorite, removeFavorite]
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

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.default',
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
            backdropFilter: 'blur(8px)',
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
        {/* 页面内工具栏 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
            bgcolor: theme => (theme.palette as any).surfaceContainerLow,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {/* 搜索框 */}
          <TextField
            placeholder="搜索工具..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            size="small"
            sx={{
              maxWidth: 320,
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: theme => (theme.palette as any).surfaceContainer,
                '& fieldset': {
                  borderColor: 'transparent',
                },
                '&:hover fieldset': {
                  borderColor: 'divider',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'text.secondary', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          {/* 右侧操作按钮 */}
          {currentView === 'installed' && (
            <>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                startIcon={<Add />}
                onClick={addLocalBinaryTool}
                sx={{ borderRadius: 2 }}
              >
                添加本地工具
              </Button>

              <Button
                variant={isSelectionMode ? 'contained' : 'text'}
                color={isSelectionMode ? 'primary' : 'inherit'}
                size="small"
                startIcon={<CheckBox />}
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  setSelectedToolIds(new Set());
                }}
                sx={{ borderRadius: 2 }}
              >
                管理
              </Button>
            </>
          )}

          {/* 排序选择器 */}
          <Select
            value={sortConfig.by}
            onChange={e =>
              setSortConfig(prev => ({ ...prev, by: e.target.value as ModuleSortConfig['by'] }))
            }
            size="small"
            sx={{
              minWidth: 110,
              borderRadius: 2,
              bgcolor: theme => (theme.palette as any).surfaceContainer,
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'transparent',
              },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
            }}
          >
            <MenuItem value="default">默认排序</MenuItem>
            <MenuItem value="name">按名称</MenuItem>
            <MenuItem value="updatedAt">最近使用</MenuItem>
          </Select>
        </Box>

        {/* 滚动内容区 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 3,
            py: 3,
            bgcolor: theme => (theme.palette as any).surfaceContainerLowest,
            '&::-webkit-scrollbar': {
              width: 6,
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: 'action.hover',
              borderRadius: 3,
            },
          }}
        >
          {/* 工具计数 */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            共 {finalModules.length} 个工具
          </Typography>

          {/* 工具卡片网格 */}
          {finalModules.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
              }}
            >
              <Typography variant="body1" color="text.secondary">
                {currentView === 'favorites'
                  ? '暂无收藏的工具'
                  : currentView === 'running'
                    ? '暂无运行中的工具'
                    : '没有找到匹配的工具'}
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2.5}>
              {finalModules.map(tool => (
                <Grid key={tool.id} size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 3 }}>
                  <ToolCard
                    tool={tool}
                    onOpen={handleOpen}
                    onStop={stopModule}
                    onInstall={handleInstall}
                    onUninstall={handleUninstall}
                    onToggleFavorite={handleToggleFavorite}
                    onClick={setSelectedModuleId}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedToolIds.has(tool.id)}
                    onSelect={handleSelect}
                    isInstalling={processingModuleId === tool.id}
                    isDev={isDevPlugin(tool.id)}
                  />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* 批量操作浮动栏 */}
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
