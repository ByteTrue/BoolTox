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
import { HorizontalScroll } from '../components/ui/horizontal-scroll';
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
        {/* Hero 区域 */}
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {/* 问候语 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h2" component="span">
                {getTimeEmoji()}
              </Typography>
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  {getGreeting()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {getShortDate()}
                </Typography>
              </Box>
            </Box>

            {/* 统计卡片 */}
            <Stack direction="row" spacing={2}>
              <StatCard label="已安装" value={stats.installed} icon="📦" />
              <StatCard label="运行中" value={stats.enabled} icon="✅" highlight />
              <StatCard label="远程可用" value={stats.remote} icon="🌐" />
            </Stack>
          </Box>
        </Paper>

        {/* 最近使用 */}
        {recentModules.length > 0 && (
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              🚀 最近使用
            </Typography>
            <HorizontalScroll gap={16}>
              {recentModules.map(module => (
                <Box key={module.id} sx={{ width: 280, flexShrink: 0 }}>
                  <ModuleQuickCard module={module} onClick={() => openModule(module.id)} />
                </Box>
              ))}
            </HorizontalScroll>
          </Box>
        )}

        {/* 公告 + 操作记录 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
          }}
        >
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
        px: 3,
        py: 2,
        minWidth: 120,
        borderRadius: 2,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.05)' },
        ...(highlight && {
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          '& .MuiTypography-root': {
            color: 'inherit',
          },
        }),
      }}
      elevation={highlight ? 3 : 1}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Typography variant="h5" component="span">
          {icon}
        </Typography>
        <Box>
          <Typography
            variant="caption"
            sx={{
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: highlight ? 'inherit' : 'text.secondary',
            }}
          >
            {label}
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
