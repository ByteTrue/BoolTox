/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import { Search, Zap, Grid, Settings, Home } from 'lucide-react';
import type { ToolRuntime } from '@booltox/shared';

type QuickPanelTool = ToolRuntime & { isFavorite?: boolean };

export function QuickPanel() {
  const [query, setQuery] = useState('');
  const [installedModules, setInstalledModules] = useState<QuickPanelTool[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  // 自动聚焦搜索框
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 加载已安装工具（通过 IPC，不依赖 Context）
  useEffect(() => {
    const loadModules = async () => {
      try {
        const modules = await (
          window.tool as unknown as { getAll?: () => Promise<QuickPanelTool[]> }
        ).getAll?.();
        setInstalledModules(modules ?? []);
      } catch (error) {
        console.error('[QuickPanel] 加载工具列表失败', error);
      }
    };

    loadModules();
  }, []);

  // 收藏的工具（最多 6 个）
  const favorites = useMemo(
    () => installedModules.filter(m => m.isFavorite).slice(0, 6),
    [installedModules]
  );

  // 搜索过滤
  const filteredModules = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    return installedModules.filter(module => {
      const name = module.manifest?.name?.toLowerCase() ?? '';
      const desc = module.manifest?.description?.toLowerCase() ?? '';
      return name.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  }, [query, installedModules]);

  // 快速操作
  const quickActions = [
    {
      id: 'show-main',
      label: '显示主窗口',
      icon: <Home size={16} />,
      action: () => window.quickPanel?.showMain(),
    },
    {
      id: 'tools',
      label: '打开工具商店',
      icon: <Grid size={16} />,
      action: () => window.quickPanel?.navigateTo('/tools'),
    },
    {
      id: 'settings',
      label: '打开设置',
      icon: <Settings size={16} />,
      action: () => window.quickPanel?.navigateTo('/settings'),
    },
  ];

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.quickPanel?.hide();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 处理工具点击
  const handleToolClick = async (toolId: string) => {
    try {
      await window.tool?.start(toolId);
      window.quickPanel?.hide();
    } catch (error) {
      console.error('启动工具失败', error);
    }
  };

  // 处理快速操作点击
  const handleActionClick = (action: () => void) => {
    action();
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Paper
        elevation={24}
        sx={{
          width: '100%',
          maxWidth: 640,
          borderRadius: 4,
          overflow: 'hidden',
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(-20px)',
          transition: 'all 0.2s',
        }}
      >
        {/* 搜索框 */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ position: 'relative' }}>
            <Search
              size={20}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--mui-palette-text-secondary)',
              }}
            />
            <InputBase
              inputRef={inputRef}
              placeholder="搜索工具或操作..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              sx={{
                width: '100%',
                pl: 6,
                pr: 2,
                py: 1.5,
                fontSize: '1.125rem',
                border: 1,
                borderColor: 'divider',
                borderRadius: 3,
                bgcolor: 'action.hover',
                '&:focus-within': {
                  borderColor: 'primary.main',
                },
              }}
            />
          </Box>
        </Box>

        {/* 内容区 */}
        <Box className="elegant-scroll" sx={{ p: 3, maxHeight: 500, overflowY: 'auto' }}>
          {query ? (
            // 搜索结果
            <Stack spacing={1}>
              {filteredModules.length > 0 ? (
                filteredModules.map(module => (
                  <ButtonBase
                    key={module.id}
                    onClick={() => handleToolClick(module.id)}
                    sx={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      p: 1.5,
                      borderRadius: 2,
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      '&:hover': {
                        bgcolor: 'action.hover',
                      },
                    }}
                  >
                    <Typography variant="h3">{module.manifest.icon || '🔧'}</Typography>
                    <Box flex={1}>
                      <Typography variant="body1" fontWeight={600}>
                        {module.manifest.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {module.manifest.description}
                      </Typography>
                    </Box>
                    {module.status === 'running' && (
                      <Chip
                        label="运行中"
                        size="small"
                        color="success"
                        sx={{
                          '& .MuiChip-label': {
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          },
                        }}
                        icon={
                          <Box
                            component="span"
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: 'success.main',
                              animation: 'pulse 2s infinite',
                              '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.5 },
                              },
                            }}
                          />
                        }
                      />
                    )}
                  </ButtonBase>
                ))
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">没有找到匹配的工具</Typography>
                </Box>
              )}
            </Stack>
          ) : (
            // 默认视图
            <Stack spacing={3}>
              {/* 收藏的工具 */}
              {favorites.length > 0 && (
                <Box>
                  <Typography
                    variant="overline"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
                  >
                    ★ 收藏的工具
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1,
                    }}
                  >
                    {favorites.map(module => (
                      <ButtonBase
                        key={module.id}
                        onClick={() => handleToolClick(module.id)}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 1,
                          p: 2,
                          borderRadius: 3,
                          transition: 'all 0.2s',
                          '&:hover': {
                            bgcolor: 'action.hover',
                            '& [data-tool-icon]': {
                              transform: 'scale(1.1)',
                            },
                          },
                        }}
                      >
                        <Typography
                          data-tool-icon
                          variant="h2"
                          sx={{ transition: 'transform 0.2s' }}
                        >
                          {module.manifest.icon || '🔧'}
                        </Typography>
                        <Typography
                          variant="body2"
                          textAlign="center"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            width: '100%',
                          }}
                        >
                          {module.manifest.name}
                        </Typography>
                      </ButtonBase>
                    ))}
                  </Box>
                </Box>
              )}

              {/* 快速操作 */}
              <Box>
                <Typography
                  variant="overline"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
                >
                  <Zap size={14} />
                  快速操作
                </Typography>
                <Stack spacing={0.5}>
                  {quickActions.map(action => (
                    <ButtonBase
                      key={action.id}
                      onClick={() => handleActionClick(action.action)}
                      sx={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 1.5,
                        borderRadius: 2,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      {action.icon}
                      <Typography variant="body2">{action.label}</Typography>
                    </ButtonBase>
                  ))}
                </Stack>
              </Box>

              {/* 提示 */}
              <Box>
                <Divider />
                <Typography
                  variant="caption"
                  color="text.disabled"
                  textAlign="center"
                  sx={{ display: 'block', mt: 2 }}
                >
                  按{' '}
                  <Chip
                    label="ESC"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      bgcolor: 'action.selected',
                    }}
                  />{' '}
                  关闭
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
