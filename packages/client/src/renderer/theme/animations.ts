/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

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
// 动画时长常量（Duration Constants）
// ============================================================

/**
 * 标准动画时长配置
 * 确保全局一致性，遵循 Material Design 的动画规范
 */
export const durations = {
  /** 微交互 - 极快响应 (100ms) */
  micro: 0.1,
  /** 快速 - 退出动画/即时反馈 (150ms) */
  fast: 0.15,
  /** 基础 - 标准交互/悬停效果 (200ms) */
  base: 0.2,
  /** 标准 - 页面转场/状态变化 (250ms) */
  standard: 0.25,
  /** Spring - 弹性动画/Switch开关 (350ms) */
  spring: 0.35,
} as const;

/**
 * 标准缓动函数（Easing Functions）
 * 基于 Material Design Motion 规范
 */
export const easings = {
  /** 标准缓动 - 通用场景 */
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
  /** 进入缓动 - 元素进入屏幕 */
  enter: 'cubic-bezier(0, 0, 0.2, 1)',
  /** 退出缓动 - 元素离开屏幕 */
  exit: 'cubic-bezier(0.4, 0, 1, 1)',
  /** Spring缓动 - 带回弹效果 */
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================================
// 过渡时间常量（Transition Shortcuts）
// ============================================================

export const transitions = {
  /** 悬停效果 - 卡片升起、边框高亮 */
  hover: `all ${durations.standard}s ${easings.standard}`,
  /** 颜色过渡 - 图标颜色变化 */
  color: `color ${durations.fast}s ease`,
  /** accent bar 动画 */
  accent: `transform ${durations.base}s ${easings.standard}`,
  /** 快速过渡 - 按钮缩放 */
  fast: `all ${durations.fast}s ease`,
  /** Spring 弹性 - Switch开关 */
  spring: `transform ${durations.spring}s ${easings.spring}`,
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

// ============================================================
// Framer Motion Variants（仅用于复杂场景）
// ============================================================

/**
 * 页面转场动画（路由切换）
 * 使用场景: app-shell.tsx的路由切换
 * 优化: 快速淡入,无垂直移动
 */
export const pageTransition = {
  initial: { opacity: 0, scale: 0.98 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: durations.fast, // 150ms，更快
      ease: [0.4, 0, 0.2, 1], // 对应 easings.standard
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: durations.micro, // 100ms，极快
      ease: [0.4, 0, 0.6, 1], // 对应 easings.exit
    },
  },
} as const;

/**
 * 列表stagger动画（初次加载）
 * 使用场景: home-page.tsx、tools-page.tsx的工具卡片列表
 */
export const staggerContainer = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
} as const;

export const staggerItem = {
  initial: { opacity: 0, y: 12, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: durations.standard,
      ease: [0.4, 0, 0.2, 1], // 对应 easings.standard
    },
  },
} as const;

/**
 * Spring物理配置（用于Toggle、Switch等）
 * 使用场景: 设置页面的开关组件
 */
export const springConfigs = {
  /** 柔和弹簧（默认） */
  gentle: { type: 'spring' as const, stiffness: 300, damping: 30 },
  /** 快速弹簧（按钮） */
  snappy: { type: 'spring' as const, stiffness: 500, damping: 35 },
  /** 慢速弹簧（拖拽） */
  smooth: { type: 'spring' as const, stiffness: 200, damping: 25 },
} as const;

/**
 * 3D卡片配置（可选，用于特殊场景）
 * 使用场景: 首页英雄区的快速启动卡片
 */
export const card3DConfig = {
  perspective: 1000,
  maxRotate: 10, // 最大倾斜角度（度）
  intensity: 0.5, // 倾斜强度（0-1）
} as const;
