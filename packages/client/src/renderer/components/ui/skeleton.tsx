/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Skeleton - 加载占位组件
 */

import type { CSSProperties } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import MuiSkeleton from '@mui/material/Skeleton';

export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  animated?: boolean;
  speed?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton 基础组件
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  animated = true,
  className = '',
  style = {},
}: SkeletonProps) {
  return (
    <MuiSkeleton
      variant="rounded"
      animation={animated ? 'pulse' : false}
      className={className}
      sx={{
        width,
        height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
        ...style,
      }}
    />
  );
}

/**
 * SkeletonText - 文本骨架
 */
export interface SkeletonTextProps {
  lines?: number;
  lastLineWidth?: string;
  spacing?: number;
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  className = '',
}: SkeletonTextProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {Array.from({ length: lines }).map((_, index) => (
        <MuiSkeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
        />
      ))}
    </Box>
  );
}

/**
 * SkeletonAvatar - 头像骨架
 */
export interface SkeletonAvatarProps {
  size?: number;
  shape?: 'circle' | 'square';
  className?: string;
}

export function SkeletonAvatar({
  size = 40,
  shape = 'circle',
  className = '',
}: SkeletonAvatarProps) {
  return (
    <MuiSkeleton
      variant={shape === 'circle' ? 'circular' : 'rounded'}
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * SkeletonCard - 卡片骨架
 */
export interface SkeletonCardProps {
  avatar?: boolean;
  titleLines?: number;
  contentLines?: number;
  className?: string;
}

export function SkeletonCard({
  avatar = true,
  titleLines = 1,
  contentLines = 3,
  className = '',
}: SkeletonCardProps) {
  return (
    <Paper variant="outlined" className={className} sx={{ p: 2, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {avatar && <SkeletonAvatar size={48} />}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {Array.from({ length: titleLines }).map((_, index) => (
              <MuiSkeleton
                key={index}
                variant="text"
                width={index === 0 ? '70%' : '50%'}
                height={20}
              />
            ))}
          </Box>
          <SkeletonText lines={contentLines} lastLineWidth="80%" />
        </Box>
      </Box>
    </Paper>
  );
}

/**
 * SkeletonList - 列表骨架
 */
export interface SkeletonListProps {
  count?: number;
  itemHeight?: number;
  spacing?: number;
  className?: string;
}

export function SkeletonList({
  count = 5,
  itemHeight = 60,
  className = '',
}: SkeletonListProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {Array.from({ length: count }).map((_, index) => (
        <MuiSkeleton
          key={index}
          variant="rounded"
          width="100%"
          height={itemHeight}
          sx={{ borderRadius: 2 }}
        />
      ))}
    </Box>
  );
}

/**
 * SkeletonTable - 表格骨架
 */
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* 表头 */}
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <MuiSkeleton key={index} variant="text" width="100%" height={16} />
        ))}
      </Box>
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{ display: 'grid', gap: 2, gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <MuiSkeleton key={colIndex} variant="text" width="100%" height={20} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * SkeletonImage - 图片骨架
 */
export interface SkeletonImageProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export function SkeletonImage({
  width = '100%',
  height = 200,
  borderRadius = 12,
  className = '',
}: SkeletonImageProps) {
  return (
    <Box
      className={className}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        width,
        height,
        borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
      }}
    >
      <MuiSkeleton variant="rectangular" width="100%" height="100%" />
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'action.disabled',
          fontSize: '2rem',
        }}
      >
        🖼️
      </Box>
    </Box>
  );
}
