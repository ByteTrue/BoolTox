/**
 * Grid 响应式配置
 * Material Design 8dp Grid System
 */

import type { SxProps } from '@mui/material';

/**
 * Grid 断点配置
 * 定义不同屏幕尺寸下的列数
 */
export const GRID_BREAKPOINTS = {
  /** 模块卡片 Grid（4列布局） */
  MODULE_CARD: {
    xs: 1, // 手机：1列
    sm: 1, // 小平板：1列
    md: 2, // 平板：2列
    lg: 3, // 桌面：3列
    xl: 4, // 大屏：4列
  },
  /** 统计卡片 Grid（3列布局） */
  STAT_CARD: {
    xs: 1, // 手机：1列
    sm: 2, // 小平板：2列
    md: 3, // 平板+：3列
  },
  /** 首页快速启动（4列布局） */
  QUICK_LAUNCH: {
    xs: 2, // 手机：2列
    sm: 3, // 小平板：3列
    md: 4, // 平板+：4列
  },
  /** 双栏布局（左右分栏） */
  TWO_COLUMN: {
    xs: 1, // 手机：单栏
    md: 2, // 平板+：双栏
  },
} as const;

/**
 * 获取 Grid 列配置（用于 MUI Grid2 或 sx gridTemplateColumns）
 * @param config - 断点配置对象
 * @returns MUI 响应式对象
 */
export function getGridColumns(config: (typeof GRID_BREAKPOINTS)[keyof typeof GRID_BREAKPOINTS]) {
  const result: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>> = {};

  Object.entries(config).forEach(([breakpoint, columns]) => {
    result[breakpoint as 'xs' | 'sm' | 'md' | 'lg' | 'xl'] =
      columns === 1 ? '1fr' : `repeat(${columns}, 1fr)`;
  });

  return result as { xs: string; sm?: string; md?: string; lg?: string; xl?: string };
}

/**
 * 获取 MUI Grid2 的 columns 配置
 * @param config - 断点配置对象
 * @returns MUI Grid2 columns 对象
 */
export function getGrid2Columns(config: (typeof GRID_BREAKPOINTS)[keyof typeof GRID_BREAKPOINTS]) {
  return config;
}

/**
 * Grid 间距配置（基于 MUI theme.spacing）
 */
export const GRID_SPACING = {
  TIGHT: 2, // 16px (theme.spacing(2))
  NORMAL: 3, // 24px (theme.spacing(3))
  LOOSE: 4, // 32px (theme.spacing(4))
} as const;

/**
 * 生成 Grid 容器的 sx prop
 * @param config - 断点配置
 * @param spacing - 间距（默认 NORMAL）
 * @returns MUI sx prop
 */
export function createGridSx(
  config: (typeof GRID_BREAKPOINTS)[keyof typeof GRID_BREAKPOINTS],
  spacing: keyof typeof GRID_SPACING = 'NORMAL'
): SxProps {
  return {
    display: 'grid',
    gap: GRID_SPACING[spacing],
    gridTemplateColumns: getGridColumns(config),
  };
}
