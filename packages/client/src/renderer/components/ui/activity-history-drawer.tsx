/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useId } from 'react';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import { X } from 'lucide-react';
import { ActivityTimeline } from './activity-timeline';
import type { ModuleEvent } from '@/utils/module-event-logger';

export interface ActivityHistoryDrawerProps {
  open: boolean;
  events: ModuleEvent[];
  onClose: () => void;
}

/**
 * 操作记录历史抽屉组件
 */
export function ActivityHistoryDrawer({ open, events, onClose }: ActivityHistoryDrawerProps) {
  const drawerId = useId();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
        },
      }}
    >
      {/* 头部 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          📝 操作历史
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <X size={20} />
        </IconButton>
      </Box>

      {/* 内容区域 */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 3,
          height: 'calc(100% - 140px)',
        }}
      >
        {events.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              暂无操作记录
            </Typography>
          </Box>
        ) : (
          <ActivityTimeline events={events} maxItems={events.length} />
        )}
      </Box>

      {/* 底部统计 */}
      <Box
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          共 {events.length} 条操作记录
        </Typography>
      </Box>
    </Drawer>
  );
}
