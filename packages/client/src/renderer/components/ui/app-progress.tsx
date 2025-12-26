/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Progress 组件包装器
 */

import React from 'react';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export interface AppLinearProgressProps {
  /** 进度值（0-100），不传则为不确定状态 */
  value?: number;
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 标签位置 */
  labelPosition?: 'top' | 'right';
  /** 标签文本 */
  label?: string;
  /** 高度 */
  height?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 线性进度条组件
 * 基于 MUI LinearProgress
 *
 * @example
 * ```tsx
 * <AppLinearProgress value={75} showLabel />
 * <AppLinearProgress /> // 不确定状态
 * ```
 */
export function AppLinearProgress({
  value,
  color = 'primary',
  showLabel = false,
  labelPosition = 'right',
  label,
  height = 6,
  className = '',
}: AppLinearProgressProps) {
  const isDeterminate = value !== undefined;
  const displayValue = isDeterminate ? Math.min(Math.max(value, 0), 100) : 0;
  const displayLabel = label || `${Math.round(displayValue)}%`;

  if (showLabel && labelPosition === 'top') {
    return (
      <Box className={className}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {label || '进度'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {displayLabel}
          </Typography>
        </Box>
        <LinearProgress
          variant={isDeterminate ? 'determinate' : 'indeterminate'}
          value={displayValue}
          color={color}
          sx={{ height, borderRadius: height / 2 }}
        />
      </Box>
    );
  }

  if (showLabel && labelPosition === 'right') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} className={className}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant={isDeterminate ? 'determinate' : 'indeterminate'}
            value={displayValue}
            color={color}
            sx={{ height, borderRadius: height / 2 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 40 }}>
          {displayLabel}
        </Typography>
      </Box>
    );
  }

  return (
    <LinearProgress
      variant={isDeterminate ? 'determinate' : 'indeterminate'}
      value={displayValue}
      color={color}
      sx={{ height, borderRadius: height / 2 }}
      className={className}
    />
  );
}

export interface AppCircularProgressProps {
  /** 进度值（0-100），不传则为不确定状态 */
  value?: number;
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | number;
  /** 厚度 */
  thickness?: number;
  /** 是否显示标签 */
  showLabel?: boolean;
  /** 自定义类名 */
  className?: string;
}

const circularSizeMap: Record<'sm' | 'md' | 'lg', number> = {
  sm: 24,
  md: 40,
  lg: 56,
};

/**
 * 圆形进度条组件
 * 基于 MUI CircularProgress
 *
 * @example
 * ```tsx
 * <AppCircularProgress value={75} showLabel />
 * <AppCircularProgress size="sm" /> // 小尺寸加载中
 * ```
 */
export function AppCircularProgress({
  value,
  color = 'primary',
  size = 'md',
  thickness = 4,
  showLabel = false,
  className = '',
}: AppCircularProgressProps) {
  const isDeterminate = value !== undefined;
  const displayValue = isDeterminate ? Math.min(Math.max(value, 0), 100) : 0;
  const resolvedSize = typeof size === 'number' ? size : circularSizeMap[size];

  if (showLabel && isDeterminate) {
    return (
      <Box sx={{ position: 'relative', display: 'inline-flex' }} className={className}>
        <CircularProgress
          variant="determinate"
          value={displayValue}
          color={color}
          size={resolvedSize}
          thickness={thickness}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="caption"
            component="div"
            color="text.secondary"
            sx={{ fontSize: resolvedSize * 0.25 }}
          >
            {`${Math.round(displayValue)}%`}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <CircularProgress
      variant={isDeterminate ? 'determinate' : 'indeterminate'}
      value={displayValue}
      color={color}
      size={resolvedSize}
      thickness={thickness}
      className={className}
    />
  );
}

// 导出别名
export { AppLinearProgress as LinearProgress };
export { AppCircularProgress as CircularProgress };
export { AppLinearProgress as ProgressBar };
