/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import type { ModuleEvent } from '@/utils/module-event-logger';

export interface ActivityTimelineProps {
  events: ModuleEvent[];
  maxItems?: number;
}

/**
 * 活动时间线组件
 * 展示模块的操作历史（安装、卸载、启用、停用）
 */
export function ActivityTimeline({ events, maxItems = 10 }: ActivityTimelineProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 6,
        }}
      >
        <Typography variant="body2" color="text.secondary">
          暂无操作记录
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {displayEvents.map((event, index) => (
        <Fade in key={event.id} timeout={300 + index * 50}>
          <Box sx={{ position: 'relative', display: 'flex', gap: 2 }}>
            {/* 时间轴线和圆点 */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              {/* 圆点 */}
              <Box
                sx={{
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: 2,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                }}
              >
                <Box
                  sx={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    bgcolor: getActionColor(event.action),
                  }}
                />
              </Box>

              {/* 连接线 */}
              {index < displayEvents.length - 1 && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 20,
                    bgcolor: 'divider',
                  }}
                />
              )}
            </Box>

            {/* 事件内容 */}
            <Paper
              variant="outlined"
              sx={{
                flex: 1,
                px: 2,
                py: 1.5,
                borderRadius: 2,
                transition: 'background-color 0.2s, transform 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                  transform: 'scale(1.01)',
                },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 1.5,
                }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {event.moduleName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                    {getActionText(event.action)}
                  </Typography>
                </Box>

                {/* 操作图标 */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: `${getActionColor(event.action)}20`,
                    fontSize: '0.75rem',
                    flexShrink: 0,
                  }}
                >
                  {getActionIcon(event.action)}
                </Box>
              </Box>

              {/* 时间戳 */}
              <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                {formatTimestamp(event.timestamp)}
              </Typography>
            </Paper>
          </Box>
        </Fade>
      ))}
    </Box>
  );
}

function getActionColor(action: ModuleEvent['action']): string {
  switch (action) {
    case 'install':
      return '#10B981';
    case 'uninstall':
      return '#EF4444';
    case 'enable':
      return '#3B82F6';
    case 'disable':
      return '#6B7280';
    default:
      return '#6B7280';
  }
}

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
