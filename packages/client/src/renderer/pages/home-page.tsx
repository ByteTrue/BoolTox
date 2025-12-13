/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useModulePlatform } from '@/contexts/module-context';
import { useTheme } from '../components/theme-provider';
import { useModuleStats } from '@/hooks/use-module-stats';
import { useModuleEvents } from '@/hooks/use-module-events';
import { getGreeting, getShortDate, getTimeEmoji } from '@/utils/greeting';
import { ModuleQuickCard } from '../components/ui/module-quick-card';
import { HorizontalScroll } from '../components/ui/horizontal-scroll';
import { ActivityFeed } from '../components/ui/activity-feed';
import { ActivityTimeline } from '../components/ui/activity-timeline';
import { SystemMonitor } from '../components/ui/system-monitor';
import { useMemo } from 'react';

export function HomePage() {
  const { theme } = useTheme();
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
    <div className="h-full overflow-y-auto px-8 py-6 space-y-8 elegant-scroll">
      {/* Hero 区域 */}
      <section className="rounded-2xl border p-8" style={{
        background: theme === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}>
        <div className="flex items-center justify-between">
          {/* 问候语 */}
          <div className="flex items-center gap-4">
            <span className="text-5xl">{getTimeEmoji()}</span>
            <div>
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {getGreeting()}
              </h1>
              <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                {getShortDate()}
              </p>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="flex gap-4">
            <StatCard label="已安装" value={stats.installed} icon="📦" theme={theme} />
            <StatCard label="运行中" value={stats.enabled} icon="✅" theme={theme} highlight />
            <StatCard label="远程可用" value={stats.remote} icon="🌐" theme={theme} />
          </div>
        </div>
      </section>

      {/* 最近使用 */}
      {recentModules.length > 0 && (
        <section>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            🚀 最近使用
          </h2>
          <HorizontalScroll gap={16}>
            {recentModules.map((module) => (
              <div key={module.id} className="w-[280px] flex-shrink-0">
                <ModuleQuickCard
                  module={module}
                  onClick={() => openModule(module.id)}
                />
              </div>
            ))}
          </HorizontalScroll>
        </section>
      )}

      {/* 公告 + 操作记录 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 公告 */}
        <ActivityFeed />

        {/* 操作记录 */}
        <div className="rounded-2xl border p-6" style={{
          background: theme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        }}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            📝 操作记录
          </h3>
          {recentEvents.length > 0 ? (
            <ActivityTimeline events={recentEvents} maxItems={5} />
          ) : (
            <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
              暂无操作记录
            </p>
          )}
        </div>
      </section>

      {/* 系统监控 */}
      <section className="rounded-2xl border p-6" style={{
        background: theme === 'dark'
          ? 'rgba(255, 255, 255, 0.05)'
          : 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(12px)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}>
        <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          💻 系统监控
        </h3>
        <SystemMonitor />
      </section>
    </div>
  );
}

// 统计卡片组件
function StatCard({
  label,
  value,
  icon,
  theme,
  highlight = false,
}: {
  label: string;
  value: number;
  icon: string;
  theme: 'light' | 'dark';
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-xl border px-6 py-4 min-w-[120px] transition-transform hover:scale-105"
      style={{
        background: highlight
          ? 'linear-gradient(135deg, rgba(101, 187, 233, 0.2) 0%, rgba(249, 193, 207, 0.2) 100%)'
          : theme === 'dark'
            ? 'rgba(255, 255, 255, 0.05)'
            : 'rgba(255, 255, 255, 0.6)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
