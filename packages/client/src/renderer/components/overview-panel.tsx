import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useModulePlatform } from '@/contexts/module-context';
import { useTheme } from './theme-provider';
import { useModuleStats } from '@/hooks/use-module-stats';
import { useModuleEvents } from '@/hooks/use-module-events';
import { getGreeting, getShortDate, getTimeEmoji } from '@/utils/greeting';
import { getGlassStyle, getGlassShadow } from '@/utils/glass-layers';
import { cardHover } from '@/utils/animation-presets';
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
  const { theme } = useTheme();
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
    <div className="space-y-8">
      {/* 1. Hero 快速操作区 */}
      <HeroSection stats={stats} theme={theme} />

      {/* 2. 公告 + 操作记录 (两列布局) */}
      <section className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* 左侧：公告 */}
        <ActivityFeed />
        
        {/* 右侧：操作记录 */}
        <ActivityRecordBrief events={recentEvents} theme={theme} />
      </section>

      {/* 3. 系统监控 (独占) */}
      <SystemMonitorSection theme={theme} />

      {/* 4. 最近使用模块 */}
      {recentModules.length > 0 && (
        <RecentModulesSection
          modules={recentModules}
          onModuleClick={(id) => {
            void openModule(id);
          }}
          theme={theme}
        />
      )}

      {/* 5. 推荐与发现 */}
      <DiscoverySection />
    </div>
  );
}

/**
 * Hero 区域：问候语 + 核心统计 + 快速操作
 */
function HeroSection({
  stats,
  theme,
}: {
  stats: ReturnType<typeof useModuleStats>;
  theme: 'light' | 'dark';
}) {
  return (
    <motion.div
      {...cardHover}
      className={`rounded-3xl border p-8 transition-shadow duration-250 ease-swift hover:shadow-lg ${getGlassShadow(theme)}`}
      style={getGlassStyle('CARD', theme)}
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* 左侧：问候语 */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">
              {getTimeEmoji()}
            </span>
            <div>
              <h1
                className={`text-3xl font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                {getGreeting()}
              </h1>
              <p
                className={`text-sm mt-1 ${
                  theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                }`}
              >
                {getShortDate()}
              </p>
            </div>
          </div>
        </div>

        {/* 右侧：核心统计卡片 */}
        <div className="flex flex-wrap gap-4">
          <StatCard
            label="已安装"
            value={stats.installed}
            icon="📦"
            theme={theme}
          />
          <StatCard
            label="运行中"
            value={stats.enabled}
            icon="✅"
            theme={theme}
            highlight
          />
          <StatCard
            label="远程可用"
            value={stats.remote}
            icon="🌐"
            theme={theme}
          />
        </div>
      </div>

      {/* 快速操作按钮 - 已移除 Spotlight 搜索 */}
    </motion.div>
  );
}

/**
 * 统计卡片
 */
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
    <motion.div
      {...cardHover}
      className={`rounded-2xl border px-6 py-4 min-w-[120px] transition-[shadow,transform] duration-250 ease-swift hover:scale-[1.03] ${
        highlight
          ? 'bg-gradient-to-br from-brand-blue-300/20 to-brand-blue-400/20'
          : ''
      }`}
      style={{
        ...getGlassStyle('BUTTON', theme, {
          withBorderGlow: true,
          withInnerShadow: true,
        }),
        // 增强统计卡片的浮起感
        boxShadow: theme === 'dark'
          ? '0 3px 10px rgba(0, 0, 0, 0.35), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
          : '0 3px 14px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
      }}
      whileHover={{
        boxShadow: theme === 'dark'
          ? '0 6px 20px rgba(0, 0, 0, 0.45), 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)'
          : '0 6px 24px rgba(0, 0, 0, 0.14), 0 0.5px 0 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p
            className={`text-xs uppercase tracking-wider ${
              theme === 'dark' ? 'text-white/60' : 'text-slate-500'
            }`}
          >
            {label}
          </p>
          <p
            className={`text-2xl font-bold mt-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * 最近使用模块区域
 */
function RecentModulesSection({
  modules,
  onModuleClick,
  theme,
}: {
  modules: ModuleInstance[];
  onModuleClick: (id: string) => void;
  theme: 'light' | 'dark';
}) {
  return (
    <section>
      <h2
        className={`text-xl font-bold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-slate-800'
        }`}
      >
        🚀 最近使用
      </h2>
      <HorizontalScroll gap={16}>
        {modules.map((module) => (
          <div key={module.id} className="w-[280px] flex-shrink-0">
            <ModuleQuickCard
              module={module}
              onClick={() => onModuleClick(module.id)}
            />
          </div>
        ))}
      </HorizontalScroll>
    </section>
  );
}

/**
 * 操作记录简要组件
 * 显示最近的操作记录，支持查看历史
 */
function ActivityRecordBrief({
  events,
  theme,
}: {
  events: ModuleEvent[];
  theme: 'light' | 'dark';
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  const latestEvent = events[0];

  if (!latestEvent) {
    return (
      <motion.div
        {...cardHover}
        className={`rounded-3xl border p-6 flex flex-col transition-shadow duration-250 ease-swift hover:shadow-lg ${getGlassShadow(theme)}`}
        style={getGlassStyle('PANEL', theme)}
      >
        <h3
          className={`text-lg font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          📝 操作记录
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <p
            className={`text-sm ${
              theme === 'dark' ? 'text-white/60' : 'text-slate-500'
            }`}
          >
            暂无操作记录
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        {...cardHover}
        className={`rounded-3xl border p-6 flex flex-col transition-shadow duration-250 ease-swift hover:shadow-lg ${getGlassShadow(theme)}`}
        style={getGlassStyle('PANEL', theme)}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className={`text-lg font-bold ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            📝 操作记录
          </h3>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-[transform,background-color,box-shadow] duration-150 ease-swift hover:scale-105 ${
              theme === 'dark'
                ? 'text-white/90 hover:text-white'
                : 'text-slate-800 hover:text-slate-900'
            }`}
            style={{
              ...getGlassStyle('BUTTON', theme, {
                withBorderGlow: true,
                withInnerShadow: true,
              }),
              // 增强按钮的浮起感
              boxShadow: theme === 'dark'
                ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
            }}
          >
            <History className="h-3 w-3" />
            查看历史
          </button>
        </div>

        <div className="flex-1">
          <ActivityTimeline events={[latestEvent]} maxItems={1} />
        </div>

        {events.length > 1 && (
          <div
            className={`mt-4 text-center text-xs ${
              theme === 'dark' ? 'text-white/50' : 'text-slate-500'
            }`}
          >
            共 {events.length} 条记录
          </div>
        )}
      </motion.div>

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
function SystemMonitorSection({
  theme,
}: {
  theme: 'light' | 'dark';
}) {
  return (
    <section>
      <motion.div
        {...cardHover}
        className={`rounded-3xl border p-6 transition-shadow duration-250 ease-swift hover:shadow-lg ${getGlassShadow(theme)}`}
        style={getGlassStyle('PANEL', theme)}
      >
        <h3
          className={`text-lg font-bold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          💻 系统监控
        </h3>
        <SystemMonitor />
      </motion.div>
    </section>
  );
}

/**
 * 推荐与发现区域
 */
function DiscoverySection() {
  // 暂时不显示推荐,等待新的插件商店实现
  return null;
}
