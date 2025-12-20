/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { AnimatePresence, motion } from 'framer-motion';
import type { ModuleEvent } from '@/utils/module-event-logger';
import { useTheme } from '../theme-provider';
import { GLASS_BORDERS } from '@/utils/glass-layers';

export interface ActivityTimelineProps {
  /** 事件列表 */
  events: ModuleEvent[];
  /** 最多显示数量 */
  maxItems?: number;
}

/**
 * 活动时间线组件
 * 展示模块的操作历史（安装、卸载、启用、停用）
 */
export function ActivityTimeline({ events, maxItems = 10 }: ActivityTimelineProps) {
  const { theme } = useTheme();

  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
          暂无操作记录
        </p>
      </div>
    );
  }

  return (
    <div className="relative space-y-4">
      <AnimatePresence mode="popLayout">
        {displayEvents.map((event, index) => (
          <motion.div
            key={event.id}
            className="relative flex gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{
              duration: 0.3,
              delay: index * 0.05,
              ease: 'easeOut',
            }}
          >
            {/* 时间轴线和圆点 */}
            <div className="relative flex flex-col items-center">
              {/* 圆点 */}
              <motion.div
                className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                  theme === 'dark' ? 'bg-slate-900' : 'bg-white'
                }`}
                style={{
                  borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.05 + 0.1, type: 'spring' }}
              >
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: getActionColor(event.action) }}
                />
              </motion.div>

              {/* 连接线 */}
              {index < displayEvents.length - 1 && (
                <div
                  className={`w-[2px] flex-1 ${theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'}`}
                  style={{ minHeight: '20px' }}
                />
              )}
            </div>

            {/* 事件内容 */}
            <motion.div
              className={`flex-1 rounded-xl border px-4 py-3 backdrop-blur-sm transition-colors ${
                theme === 'dark' ? 'bg-white/5 hover:bg-white/8' : 'bg-white/50 hover:bg-white/70'
              }`}
              style={{
                borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
              }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    {event.moduleName}
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                    }`}
                  >
                    {getActionText(event.action)}
                  </p>
                </div>

                {/* 操作图标 */}
                <div
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs"
                  style={{ backgroundColor: getActionColor(event.action) + '20' }}
                >
                  {getActionIcon(event.action)}
                </div>
              </div>

              {/* 时间戳 */}
              <p
                className={`mt-2 text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}
              >
                {formatTimestamp(event.timestamp)}
              </p>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * 获取操作类型对应的颜色
 */
function getActionColor(action: ModuleEvent['action']): string {
  switch (action) {
    case 'install':
      return '#10B981'; // 绿色
    case 'uninstall':
      return '#EF4444'; // 红色
    case 'enable':
      return '#3B82F6'; // 蓝色
    case 'disable':
      return '#6B7280'; // 灰色
    default:
      return '#6B7280'; // 默认灰色
  }
}

/**
 * 获取操作类型对应的图标
 */
function getActionIcon(action: ModuleEvent['action']): string {
  switch (action) {
    case 'install':
      return '✓';
    case 'uninstall':
      return '✕';
    case 'enable':
      return '▶';
    case 'disable':
      return '⏸';
    default:
      return '•';
  }
}

/**
 * 获取操作类型的文本描述
 */
function getActionText(action: ModuleEvent['action']): string {
  switch (action) {
    case 'install':
      return '安装模块';
    case 'uninstall':
      return '卸载模块';
    case 'enable':
      return '启用模块';
    case 'disable':
      return '停用模块';
    default:
      return '操作模块';
  }
}

/**
 * 格式化时间戳为相对时间
 */
function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小时前`;
  } else if (minutes > 0) {
    return `${minutes} 分钟前`;
  } else if (seconds > 0) {
    return `${seconds} 秒前`;
  } else {
    return '刚刚';
  }
}
