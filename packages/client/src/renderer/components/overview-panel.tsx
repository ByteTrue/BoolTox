/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import { useModulePlatform } from '@/contexts/module-context';
import { useModuleStats } from '@/hooks/use-module-stats';
import { useModuleEvents } from '@/hooks/use-module-events';
import { getGreeting, getShortDate, getTimeEmoji } from '@/utils/greeting';
import { ActivityTimeline } from './ui/activity-timeline';
import { ModuleQuickCard } from './ui/module-quick-card';
import { HorizontalScroll } from './ui/horizontal-scroll';
import { ActivityFeed } from './ui/activity-feed';
import { SystemMonitor } from './ui/system-monitor';
import { History } from 'lucide-react';
import { ActivityHistoryDrawer } from './ui/activity-history-drawer';
import type { ModuleInstance } from '@/types/module';
import type { ModuleEvent } from '@/utils/module-event-logger';

/**
 * 概览面板主组件
 * 完整的模块系统仪表盘，包含：
 * 1. Hero 快速操作区
 * 2. 最近使用模块
 * 3. 系统运行状态仪表盘
 * 4. 快速启动面板
 * 5. 推荐与发现
 */
export function OverviewPanel() {
  const { installedModules, openModule } = useModulePlatform();
  const stats = useModuleStats();
  const { events, getRecentlyActiveModules } = useModuleEvents();

  // 最近使用的模块
  const recentModules = useMemo(
    () => getRecentlyActiveModules(installedModules, 5),
    [installedModules, getRecentlyActiveModules]
  );

  // 最近10条事件
  const recentEvents = useMemo(() => events.slice(0, 10), [events]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 1. Hero 快速操作区 */}
      <HeroSection stats={stats} />

      {/* 2. 公告 + 操作记录 (两列布局) */}
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
        }}
      >
        {/* 左侧：公告 */}
        <ActivityFeed />

        {/* 右侧：操作记录 */}
        <ActivityRecordBrief events={recentEvents} />
      </Box>

      {/* 3. 系统监控 (独占) */}
      <SystemMonitorSection />

      {/* 4. 最近使用模块 */}
      {recentModules.length > 0 && (
        <RecentModulesSection
          modules={recentModules}
          onModuleClick={id => {
            void openModule(id);
          }}
        />
      )}

      {/* 5. 推荐与发现 */}
      <DiscoverySection />
    </Box>
  );
}

/**
 * Hero 区域：问候语 + 核心统计 + 快速操作
 */
function HeroSection({ stats }: { stats: ReturnType<typeof useModuleStats> }) {
  return (
    <Fade in timeout={400}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: 4,
          '&:hover': {
            boxShadow: 2,
          },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'flex-start', lg: 'center' },
            justifyContent: 'space-between',
            gap: 3,
          }}
        >
          {/* 左侧：问候语 */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Typography variant="h3" component="span">
                {getTimeEmoji()}
              </Typography>
              <Box>
                <Typography variant="h4" fontWeight={700}>
                  {getGreeting()}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {getShortDate()}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* 右侧：核心统计卡片 */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <StatCard label="已安装" value={stats.installed} icon="📦" />
            <StatCard label="运行中" value={stats.enabled} icon="✅" highlight />
            <StatCard label="远程可用" value={stats.remote} icon="🌐" />
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}

/**
 * 统计卡片
 */
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
      variant="outlined"
      sx={{
        borderRadius: 2,
        px: 3,
        py: 2,
        minWidth: 120,
        bgcolor: highlight ? 'primary.main' : 'background.paper',
        color: highlight ? 'primary.contrastText' : 'text.primary',
        '&:hover': {
          transform: 'scale(1.03)',
          boxShadow: 2,
        },
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
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
              opacity: highlight ? 0.9 : 0.7,
            }}
          >
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

/**
 * 最近使用模块区域
 */
function RecentModulesSection({
  modules,
  onModuleClick,
}: {
  modules: ModuleInstance[];
  onModuleClick: (id: string) => void;
}) {
  return (
    <Box component="section">
      <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
        🚀 最近使用
      </Typography>
      <HorizontalScroll gap={16}>
        {modules.map(module => (
          <Box key={module.id} sx={{ width: 280, flexShrink: 0 }}>
            <ModuleQuickCard module={module} onClick={() => onModuleClick(module.id)} />
          </Box>
        ))}
      </HorizontalScroll>
    </Box>
  );
}

/**
 * 操作记录简要组件
 * 显示最近的操作记录，支持查看历史
 */
function ActivityRecordBrief({ events }: { events: ModuleEvent[] }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const latestEvent = events[0];

  if (!latestEvent) {
    return (
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          '&:hover': { boxShadow: 2 },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          📝 操作记录
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            暂无操作记录
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          '&:hover': { boxShadow: 2 },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            📝 操作记录
          </Typography>
          <Button
            size="small"
            startIcon={<History size={14} />}
            onClick={() => setIsDrawerOpen(true)}
            sx={{ textTransform: 'none', fontWeight: 500 }}
          >
            查看历史
          </Button>
        </Box>

        <Box sx={{ flex: 1 }}>
          <ActivityTimeline events={[latestEvent]} maxItems={1} />
        </Box>

        {events.length > 1 && (
          <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
            共 {events.length} 条记录
          </Typography>
        )}
      </Paper>

      {/* 历史记录 Drawer */}
      <ActivityHistoryDrawer
        open={isDrawerOpen}
        events={events}
        onClose={() => setIsDrawerOpen(false)}
      />
    </>
  );
}

/**
 * 系统监控区域（独占）
 */
function SystemMonitorSection() {
  return (
    <Box component="section">
      <Paper
        variant="outlined"
        sx={{
          borderRadius: 3,
          p: 3,
          '&:hover': { boxShadow: 2 },
          transition: 'box-shadow 0.2s',
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          💻 系统监控
        </Typography>
        <SystemMonitor />
      </Paper>
    </Box>
  );
}

/**
 * 推荐与发现区域
 */
function DiscoverySection() {
  // 暂时不显示推荐,等待新的工具商店实现
  return null;
}
