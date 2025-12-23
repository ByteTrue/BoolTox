/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Skeleton 组件包装器
 */

import React from 'react';
import MuiSkeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';

export interface AppSkeletonProps {
  /** 变体 */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded';
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 是否启用动画 */
  animation?: 'pulse' | 'wave' | false;
  /** 自定义类名 */
  className?: string;
}

/**
 * 骨架屏基础组件
 * 基于 MUI Skeleton
 *
 * @example
 * ```tsx
 * <AppSkeleton width={200} height={20} />
 * <AppSkeleton variant="circular" width={40} height={40} />
 * ```
 */
export function AppSkeleton({
  variant = 'rounded',
  width = '100%',
  height = 20,
  animation = 'wave',
  className = '',
}: AppSkeletonProps) {
  return (
    <MuiSkeleton
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
    />
  );
}

/**
 * 文本骨架
 */
export interface AppSkeletonTextProps {
  /** 行数 */
  lines?: number;
  /** 最后一行宽度 */
  lastLineWidth?: string | number;
  /** 行间距 */
  spacing?: number;
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  spacing = 1,
  className = '',
}: AppSkeletonTextProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {Array.from({ length: lines }).map((_, index) => (
        <AppSkeleton
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
 * 头像骨架
 */
export interface AppSkeletonAvatarProps {
  /** 尺寸 */
  size?: number;
  /** 形状 */
  shape?: 'circle' | 'square';
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonAvatar({
  size = 40,
  shape = 'circle',
  className = '',
}: AppSkeletonAvatarProps) {
  return (
    <AppSkeleton
      variant={shape === 'circle' ? 'circular' : 'rounded'}
      width={size}
      height={size}
      className={className}
    />
  );
}

/**
 * 卡片骨架
 */
export interface AppSkeletonCardProps {
  /** 是否显示头像 */
  avatar?: boolean;
  /** 标题行数 */
  titleLines?: number;
  /** 内容行数 */
  contentLines?: number;
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonCard({
  avatar = true,
  titleLines = 1,
  contentLines = 3,
  className = '',
}: AppSkeletonCardProps) {
  return (
    <Box
      className={className}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', gap: 2 }}>
        {avatar && <AppSkeletonAvatar size={48} />}
        <Box sx={{ flex: 1 }}>
          <Box sx={{ mb: 1.5 }}>
            {Array.from({ length: titleLines }).map((_, index) => (
              <AppSkeleton
                key={index}
                variant="text"
                width={index === 0 ? '70%' : '50%'}
                height={24}
              />
            ))}
          </Box>
          <AppSkeletonText lines={contentLines} lastLineWidth="80%" spacing={0.5} />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * 列表骨架
 */
export interface AppSkeletonListProps {
  /** 项数 */
  count?: number;
  /** 项高度 */
  itemHeight?: number;
  /** 间距 */
  spacing?: number;
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonList({
  count = 5,
  itemHeight = 60,
  spacing = 1,
  className = '',
}: AppSkeletonListProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {Array.from({ length: count }).map((_, index) => (
        <AppSkeleton key={index} variant="rounded" width="100%" height={itemHeight} />
      ))}
    </Box>
  );
}

/**
 * 表格骨架
 */
export interface AppSkeletonTableProps {
  /** 行数 */
  rows?: number;
  /** 列数 */
  columns?: number;
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonTable({
  rows = 5,
  columns = 4,
  className = '',
}: AppSkeletonTableProps) {
  return (
    <Box className={className} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* 表头 */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 2,
        }}
      >
        {Array.from({ length: columns }).map((_, index) => (
          <AppSkeleton key={index} variant="text" width="100%" height={16} />
        ))}
      </Box>
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 2,
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <AppSkeleton key={colIndex} variant="text" width="100%" height={20} />
          ))}
        </Box>
      ))}
    </Box>
  );
}

/**
 * 图片骨架
 */
export interface AppSkeletonImageProps {
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 自定义类名 */
  className?: string;
}

export function AppSkeletonImage({
  width = '100%',
  height = 200,
  className = '',
}: AppSkeletonImageProps) {
  return (
    <AppSkeleton
      variant="rounded"
      width={width}
      height={height}
      className={className}
    />
  );
}

// 导出别名
export { AppSkeleton as Skeleton };
export { AppSkeletonText as SkeletonText };
export { AppSkeletonAvatar as SkeletonAvatar };
export { AppSkeletonCard as SkeletonCard };
export { AppSkeletonList as SkeletonList };
export { AppSkeletonTable as SkeletonTable };
export { AppSkeletonImage as SkeletonImage };
