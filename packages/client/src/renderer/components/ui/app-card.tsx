/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Card 组件包装器
 */

import React, { type ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

export interface AppCardProps {
  /** 标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 头像 */
  avatar?: ReactNode;
  /** 头部操作 */
  headerAction?: ReactNode;
  /** 内容 */
  children?: ReactNode;
  /** 底部操作 */
  actions?: ReactNode;
  /** 媒体图片 */
  image?: string;
  /** 媒体图片高度 */
  imageHeight?: number;
  /** 是否可点击 */
  clickable?: boolean;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否有边框 */
  outlined?: boolean;
  /** 阴影级别 */
  elevation?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 应用卡片组件
 * 基于 MUI Card
 *
 * @example
 * ```tsx
 * <AppCard title="标题" subtitle="副标题">
 *   <p>卡片内容</p>
 * </AppCard>
 * ```
 */
export function AppCard({
  title,
  subtitle,
  avatar,
  headerAction,
  children,
  actions,
  image,
  imageHeight = 140,
  clickable = false,
  onClick,
  outlined = false,
  elevation = 1,
  className = '',
}: AppCardProps) {
  return (
    <Card
      variant={outlined ? 'outlined' : 'elevation'}
      elevation={outlined ? 0 : elevation}
      className={className}
      sx={{
        cursor: clickable ? 'pointer' : undefined,
        transition: clickable ? 'box-shadow 0.2s, transform 0.2s' : undefined,
        '&:hover': clickable
          ? {
              boxShadow: 4,
              transform: 'translateY(-2px)',
            }
          : undefined,
      }}
      onClick={clickable ? onClick : undefined}
    >
      {image && (
        <CardMedia
          component="img"
          height={imageHeight}
          image={image}
          alt={title || ''}
        />
      )}
      {(title || subtitle || avatar || headerAction) && (
        <CardHeader
          avatar={avatar}
          action={headerAction}
          title={title}
          subheader={subtitle}
        />
      )}
      {children && <CardContent>{children}</CardContent>}
      {actions && <CardActions>{actions}</CardActions>}
    </Card>
  );
}

/**
 * 简单卡片组件
 * 只有内容区域的简化版本
 */
export interface AppSimpleCardProps {
  /** 内容 */
  children: ReactNode;
  /** 内边距 */
  padding?: number;
  /** 是否有边框 */
  outlined?: boolean;
  /** 阴影级别 */
  elevation?: number;
  /** 自定义类名 */
  className?: string;
}

export function AppSimpleCard({
  children,
  padding = 2,
  outlined = false,
  elevation = 1,
  className = '',
}: AppSimpleCardProps) {
  return (
    <Card
      variant={outlined ? 'outlined' : 'elevation'}
      elevation={outlined ? 0 : elevation}
      className={className}
      sx={{ p: padding }}
    >
      {children}
    </Card>
  );
}

// 导出别名
export { AppCard as GlassCard };
export { AppSimpleCard as SimpleCard };
