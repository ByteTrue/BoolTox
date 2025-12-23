/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Loading 组件集合
 */

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

const SIZE_MAP = {
  sm: 20,
  md: 32,
  lg: 48,
};

/**
 * LoadingSpinner - 旋转 Spinner
 */
export function LoadingSpinner({
  size = 'md',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <CircularProgress
      size={SIZE_MAP[size]}
      className={className}
    />
  );
}

/**
 * LoadingDots - 三点加载动画
 */
export interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingDots({ size = 'md', className = '' }: LoadingDotsProps) {
  const dotSize = { sm: 6, md: 8, lg: 10 }[size];

  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {[0, 1, 2].map(index => (
        <Box
          key={index}
          sx={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: 'bounce 1.2s infinite ease-in-out',
            animationDelay: `${index * 0.2}s`,
            '@keyframes bounce': {
              '0%, 80%, 100%': { transform: 'translateY(0)' },
              '40%': { transform: 'translateY(-8px)' },
            },
          }}
        />
      ))}
    </Box>
  );
}

/**
 * LoadingPulse - 脉冲动画
 */
export interface LoadingPulseProps {
  size?: number;
  className?: string;
}

export function LoadingPulse({ size = 40, className = '' }: LoadingPulseProps) {
  return (
    <Box
      className={className}
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        bgcolor: 'primary.main',
        animation: 'pulse 1.5s infinite ease-in-out',
        '@keyframes pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.2)', opacity: 0.5 },
        },
      }}
    />
  );
}

/**
 * LoadingProgress - 进度条动画
 */
export interface LoadingProgressProps {
  progress?: number;
  indeterminate?: boolean;
  height?: number;
  className?: string;
}

export function LoadingProgress({
  progress = 0,
  indeterminate = false,
  height = 4,
  className = '',
}: LoadingProgressProps) {
  return (
    <LinearProgress
      variant={indeterminate ? 'indeterminate' : 'determinate'}
      value={indeterminate ? undefined : Math.min(100, Math.max(0, progress))}
      className={className}
      sx={{
        height,
        borderRadius: height / 2,
      }}
    />
  );
}

/**
 * LoadingOverlay - 全屏加载遮罩
 */
export interface LoadingOverlayProps {
  show: boolean;
  text?: string;
  blur?: boolean;
  className?: string;
}

export function LoadingOverlay({
  show,
  text = '加载中...',
  blur = true,
  className = '',
}: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <Fade in={show}>
      <Box
        className={className}
        sx={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'rgba(0, 0, 0, 0.5)',
          backdropFilter: blur ? 'blur(8px)' : 'none',
        }}
      >
        <Paper
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            p: 4,
            borderRadius: 3,
          }}
        >
          <CircularProgress size={48} />
          {text && <Typography color="text.primary">{text}</Typography>}
        </Paper>
      </Box>
    </Fade>
  );
}

/**
 * LoadingInline - 内联加载指示器
 */
export interface LoadingInlineProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingInline({
  text = '加载中',
  size = 'sm',
  className = '',
}: LoadingInlineProps) {
  return (
    <Box className={className} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={SIZE_MAP[size]} />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Box>
  );
}
