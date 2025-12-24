/**
 * 统一动画系统
 * 从 ToolCard 和 ModuleSidebar 提取，供所有组件复用
 */

import { keyframes, alpha } from '@mui/material/styles';

// ============================================================
// Keyframes 动画
// ============================================================

/**
 * 呼吸灯脉冲动画 - 用于运行状态指示器
 */
export const pulse = keyframes`
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
`;

/**
 * 微光闪烁动画 - 用于卡片悬停效果
 */
export const shimmer = keyframes`
  0% {
    background-position: -200% center;
  }
  100% {
    background-position: 200% center;
  }
`;

// ============================================================
// 过渡时间常量
// ============================================================

export const transitions = {
  /** 悬停效果 - 卡片升起、边框高亮 */
  hover: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  /** 颜色过渡 - 图标颜色变化 */
  color: 'color 0.15s ease',
  /** accent bar 动画 */
  accent: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  /** 快速过渡 - 按钮缩放 */
  fast: 'all 0.15s ease',
} as const;

// ============================================================
// 品牌色渐变
// ============================================================

export const brandGradient = {
  /** 浅色模式用深一点的蓝色 */
  light: 'linear-gradient(135deg, #3B82F6 0%, #F97316 100%)',
  /** 深色模式用亮一点的蓝色 */
  dark: 'linear-gradient(135deg, #60A5FA 0%, #F97316 100%)',
} as const;

// ============================================================
// 阴影系统
// ============================================================

export const elevations = {
  card: {
    idle: {
      light: `0 1px 3px ${alpha('#000', 0.04)}`,
      dark: 'none',
    },
    hover: {
      light: `0 8px 24px ${alpha('#000', 0.06)}, 0 0 0 1px ${alpha('#3B82F6', 0.1)}`,
      dark: `0 8px 24px ${alpha('#000', 0.4)}, 0 0 20px ${alpha('#60A5FA', 0.15)}`,
    },
  },
} as const;

// ============================================================
// 背景色系统
// ============================================================

/** 侧边栏背景（中间层） */
export const sidebarBg = {
  light: '#f8f9fb',
  dark: '#0c0c0e',
} as const;

/** 内容区背景（下沉层，最暗） */
export const contentBg = {
  light: '#f2f2f4',
  dark: '#09090b',
} as const;

// ============================================================
// Shimmer 颜色
// ============================================================

export const shimmerColors = {
  light: alpha('#000', 0.15),
  dark: alpha('#fff', 0.3),
} as const;
