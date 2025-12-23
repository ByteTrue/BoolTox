/**
 * ModuleCenter V3 - Linear/Raycast 级别的极简设计
 * 原则：大量留白、高对比度、克制的色彩、精致的细节
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import { SearchRounded, AddRounded, KeyboardCommandKeyRounded } from '@mui/icons-material';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebarV3 } from './module-sidebar-v3';
import { ToolCardV3 } from './tool-card-v3';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import type { ModuleSortConfig } from './types';
import type { ModuleInstance } from '@/types/module';
import type { ToolSourceConfig } from '@booltox/shared';

export function ModuleCenterV3() {
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
  const { inputValue, debouncedValue, setInputValue } = useSearchInput();
  const [sortConfig] = useState<ModuleSortConfig>({ by: 'default', order: 'asc' });
  const [toolSources, setToolSources] = useState<ToolSourceConfig[]>([]);

  useEffect(() => {
    const loadToolSources = async () => {
      try {
        const sources = (await window.ipc.invoke('tool-sources:list')) as ToolSourceConfig[] | undefined;
        setToolSources(sources || []);
      } catch {
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
            icon: plugin.icon || '',
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

  // 回调函数
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
        if (onlinePlugin) await installOnlinePlugin(onlinePlugin);
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
      if (module.isFavorite) void removeFavorite(moduleId);
      else void addFavorite(moduleId);
    },
    [installedModules, addFavorite, removeFavorite]
  );

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setCurrentCategory('all');
  };

  const getViewTitle = () => {
    switch (currentView) {
      case 'installed': return '全部工具';
      case 'favorites': return '收藏';
      case 'running': return '运行中';
      case 'official': return '官方市场';
      default: return '工具';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        // 基础背景色（与侧边栏同色，作为底层）
        bgcolor: isDark ? '#0c0c0e' : '#f5f5f7',
      }}
    >
      {/* 侧边栏 */}
      <ModuleSidebarV3
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
      />

      {/* 主内容区 */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          overflow: 'hidden',
          // 主内容区使用稍亮的背景，与侧边栏形成层次
          bgcolor: isDark ? '#111113' : '#ffffff',
          // 左侧内阴影，创造"嵌入"效果
          boxShadow: isDark
            ? 'inset 4px 0 12px -4px rgba(0,0,0,0.3)'
            : 'inset 4px 0 12px -4px rgba(0,0,0,0.06)',
          // 圆角让边缘更柔和
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      >
        {/* 顶部栏 - 毛玻璃效果 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            px: 4,
            py: 2.5,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            // 毛玻璃效果
            bgcolor: isDark ? alpha('#111113', 0.8) : alpha('#ffffff', 0.8),
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            // 继承主内容区的左上圆角
            borderTopLeftRadius: 16,
          }}
        >
          {/* 标题 */}
          <Box>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.02em' }}
            >
              {getViewTitle()}
            </Typography>
          </Box>

          <Box sx={{ flex: 1 }} />

          {/* 搜索框 */}
          <TextField
            placeholder="搜索..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            size="small"
            sx={{
              width: 240,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#000', 0.03),
                '& fieldset': { border: 'none' },
                '&:hover': { bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04) },
                '&.Mui-focused': { bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.04) },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.8125rem',
                '&::placeholder': { color: 'text.tertiary', opacity: 1 },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded sx={{ fontSize: 18, color: 'text.tertiary' }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Stack direction="row" spacing={0.25} sx={{ opacity: 0.5 }}>
                    <KeyboardCommandKeyRounded sx={{ fontSize: 14 }} />
                    <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>K</Typography>
                  </Stack>
                </InputAdornment>
              ),
            }}
          />

          {/* 添加按钮 */}
          {currentView === 'installed' && (
            <IconButton
              onClick={addLocalBinaryTool}
              sx={{
                width: 36,
                height: 36,
                borderRadius: 2,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <AddRounded sx={{ fontSize: 20 }} />
            </IconButton>
          )}
        </Box>

        {/* 内容区 */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            px: 4,
            py: 3,
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
              borderRadius: 4,
              '&:hover': {
                bgcolor: isDark ? alpha('#fff', 0.12) : alpha('#000', 0.12),
              },
            },
          }}
        >
          {/* 统计信息 */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mb: 2,
              color: 'text.tertiary',
              fontWeight: 500,
            }}
          >
            {finalModules.length} 个工具
          </Typography>

          {/* 工具列表 */}
          {finalModules.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
                gap: 1.5,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {currentView === 'favorites'
                  ? '没有收藏的工具'
                  : currentView === 'running'
                    ? '没有运行中的工具'
                    : '没有找到工具'}
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              {finalModules.map(tool => (
                <ToolCardV3
                  key={tool.id}
                  tool={tool}
                  onOpen={handleOpen}
                  onStop={stopModule}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={setSelectedModuleId}
                />
              ))}
            </Stack>
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
