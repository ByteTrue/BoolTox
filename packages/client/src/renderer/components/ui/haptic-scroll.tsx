/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 滚动容器组件
 * 简化版 - 使用原生滚动
 */

import { useRef, useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

export interface HapticScrollContainerProps {
  children: ReactNode;
  maxHeight?: string;
  className?: string;
  showScrollbar?: boolean;
  enableBounce?: boolean;
}

export function HapticScrollContainer({
  children,
  maxHeight = '600px',
  className = '',
  showScrollbar = true,
}: HapticScrollContainerProps) {
  return (
    <Box
      className={className}
      sx={{
        maxHeight,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: showScrollbar ? 8 : 0,
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'action.disabled',
          borderRadius: 1,
          '&:hover': {
            bgcolor: 'action.active',
          },
        },
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 下拉刷新组件
 */
export interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Box className={className} ref={containerRef}>
      {/* 刷新指示器 */}
      {isRefreshing && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            py: 2,
          }}
        >
          <CircularProgress size={24} />
        </Box>
      )}

      {/* 内容区 */}
      <Box>
        {children}
      </Box>
    </Box>
  );
}
