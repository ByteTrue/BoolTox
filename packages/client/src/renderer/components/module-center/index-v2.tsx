/**
 * ModuleCenter V2 - Material Design 3 现代化设计
 * 完整展示 MUI 的设计能力
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Fade from '@mui/material/Fade';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Search,
  Add,
  GridView,
  ViewList,
  FilterList,
  Sort,
} from '@mui/icons-material';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebarV2 } from './module-sidebar-v2';
import { ToolCardV2 } from './tool-card-v2';
import { DropZone } from './drop-zone';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import type { ModuleSortConfig } from './types';
import type { ModuleInstance } from '@/types/module';
import type { ToolSourceConfig } from '@booltox/shared';

export function ModuleCenterV2() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    installedModules,
    toolRegistry,
    availablePlugins,
    uninstallModule,
    installOnlinePlugin,
    openModule,
    stopModule,
    focusModuleWindow,
    addLocalBinaryTool,
    addFavorite,
    removeFavorite,
  } = useModulePlatform();

  // 状态
  const [currentView, setCurrentView] = useState<string>('installed');
  const [currentCategory, setCurrentCategory] = useState<string>('all');
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [processingModuleId, setProcessingModuleId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  // 数据处理
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
        }) as ModuleInstance
    );
  }, [availablePlugins, toolRegistry]);

  const officialTools = useMemo(() => {
    return allAvailableModules.filter(m => m.sourceId === 'official' && !m.runtime.installed);
  }, [allAvailableModules]);

  const runningCount = useMemo(() => {
    return installedModules.filter(m => m.runtime.launchState === 'running').length;
  }, [installedModules]);

  const displayedModulesRaw = useMemo(() => {
    switch (currentView) {
      case 'installed':
        return installedModules;
      case 'favorites':
        return installedModules.filter(m => m.isFavorite);
      case 'running':
        return installedModules.filter(m => m.runtime.launchState === 'running');
      case 'official':
        return officialTools;
      default:
        return installedModules;
    }
  }, [currentView, installedModules, officialTools]);

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
    return Array.from(categories).sort();
  }, [displayedModulesRaw]);

  // 回调
  const selectedModule = useMemo(() => {
    if (!selectedModuleId) return null;
    const installed = installedModules.find(m => m.id === selectedModuleId);
    if (installed) return installed;
    const online = availablePlugins.find(p => p.id === selectedModuleId);
    if (online) {
      return {
        id: online.id,
        definition: {
          id: online.id,
          name: online.name,
          description: online.description || '',
          version: online.version,
          category: online.category || 'utilities',
        },
        runtime: { installed: false, launchState: 'idle' as const },
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
  };

  // 获取视图标题
  const getViewTitle = () => {
    switch (currentView) {
      case 'installed':
        return '全部工具';
      case 'favorites':
        return '收藏的工具';
      case 'running':
        return '运行中';
      case 'official':
        return '官方工具库';
      default:
        return '工具';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
        bgcolor: isDark ? '#0a0a0b' : '#f8f9fa',
      }}
      onDragEnter={e => {
        e.preventDefault();
        if (e.dataTransfer.types?.includes('Files')) setIsDragActive(true);
      }}
      onDragOver={e => e.preventDefault()}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragActive(false);
      }}
      onDrop={e => {
        e.preventDefault();
        setIsDragActive(false);
        if (e.dataTransfer.files.length > 0) handleDrop(e.dataTransfer.files);
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
            bgcolor: alpha('#000', 0.7),
            backdropFilter: 'blur(8px)',
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 600 }}>
            <DropZone onDrop={handleDrop} onBrowse={addLocalBinaryTool} />
          </Box>
        </Box>
      </Fade>

      {/* 侧边栏 */}
      <ModuleSidebarV2
        currentView={currentView}
        currentCategory={currentCategory}
        onViewChange={handleViewChange}
        onCategoryChange={setCurrentCategory}
        onAddToolSource={() => navigate('/tools/add-source')}
        stats={{
          installed: installedModules.length,
          favorites: installedModules.filter(m => m.isFavorite).length,
          running: runningCount,
          official: officialTools.length,
        }}
        categories={availableCategories}
        toolSources={toolSources}
      />

      {/* 主内容区 */}
      <Box sx={{ display: 'flex', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        {/* 顶部工具栏 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 3,
            py: 2,
            borderBottom: 1,
            borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
            bgcolor: isDark ? alpha('#000', 0.2) : alpha('#fff', 0.8),
            backdropFilter: 'blur(20px)',
          }}
        >
          {/* 标题 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h5" fontWeight={700} color="text.primary">
              {getViewTitle()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {finalModules.length} 个工具
            </Typography>
          </Box>

          {/* 搜索框 */}
          <TextField
            placeholder="搜索工具..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            size="small"
            sx={{
              width: 280,
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                '& fieldset': { borderColor: 'transparent' },
                '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.3) },
                '&.Mui-focused fieldset': { borderColor: 'primary.main' },
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

          {/* 视图切换 */}
          <Stack direction="row" spacing={0.5}>
            <IconButton
              size="small"
              onClick={() => setViewMode('grid')}
              sx={{
                bgcolor: viewMode === 'grid' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
              }}
            >
              <GridView fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setViewMode('list')}
              sx={{
                bgcolor: viewMode === 'list' ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
              }}
            >
              <ViewList fontSize="small" />
            </IconButton>
          </Stack>

          {/* 排序 */}
          <Select
            value={sortConfig.by}
            onChange={e => setSortConfig(prev => ({ ...prev, by: e.target.value as any }))}
            size="small"
            startAdornment={<Sort sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />}
            sx={{
              minWidth: 130,
              borderRadius: 3,
              bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.03),
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
              '&:hover .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha(theme.palette.primary.main, 0.3),
              },
            }}
          >
            <MenuItem value="default">默认</MenuItem>
            <MenuItem value="name">名称</MenuItem>
            <MenuItem value="updatedAt">最近使用</MenuItem>
          </Select>

          {/* 添加按钮 */}
          {currentView === 'installed' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={addLocalBinaryTool}
              sx={{
                borderRadius: 3,
                textTransform: 'none',
                fontWeight: 600,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
                '&:hover': {
                  boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.4)}`,
                },
              }}
            >
              添加工具
            </Button>
          )}
        </Box>

        {/* 滚动内容区 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: 3,
            '&::-webkit-scrollbar': { width: 6 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? alpha('#fff', 0.1) : alpha('#000', 0.1),
              borderRadius: 3,
            },
          }}
        >
          {/* 快捷筛选标签 */}
          {currentView === 'installed' && availableCategories.length > 0 && (
            <Stack direction="row" spacing={1} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
              <Chip
                label="全部"
                onClick={() => setCurrentCategory('all')}
                variant={currentCategory === 'all' ? 'filled' : 'outlined'}
                color={currentCategory === 'all' ? 'primary' : 'default'}
                sx={{ borderRadius: 2, fontWeight: 500 }}
              />
              {availableCategories.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  onClick={() => setCurrentCategory(cat)}
                  variant={currentCategory === cat ? 'filled' : 'outlined'}
                  color={currentCategory === cat ? 'primary' : 'default'}
                  sx={{ borderRadius: 2, fontWeight: 500 }}
                />
              ))}
            </Stack>
          )}

          {/* 工具网格 */}
          {finalModules.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 400,
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 4,
                  bgcolor: isDark ? alpha('#fff', 0.05) : alpha('#000', 0.03),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FilterList sx={{ fontSize: 40, color: 'text.disabled' }} />
              </Box>
              <Typography variant="h6" color="text.secondary">
                {currentView === 'favorites'
                  ? '暂无收藏的工具'
                  : currentView === 'running'
                    ? '暂无运行中的工具'
                    : '没有找到匹配的工具'}
              </Typography>
              <Typography variant="body2" color="text.disabled">
                尝试调整筛选条件或添加新工具
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: 2.5,
              }}
            >
              {finalModules.map(tool => (
                <ToolCardV2
                  key={tool.id}
                  tool={tool}
                  onOpen={handleOpen}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={setSelectedModuleId}
                />
              ))}
            </Box>
          )}
        </Box>
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
