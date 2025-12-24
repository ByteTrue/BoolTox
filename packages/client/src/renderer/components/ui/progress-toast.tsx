/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Slide from '@mui/material/Slide';
import Alert from '@mui/material/Alert';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

interface ProgressToastProps {
  message: string;
  progress?: number;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 进度提示组件 - 增强版 Toast,支持进度显示
 * 用于安装/更新等长时间操作的反馈
 */
export function ProgressToast({ message, progress, icon, action }: ProgressToastProps) {
  const hasProgress = progress !== undefined;
  const progressPercentage = hasProgress ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <Slide direction="up" in mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 3,
          minWidth: 320,
        }}
      >
        {/* 进度背景 */}
        {hasProgress && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: 'primary.main',
              opacity: 0.1,
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease-out',
            }}
          />
        )}

        {/* 内容 */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            p: 2,
          }}
        >
          {icon && <Box sx={{ flexShrink: 0, color: 'primary.main' }}>{icon}</Box>}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={500} sx={{ mb: hasProgress ? 0.5 : 0 }}>
              {message}
            </Typography>
            {hasProgress && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  sx={{ flex: 1, height: 6, borderRadius: 1 }}
                />
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ minWidth: 32 }}
                >
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
            )}
          </Box>

          {action && (
            <Button size="small" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </Box>
      </Paper>
    </Slide>
  );
}

/**
 * 简单成功/错误提示
 */
export function SimpleToast({
  type = 'info',
  message,
  onDismiss,
}: {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}) {
  const iconMap = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertTriangle size={20} />,
    info: <Info size={20} />,
  };

  return (
    <Slide direction="up" in mountOnEnter unmountOnExit>
      <Alert
        severity={type}
        icon={iconMap[type]}
        action={
          onDismiss ? (
            <IconButton size="small" onClick={onDismiss} color="inherit">
              <X size={16} />
            </IconButton>
          ) : undefined
        }
        sx={{
          borderRadius: 3,
          boxShadow: 8,
        }}
      >
        {message}
      </Alert>
    </Slide>
  );
}
