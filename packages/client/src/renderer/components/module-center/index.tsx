/**
 * ModuleCenter - Linear/Raycast 级别的极简设计
 * 原则：大量留白、高对比度、克制的色彩、精致的细节
 */

import { useState, useMemo, useCallback } from 'react';
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
import { sidebarBg, contentBg } from '@/theme/animations';
import { ModuleDetailModal } from './module-detail-modal';
import { ModuleSidebar } from './module-sidebar';
import { ToolCard } from './tool-card';
import { useModuleSearch, useSearchInput } from './hooks/use-module-search';
import { useModuleSort } from './hooks/use-module-sort';
import type { ModuleInstance } from '@/types/module';

// 默认排序配置（不需要状态，因为不会改变）
const DEFAULT_SORT_CONFIG = { by: 'default' as const, order: 'asc' as const };

export function ModuleCenter() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const {
    installedModules,
    toolRegistry,
    availableTools,
    uninstallModule,
    installOnlineTool,
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

  // 数据处理
  const allAvailableModules = useMemo(() => {
    return availableTools.map(
      tool =>
        ({
          id: tool.id,
          definition: {
            id: tool.id,
            name: tool.name,
            description: tool.description || '',
            version: tool.version,
            category: tool.category || 'utilities',
            keywords: tool.keywords || [],
            icon: tool.icon || '',
            screenshots: tool.screenshots || [],
            installedByDefault: false,
            source: 'remote' as const,
            runtime: tool.runtime,
          },
          runtime: {
            component: null,
            loading: false,
            error: null,
            installed: toolRegistry.some(t => t.id === tool.id),
            launchState: 'idle' as const,
            lastError: null,
          },
          isFavorite: false,
          sourceId: tool.sourceId || 'unknown',
        }) as ModuleInstance
    );
  }, [availableTools, toolRegistry]);

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
  const finalModules = useModuleSort(searchedModules, DEFAULT_SORT_CONFIG);

  // 分类统计：只显示当前视图中工具的分类，避免显示空分类
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
    const online = availableTools.find(p => p.id === selectedModuleId);
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
  }, [selectedModuleId, installedModules, availableTools]);

  const isSelectedModuleInstalled = useMemo(() => {
    return installedModules.some(m => m.id === selectedModuleId);
  }, [selectedModuleId, installedModules]);

  const handleInstall = useCallback(
    async (moduleId: string) => {
      setProcessingModuleId(moduleId);
      try {
        const onlineTool = availableTools.find(p => p.id === moduleId);
        if (onlineTool) await installOnlineTool(onlineTool);
      } finally {
        setProcessingModuleId(null);
      }
    },
    [installOnlineTool, availableTools]
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
      case 'installed':
        return '全部工具';
      case 'favorites':
        return '收藏';
      case 'running':
        return '运行中';
      case 'official':
        return '官方市场';
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
        // 侧边栏层（中间层）
        bgcolor: isDark ? sidebarBg.dark : sidebarBg.light,
      }}
    >
      {/* 侧边栏 */}
      <ModuleSidebar
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

      {/* 主内容区 - 下沉层（最暗） */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          overflow: 'hidden',
          // 内容区下沉：比侧边栏更暗
          bgcolor: isDark ? contentBg.dark : contentBg.light,
          // 内阴影增强下沉感
          boxShadow: isDark
            ? 'inset 0 2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 2px 6px rgba(0,0,0,0.06)',
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
            // 毛玻璃效果（匹配下沉的内容区背景）
            bgcolor: isDark ? alpha(contentBg.dark, 0.8) : alpha(contentBg.light, 0.85),
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

          {/* 搜索框 - Focus 发光动画 */}
          <TextField
            placeholder="搜索..."
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            size="small"
            sx={{
              width: 240,
              transition: 'width 0.2s ease',
              '&:focus-within': {
                width: 280,
              },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2.5,
                bgcolor: isDark ? alpha('#fff', 0.04) : '#ffffff',
                border: '1px solid',
                borderColor: isDark ? 'transparent' : alpha('#000', 0.08),
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '& fieldset': { border: 'none' },
                '&:hover': {
                  bgcolor: isDark ? alpha('#fff', 0.06) : '#ffffff',
                  borderColor: isDark ? alpha('#fff', 0.1) : alpha(theme.palette.primary.main, 0.3),
                },
                '&.Mui-focused': {
                  bgcolor: isDark ? alpha('#fff', 0.06) : '#ffffff',
                  borderColor: 'primary.main',
                  boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.12)}, 0 0 16px ${alpha(theme.palette.primary.main, 0.08)}`,
                },
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
                    <Typography variant="caption" sx={{ fontSize: '0.6875rem' }}>
                      K
                    </Typography>
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
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  onOpen={handleOpen}
                  onStop={stopModule}
                  onInstall={handleInstall}
                  onToggleFavorite={handleToggleFavorite}
                  onClick={setSelectedModuleId}
                  isInstalling={processingModuleId === tool.id}
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
