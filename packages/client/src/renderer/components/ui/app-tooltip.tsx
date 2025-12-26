/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Tooltip 组件包装器
 */

import React, { type ReactNode } from 'react';
import Tooltip, { type TooltipProps as MuiTooltipProps } from '@mui/material/Tooltip';

export interface AppTooltipProps {
  /** 提示内容 */
  title: ReactNode;
  /** 子元素 */
  children: React.ReactElement;
  /** 位置 */
  placement?: MuiTooltipProps['placement'];
  /** 是否显示箭头 */
  arrow?: boolean;
  /** 打开延迟（毫秒） */
  enterDelay?: number;
  /** 关闭延迟（毫秒） */
  leaveDelay?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 应用提示组件
 * 基于 MUI Tooltip
 *
 * @example
 * ```tsx
 * <AppTooltip title="这是提示文本">
 *   <button>悬停查看</button>
 * </AppTooltip>
 * ```
 */
export function AppTooltip({
  title,
  children,
  placement = 'top',
  arrow = false,
  enterDelay = 200,
  leaveDelay = 0,
  disabled = false,
  className = '',
}: AppTooltipProps) {
  if (disabled || !title) {
    return children;
  }

  return (
    <Tooltip
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      className={className}
    >
      {children}
    </Tooltip>
  );
}

// 导出别名
export { AppTooltip as Tooltip };
