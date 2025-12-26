/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { alpha, useTheme } from '@mui/material/styles';
import {
  AddRounded,
  ArrowForwardRounded,
  HistoryRounded,
  PlayArrowRounded,
  SearchRounded,
  StarRounded,
  StopRounded,
} from '@mui/icons-material';
import type { ModuleInstance } from '@/types/module';
import { useModulePlatform } from '@/contexts/module-context';
import { useModuleEvents } from '@/hooks/use-module-events';
import { getGreeting, getShortDate } from '@/utils/greeting';
import { AppSegmentedControl, EmptyState } from '@/components/ui';
import { ActivityTimeline } from '@/components/ui/activity-timeline';
import { brandGradient, elevations, pulse, transitions, contentBg } from '@/theme/animations';
import { StaggerList, StaggerItem } from '@/components/motion';

type QuickView = 'favorites' | 'recent' | 'running';

export function HomePage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const {
    installedModules,
    favoriteModules,
    toolRegistry,
    availableTools,
    openModule,
    stopModule,
    addLocalBinaryTool,
  } = useModulePlatform();
  const { events, getRecentlyActiveModules } = useModuleEvents();

  const runningModules = useMemo(
    () => installedModules.filter(m => m.runtime.launchState === 'running'),
    [installedModules]
  );

  const recentModules = useMemo(
    () => getRecentlyActiveModules(installedModules, 12),
    [getRecentlyActiveModules, installedModules]
  );

  const recentEvents = useMemo(() => events.slice(0, 6), [events]);

  const updateAvailableCount = useMemo(
    () => installedModules.filter(m => m.runtime.updateAvailable).length,
    [installedModules]
  );

  const remoteAvailableCount = useMemo(() => {
    const installedToolIds = new Set(toolRegistry.filter(p => !p.isDev).map(p => p.id));
    return availableTools.filter(p => !installedToolIds.has(p.id)).length;
  }, [availableTools, toolRegistry]);

  const [quickView, setQuickView] = useState<QuickView>('favorites');
  const userSelectedRef = useRef(false);

  // 仅在数据长度变化且当前视图无内容时自动切换（不干预用户手动选择）
  useEffect(() => {
    // 用户手动选择过，不自动切换
    if (userSelectedRef.current) return;

    const hasItems =
      (quickView === 'favorites' && favoriteModules.length > 0) ||
      (quickView === 'recent' && recentModules.length > 0) ||
      (quickView === 'running' && runningModules.length > 0);

    // 如果当前视图有内容，不自动切换
    if (hasItems) return;

    // 只在当前视图无内容时，自动切换到有内容的视图
    setQuickView(
      favoriteModules.length > 0 ? 'favorites' : recentModules.length > 0 ? 'recent' : 'running'
    );
  }, [quickView, favoriteModules.length, recentModules.length, runningModules.length]);

  const quickModules = useMemo(() => {
    switch (quickView) {
      case 'favorites':
        return favoriteModules;
      case 'running':
        return runningModules;
      case 'recent':
        return recentModules;
      default:
        return favoriteModules;
    }
  }, [favoriteModules, quickView, recentModules, runningModules]);

  const displayedQuickModules = useMemo(() => quickModules.slice(0, 8), [quickModules]);

  return (
    <Box
      className="elegant-scroll"
      sx={{
        height: '100%',
        overflow: 'auto',
        // 添加内容区下沉效果，与工具页保持一致
        bgcolor: isDark ? contentBg.dark : contentBg.light,
        boxShadow: isDark ? 'inset 0 2px 8px rgba(0,0,0,0.4)' : 'inset 0 2px 6px rgba(0,0,0,0.06)',
      }}
    >
      <Box
        sx={{
          px: 4,
          py: 3,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.6fr) minmax(0, 1fr)' },
          gridTemplateRows: { lg: 'auto 1fr' },
          maxWidth: 1400,
          mx: 'auto',
        }}
      >
        {/* 左上：Hero */}
        <HeroCard
          title={getGreeting()}
          subtitle={`${getShortDate()} · BoolTox`}
          onOpenTools={() => navigate('/tools')}
          onOpenSources={() => navigate('/tools/sources')}
          onAddLocalTool={() => void addLocalBinaryTool()}
        />

        {/* 右上：概览 */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isDark ? alpha('#fff', 0.02) : 'background.paper',
            borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
            boxShadow: isDark ? elevations.card.idle.dark : elevations.card.idle.light,
            transition: transitions.hover,
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2),
              boxShadow: isDark ? elevations.card.hover.dark : elevations.card.hover.light,
            },
          }}
        >
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            概览
          </Typography>
          <Stack spacing={1.25}>
            <MetricRow label="已安装" value={installedModules.length} />
            <MetricRow label="收藏" value={favoriteModules.length} />
            <MetricRow label="运行中" value={runningModules.length} />
            <MetricRow label="可更新" value={updateAvailableCount} />
            <MetricRow label="可安装" value={remoteAvailableCount} />
          </Stack>
        </Paper>

        {/* 左下：快速启动 */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isDark ? alpha('#fff', 0.02) : 'background.paper',
            borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
            boxShadow: isDark ? elevations.card.idle.dark : elevations.card.idle.light,
            transition: transitions.hover,
            display: 'flex',
            flexDirection: 'column',
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2),
              boxShadow: isDark ? elevations.card.hover.dark : elevations.card.hover.light,
            },
          }}
        >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700}>
                  快速启动
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  收藏、最近使用、运行中工具的快捷入口
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 2 }}>
              <AppSegmentedControl<QuickView>
                value={quickView}
                onChange={view => {
                  userSelectedRef.current = true;
                  setQuickView(view);
                }}
                size="sm"
                options={[
                  {
                    value: 'favorites',
                    label: '收藏',
                    icon: <StarRounded sx={{ fontSize: 18 }} />,
                    badge: favoriteModules.length,
                  },
                  {
                    value: 'recent',
                    label: '最近',
                    icon: <HistoryRounded sx={{ fontSize: 18 }} />,
                    badge: recentModules.length,
                  },
                  {
                    value: 'running',
                    label: '运行中',
                    icon: <PlayArrowRounded sx={{ fontSize: 18 }} />,
                    badge: runningModules.length,
                  },
                ]}
              />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {displayedQuickModules.length > 0 ? (
                <Box
                  component={StaggerList}
                  sx={{
                    display: 'grid',
                    gap: 1.5,
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                  }}
                >
                  {displayedQuickModules.map((m, index) => (
                    <StaggerItem key={m.id} index={index}>
                      <HomeToolTile
                        module={m}
                        onOpen={() => void openModule(m.id)}
                        onStop={
                          m.runtime.launchState === 'running'
                            ? () => void stopModule(m.id)
                            : undefined
                        }
                      />
                    </StaggerItem>
                  ))}
                </Box>
              ) : installedModules.length === 0 ? (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EmptyState
                    title="这里还什么都没有"
                    description="先添加工具源或导入一个本地工具，然后就可以在这里一键启动。"
                    actions={
                      <>
                        <Button variant="contained" onClick={() => navigate('/tools/sources')}>
                          管理工具源
                        </Button>
                        <Button variant="outlined" onClick={() => void addLocalBinaryTool()}>
                          添加本地工具
                        </Button>
                      </>
                    }
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EmptyState
                    title="当前分组暂无内容"
                    description="换个分组看看，或者去工具库里收藏一些常用工具。"
                    actions={
                      <>
                        <Button variant="contained" onClick={() => navigate('/tools')}>
                          打开工具库
                        </Button>
                        <Button variant="outlined" onClick={() => setQuickView('favorites')}>
                          回到收藏
                        </Button>
                      </>
                    }
                  />
                </Box>
              )}
            </Box>
          </Paper>

        {/* 右下：最近操作 */}
        <Paper
          variant="outlined"
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isDark ? alpha('#fff', 0.02) : 'background.paper',
            borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
            boxShadow: isDark ? elevations.card.idle.dark : elevations.card.idle.light,
            transition: transitions.hover,
            '&:hover': {
              transform: 'translateY(-2px)',
              borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2),
              boxShadow: isDark ? elevations.card.hover.dark : elevations.card.hover.light,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              最近操作
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}
            >
              {recentEvents.length > 0 ? `最近 ${recentEvents.length} 条` : '暂无记录'}
            </Typography>
          </Box>

          {recentEvents.length > 0 ? (
            <ActivityTimeline events={recentEvents} maxItems={6} />
          ) : (
            <Typography variant="body2" color="text.secondary">
              你还没有做过任何操作。
            </Typography>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

function HeroCard({
  title,
  subtitle,
  onOpenTools,
  onOpenSources,
  onAddLocalTool,
}: {
  title: string;
  subtitle: string;
  onOpenTools: () => void;
  onOpenSources: () => void;
  onAddLocalTool: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const gradientValue = isDark ? brandGradient.dark : brandGradient.light;

  return (
    <Paper
      variant="outlined"
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: 3,
        borderRadius: 3,
        bgcolor: isDark ? alpha('#fff', 0.02) : 'background.paper',
        borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
        boxShadow: isDark ? elevations.card.idle.dark : elevations.card.idle.light,
        transition: transitions.hover,
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2),
          boxShadow: isDark ? elevations.card.hover.dark : elevations.card.hover.light,
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          inset: -120,
          background: gradientValue,
          opacity: isDark ? 0.16 : 0.12,
          filter: 'blur(80px)',
          transform: 'translate(40px, -40px)',
          pointerEvents: 'none',
        }}
      />

      <Stack spacing={2} sx={{ position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={800} sx={{ letterSpacing: -0.3 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
        </Box>

        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<SearchRounded />}
            onClick={onOpenTools}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            浏览工具
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddRounded />}
            onClick={onAddLocalTool}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            添加本地工具
          </Button>
          <Button
            variant="outlined"
            onClick={onOpenSources}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            工具源
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Box>
  );
}

function HomeToolTile({
  module,
  onOpen,
  onStop,
}: {
  module: ModuleInstance;
  onOpen: () => void;
  onStop?: () => void;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const isRunning = module.runtime.launchState === 'running';

  const gradientValue = isDark ? brandGradient.dark : brandGradient.light;

  return (
    <Box
      onClick={onOpen}
      sx={{
        position: 'relative',
        p: 2,
        borderRadius: 3,
        cursor: 'pointer',
        bgcolor: isDark ? alpha('#fff', 0.02) : '#ffffff',
        border: '1px solid',
        borderColor: isDark ? alpha('#fff', 0.06) : alpha('#000', 0.06),
        boxShadow: isDark ? elevations.card.idle.dark : elevations.card.idle.light,
        transition: transitions.hover,
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: isDark ? alpha('#fff', 0.12) : alpha(theme.palette.primary.main, 0.2),
          boxShadow: isDark ? elevations.card.hover.dark : elevations.card.hover.light,
        },
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2.5,
            background: isRunning
              ? gradientValue
              : isDark
                ? `linear-gradient(135deg, ${alpha('#fff', 0.08)} 0%, ${alpha('#fff', 0.04)} 100%)`
                : `linear-gradient(135deg, ${alpha('#000', 0.06)} 0%, ${alpha('#000', 0.02)} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isRunning ? '#fff' : isDark ? alpha('#fff', 0.7) : alpha('#000', 0.7),
            flexShrink: 0,
          }}
        >
          {module.definition.icon?.startsWith('http') ? (
            <Box
              component="img"
              src={module.definition.icon}
              alt=""
              sx={{ width: 26, height: 26, borderRadius: 1.5 }}
            />
          ) : (
            <Typography sx={{ fontSize: '1rem', fontWeight: 800 }}>
              {module.definition.icon || '•'}
            </Typography>
          )}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {module.definition.name}
            </Typography>
            {isRunning ? (
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#22C55E',
                  animation: `${pulse} 1.6s ease-in-out infinite`,
                }}
              />
            ) : null}
          </Box>
          <Typography variant="caption" color="text.secondary" noWrap>
            {module.definition.description || '暂无描述'}
          </Typography>
        </Box>

        {onStop ? (
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation();
              onStop();
            }}
            title="停止"
            sx={{
              width: 32,
              height: 32,
              borderRadius: 2,
              color: '#EF4444',
              bgcolor: alpha('#EF4444', 0.10),
              '&:hover': { bgcolor: alpha('#EF4444', 0.18) },
            }}
          >
            <StopRounded sx={{ fontSize: 18 }} />
          </IconButton>
        ) : (
          <ArrowForwardRounded sx={{ fontSize: 18, color: 'text.tertiary' }} />
        )}
      </Stack>
    </Box>
  );
}
