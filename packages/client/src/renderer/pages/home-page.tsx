/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useModulePlatform } from '@/contexts/module-context';
import { useModuleStats } from '@/hooks/use-module-stats';
import { useModuleEvents } from '@/hooks/use-module-events';
import { getGreeting, getShortDate, getTimeEmoji } from '@/utils/greeting';
import { ModuleQuickCard } from '../components/ui/module-quick-card';
import { createGridSx, GRID_BREAKPOINTS } from '@/theme/grid-config';
import { ActivityFeed } from '../components/ui/activity-feed';
import { ActivityTimeline } from '../components/ui/activity-timeline';
import { SystemMonitor } from '../components/ui/system-monitor';

export function HomePage() {
  const { installedModules, openModule } = useModulePlatform();
  const stats = useModuleStats();
  const { events, getRecentlyActiveModules } = useModuleEvents();

  // 最近使用的模块（最多 6 个）
  const recentModules = useMemo(
    () => getRecentlyActiveModules(installedModules, 6),
    [installedModules, getRecentlyActiveModules]
  );

  // 最近 5 条事件
  const recentEvents = useMemo(() => events.slice(0, 5), [events]);

  return (
    <Box sx={{ height: '100%', overflow: 'auto', px: 4, py: 3 }}>
      <Stack spacing={4}>
        {/* Hero 区域 - 问候语 */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h2" component="span">
              {getTimeEmoji()}
            </Typography>
            <Typography variant="h3" fontWeight="700">
              {getGreeting()}
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            {getShortDate()}
          </Typography>
        </Box>

        {/* 统计卡片 Grid */}
        <Box sx={createGridSx(GRID_BREAKPOINTS.STAT_CARD)}>
          <StatCard label="已安装" value={stats.installed} icon="📦" />
          <StatCard label="运行中" value={stats.enabled} icon="✅" highlight />
          <StatCard label="远程可用" value={stats.remote} icon="🌐" />
        </Box>

        {/* 最近使用 - Grid 布局 */}
        {recentModules.length > 0 && (
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              🚀 最近使用
            </Typography>
            <Box sx={createGridSx(GRID_BREAKPOINTS.QUICK_LAUNCH, 'TIGHT')}>
              {recentModules.map(module => (
                <ModuleQuickCard
                  key={module.id}
                  module={module}
                  onClick={() => openModule(module.id)}
                />
              ))}
            </Box>
          </Box>
        )}

        {/* 公告 + 操作记录 */}
        <Box sx={createGridSx(GRID_BREAKPOINTS.TWO_COLUMN)}>
          {/* 公告 */}
          <ActivityFeed />

          {/* 操作记录 */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              📝 操作记录
            </Typography>
            {recentEvents.length > 0 ? (
              <ActivityTimeline events={recentEvents} maxItems={5} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                暂无操作记录
              </Typography>
            )}
          </Paper>
        </Box>

        {/* 系统监控 */}
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            💻 系统监控
          </Typography>
          <SystemMonitor />
        </Paper>
      </Stack>
    </Box>
  );
}

// 统计卡片组件
function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        transition: 'all 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: highlight ? 8 : 4,
        },
        ...(highlight && {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '& .MuiTypography-root': {
            color: 'inherit',
          },
        }),
      }}
      elevation={highlight ? 4 : 1}
    >
      <Stack spacing={1}>
        <Typography variant="h4" component="div">
          {icon}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            textTransform: 'uppercase',
            letterSpacing: 1.2,
            fontWeight: 600,
            color: highlight ? 'inherit' : 'text.secondary',
          }}
        >
          {label}
        </Typography>
        <Typography variant="h4" fontWeight="700">
          {value}
        </Typography>
      </Stack>
    </Paper>
  );
}
