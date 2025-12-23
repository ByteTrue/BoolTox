/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 滚动容器组件
 * 简化版 - 使用原生滚动
 */

import { useRef, type ReactNode } from 'react';
import Box from '@mui/material/Box';

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
  onRefresh: _onRefresh,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box className={className} ref={containerRef}>
      {/* 内容区 */}
      <Box>
        {children}
      </Box>
    </Box>
  );
}
