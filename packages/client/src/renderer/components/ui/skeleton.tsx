/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Skeleton - 加载占位组件
 *
 * Apple 风格的骨架屏加载效果
 */

import { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { getSkeletonStyle } from '@/utils/detail-polish';
import { useTheme } from '../theme-provider';
import { GLASS_BORDERS } from '@/utils/glass-layers';

export interface SkeletonProps {
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  borderRadius?: string | number;
  /** 是否显示动画 */
  animated?: boolean;
  /** 动画速度 */
  speed?: number;
  /** 类名 */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
}

/**
 * Skeleton 基础组件
 *
 * @example
 * <Skeleton width="100%" height={20} />
 */
export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  animated = true,
  speed = 1.5,
  className = '',
  style = {},
}: SkeletonProps) {
  const { theme } = useTheme();

  return (
    <div
      className={className}
      style={{
        ...getSkeletonStyle(theme, { width, height, borderRadius, speed, animated }),
        ...style,
      }}
    />
  );
}

/**
 * SkeletonText - 文本骨架
 */
export interface SkeletonTextProps {
  /** 行数 */
  lines?: number;
  /** 最后一行宽度 */
  lastLineWidth?: string;
  /** 行间距 */
  spacing?: number;
  /** 类名 */
  className?: string;
}

export function SkeletonText({
  lines = 3,
  lastLineWidth = '60%',
  spacing = 8,
  className = '',
}: SkeletonTextProps) {
  return (
    <div className={`space-y-${spacing / 4} ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          height={16}
          borderRadius={4}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - 头像骨架
 */
export interface SkeletonAvatarProps {
  /** 尺寸 */
  size?: number;
  /** 形状 */
  shape?: 'circle' | 'square';
  /** 类名 */
  className?: string;
}

export function SkeletonAvatar({
  size = 40,
  shape = 'circle',
  className = '',
}: SkeletonAvatarProps) {
  return (
    <Skeleton
      width={size}
      height={size}
      borderRadius={shape === 'circle' ? '50%' : 8}
      className={className}
    />
  );
}

/**
 * SkeletonCard - 卡片骨架
 */
export interface SkeletonCardProps {
  /** 是否显示头像 */
  avatar?: boolean;
  /** 标题行数 */
  titleLines?: number;
  /** 内容行数 */
  contentLines?: number;
  /** 类名 */
  className?: string;
}

export function SkeletonCard({
  avatar = true,
  titleLines = 1,
  contentLines = 3,
  className = '',
}: SkeletonCardProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`p-4 rounded-xl border ${
        theme === 'dark' ? 'bg-white/5' : 'bg-white'
      } ${className}`}
      style={{
        borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start gap-4">
        {avatar && <SkeletonAvatar size={48} />}
        <div className="flex-1 space-y-3">
          {/* 标题 */}
          <div className="space-y-2">
            {Array.from({ length: titleLines }).map((_, index) => (
              <Skeleton
                key={index}
                width={index === 0 ? '70%' : '50%'}
                height={20}
                borderRadius={4}
              />
            ))}
          </div>
          {/* 内容 */}
          <SkeletonText lines={contentLines} lastLineWidth="80%" spacing={6} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * SkeletonList - 列表骨架
 */
export interface SkeletonListProps {
  /** 项数 */
  count?: number;
  /** 项高度 */
  itemHeight?: number;
  /** 间距 */
  spacing?: number;
  /** 类名 */
  className?: string;
}

export function SkeletonList({
  count = 5,
  itemHeight = 60,
  spacing = 12,
  className = '',
}: SkeletonListProps) {
  return (
    <div className={`space-y-${spacing / 4} ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Skeleton width="100%" height={itemHeight} borderRadius={12} />
        </motion.div>
      ))}
    </div>
  );
}

/**
 * SkeletonTable - 表格骨架
 */
export interface SkeletonTableProps {
  /** 行数 */
  rows?: number;
  /** 列数 */
  columns?: number;
  /** 类名 */
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className = '' }: SkeletonTableProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {/* 表头 */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} width="100%" height={16} borderRadius={4} />
        ))}
      </div>
      {/* 表格行 */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <motion.div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: rowIndex * 0.05 }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} width="100%" height={20} borderRadius={4} />
          ))}
        </motion.div>
      ))}
    </div>
  );
}

/**
 * SkeletonImage - 图片骨架
 */
export interface SkeletonImageProps {
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  borderRadius?: string | number;
  /** 类名 */
  className?: string;
}

export function SkeletonImage({
  width = '100%',
  height = 200,
  borderRadius = 12,
  className = '',
}: SkeletonImageProps) {
  const { theme } = useTheme();

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
      }}
    >
      <Skeleton width="100%" height="100%" borderRadius={0} />
      {/* 图标占位 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-4xl ${theme === 'dark' ? 'text-white/20' : 'text-black/10'}`}>🖼️</div>
      </div>
    </div>
  );
}
