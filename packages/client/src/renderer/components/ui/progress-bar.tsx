/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { formatBytes, calculatePercentage, getUsageColor } from '@/hooks/use-system-info';

export interface ProgressBarProps {
  label: string;
  used: number;
  total: number;
  icon?: string;
}

/**
 * 进度条组件
 * 用于显示内存、磁盘等资源使用情况
 */
export function ProgressBar({ label, used, total, icon }: ProgressBarProps) {
  const percentage = calculatePercentage(used, total);
  const color = getUsageColor(percentage);

  const colorMap = {
    green: 'success' as const,
    yellow: 'warning' as const,
    red: 'error' as const,
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 标签行 */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && <Typography component="span">{icon}</Typography>}
          <Typography variant="body2" fontWeight={500}>
            {label}
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {formatBytes(used)} / {formatBytes(total)}
        </Typography>
      </Box>

      {/* 进度条 */}
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={colorMap[color]}
        sx={{
          height: 8,
          borderRadius: 1,
          bgcolor: 'action.hover',
        }}
      />

      {/* 百分比 */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Typography
          variant="caption"
          fontWeight={600}
          color={`${colorMap[color]}.main`}
        >
          {percentage.toFixed(1)}%
        </Typography>
      </Box>
    </Box>
  );
}
