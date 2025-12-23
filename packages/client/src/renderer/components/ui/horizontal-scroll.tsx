/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode, WheelEvent } from 'react';
import { useRef } from 'react';
import Box from '@mui/material/Box';

export interface HorizontalScrollProps {
  children: ReactNode;
  gap?: number;
  showScrollbar?: boolean;
}

/**
 * 横向滚动容器组件
 * 支持鼠标滚轮横向滚动和美化的滚动条
 */
export function HorizontalScroll({
  children,
  gap = 24,
  showScrollbar = true,
}: HorizontalScrollProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }
      e.preventDefault();
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <Box
      ref={scrollRef}
      onWheel={handleWheel}
      sx={{
        overflowX: 'auto',
        py: 1,
        scrollBehavior: 'smooth',
        '&::-webkit-scrollbar': {
          height: showScrollbar ? 8 : 0,
          display: showScrollbar ? 'block' : 'none',
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: 'action.hover',
          borderRadius: 1,
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: 'primary.main',
          borderRadius: 1,
          opacity: 0.5,
          '&:hover': {
            opacity: 0.7,
          },
        },
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: `${gap}px`,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
