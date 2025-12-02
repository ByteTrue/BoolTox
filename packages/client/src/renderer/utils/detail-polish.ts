/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 细节打磨工具 - Task 2.6
 * 
 * 实现 Apple 风格的细节优化：
 * 1. Scrollbar 样式优化
 * 2. Focus 状态环优化
 * 3. Loading 状态动画
 * 4. Skeleton 加载占位
 * 5. Empty 空状态
 * 
 * 参考标准：
 * - macOS scrollbar (overlay style)
 * - iOS focus ring (blue glow)
 * - Activity Indicator (spinning)
 */

import { CSSProperties } from 'react';

// ============================================
// 1. Scrollbar 样式优化
// ============================================

/**
 * Scrollbar 主题类型
 */
export type ScrollbarTheme = 'light' | 'dark';

/**
 * Scrollbar 样式配置
 */
export interface ScrollbarConfig {
  /** 滚动条颜色 */
  thumbColor?: string;
  /** 轨道颜色 */
  trackColor?: string;
}

/**
 * 获取自定义滚动条样式
 * 
 * macOS 风格：细窄、半透明、Hover 时显示
 * 
 * @example
 * <div style={getScrollbarStyle('dark')}>
 *   Content with custom scrollbar
 * </div>
 */
export function getScrollbarStyle(
  theme: ScrollbarTheme = 'dark',
  config?: ScrollbarConfig
): CSSProperties {
  const {
    thumbColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
    trackColor = 'transparent',
  } = config || {};

  return {
    scrollbarWidth: 'thin' as const,
    scrollbarColor: `${thumbColor} ${trackColor}`,
  };
}

/**
 * 获取滚动条 CSS 类名
 * 
 * 使用 Tailwind 自定义滚动条类
 */
export function getScrollbarClassName(theme: ScrollbarTheme = 'dark'): string {
  return theme === 'dark'
    ? 'elegant-scroll'
    : 'elegant-scroll-light';
}

// ============================================
// 2. Focus 状态环优化
// ============================================

/**
 * Focus Ring 配置
 */
export interface FocusRingConfig {
  /** 环颜色 */
  color?: string;
  /** 环宽度 */
  width?: number;
  /** 模糊半径 */
  blur?: number;
}

/**
 * 获取 Focus Ring 样式
 * 
 * Apple 风格：蓝色发光环，外围模糊
 * 
 * @example
 * <input style={getFocusRingStyle('light')} />
 */
export function getFocusRingStyle(
  theme: ScrollbarTheme = 'dark',
  config?: FocusRingConfig
): CSSProperties {
  const {
    color = theme === 'dark' ? 'rgba(101, 187, 233, 0.6)' : 'rgba(0, 122, 255, 0.5)',
    width = 3,
    blur = 8,
  } = config || {};

  return {
    outline: 'none',
    boxShadow: `0 0 0 ${width}px ${color}, 0 0 ${blur}px ${blur / 2}px ${color}`,
    transition: 'box-shadow 0.2s ease',
  };
}

/**
 * 获取 Focus Ring Tailwind 类名
 * 
 * 使用预定义的 focus-visible 样式
 */
export function getFocusRingClassName(theme: ScrollbarTheme = 'dark'): string {
  return theme === 'dark'
    ? 'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900'
    : 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white';
}

// ============================================
// 3. Loading 状态动画
// ============================================

/**
 * Loading 动画类型
 */
export type LoadingType = 'spinner' | 'dots' | 'pulse' | 'progress';

/**
 * Loading 配置
 */
export interface LoadingConfig {
  /** 大小 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: string;
  /** 速度 (秒) */
  speed?: number;
}

/**
 * 获取 Spinner 动画样式
 * 
 * iOS 风格的旋转 Spinner
 */
export function getSpinnerStyle(
  theme: ScrollbarTheme = 'dark',
  config?: LoadingConfig
): CSSProperties {
  const {
    size = 'md',
    color = theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
    speed = 0.8,
  } = config || {};

  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  const dimension = sizeMap[size];

  return {
    width: dimension,
    height: dimension,
    border: `${Math.max(2, dimension / 8)}px solid transparent`,
    borderTopColor: color,
    borderRadius: '50%',
    animation: `spin ${speed}s linear infinite`,
  };
}

/**
 * 获取 Dots 动画配置
 * 
 * 三点跳跃动画
 */
export function getDotsAnimationConfig(speed = 1.2) {
  return {
    dot1: {
      animationDelay: '0s',
      animationDuration: `${speed}s`,
    },
    dot2: {
      animationDelay: `${speed / 6}s`,
      animationDuration: `${speed}s`,
    },
    dot3: {
      animationDelay: `${speed / 3}s`,
      animationDuration: `${speed}s`,
    },
  };
}

/**
 * 获取 Pulse 动画样式
 * 
 * 脉冲呼吸动画
 */
export function getPulseStyle(
  theme: ScrollbarTheme = 'dark',
  config?: LoadingConfig
): CSSProperties {
  const {
    color = theme === 'dark' ? 'rgba(101, 187, 233, 0.6)' : 'rgba(0, 122, 255, 0.5)',
    speed = 1.5,
  } = config || {};

  return {
    backgroundColor: color,
    animation: `pulse ${speed}s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
  };
}

// ============================================
// 4. Skeleton 加载占位
// ============================================

/**
 * Skeleton 配置
 */
export interface SkeletonConfig {
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
  /** 圆角 */
  borderRadius?: string | number;
  /** 动画速度 (秒) */
  speed?: number;
  /** 是否显示动画 */
  animated?: boolean;
}

/**
 * 获取 Skeleton 样式
 * 
 * 闪烁渐变动画
 * 
 * @example
 * <div style={getSkeletonStyle('dark', { width: '100%', height: 20 })}>
 */
export function getSkeletonStyle(
  theme: ScrollbarTheme = 'dark',
  config?: SkeletonConfig
): CSSProperties {
  const {
    width = '100%',
    height = 20,
    borderRadius = 8,
    speed = 1.5,
    animated = true,
  } = config || {};

  const baseColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
  const shimmerColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.10)';

  return {
    width,
    height,
    borderRadius,
    backgroundColor: baseColor,
    backgroundImage: animated
      ? `linear-gradient(90deg, ${baseColor} 0%, ${shimmerColor} 50%, ${baseColor} 100%)`
      : 'none',
    backgroundSize: '200% 100%',
    animation: animated ? `shimmer ${speed}s ease-in-out infinite` : 'none',
  };
}

/**
 * Skeleton 预设形状
 */
export const skeletonPresets = {
  // 文本行
  textLine: (theme: ScrollbarTheme = 'dark') =>
    getSkeletonStyle(theme, { width: '100%', height: 16, borderRadius: 4 }),

  // 标题
  heading: (theme: ScrollbarTheme = 'dark') =>
    getSkeletonStyle(theme, { width: '60%', height: 24, borderRadius: 6 }),

  // 圆形头像
  avatar: (theme: ScrollbarTheme = 'dark', size: number = 40) =>
    getSkeletonStyle(theme, { width: size, height: size, borderRadius: '50%' }),

  // 矩形卡片
  card: (theme: ScrollbarTheme = 'dark') =>
    getSkeletonStyle(theme, { width: '100%', height: 200, borderRadius: 12 }),

  // 按钮
  button: (theme: ScrollbarTheme = 'dark') =>
    getSkeletonStyle(theme, { width: 120, height: 40, borderRadius: 8 }),

  // 徽章
  badge: (theme: ScrollbarTheme = 'dark') =>
    getSkeletonStyle(theme, { width: 60, height: 24, borderRadius: 12 }),
};

// ============================================
// 5. Empty 空状态
// ============================================

/**
 * Empty 状态类型
 */
export type EmptyType = 'no-data' | 'no-results' | 'no-connection' | 'error' | 'success';

/**
 * Empty 配置
 */
export interface EmptyConfig {
  /** 图标 */
  icon?: string;
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 操作按钮文本 */
  actionText?: string;
  /** 图标颜色 */
  iconColor?: string;
}

/**
 * Empty 状态预设
 */
export const emptyStatePresets: Record<EmptyType, EmptyConfig> = {
  'no-data': {
    icon: '📭',
    title: '暂无数据',
    description: '这里还没有任何内容',
    actionText: '刷新',
    iconColor: '#94A3B8',
  },
  'no-results': {
    icon: '🔍',
    title: '未找到结果',
    description: '尝试使用不同的关键词搜索',
    actionText: '清空筛选',
    iconColor: '#64748B',
  },
  'no-connection': {
    icon: '📡',
    title: '连接失败',
    description: '请检查网络连接后重试',
    actionText: '重新连接',
    iconColor: '#EF4444',
  },
  'error': {
    icon: '⚠️',
    title: '出错了',
    description: '发生了一些错误，请稍后重试',
    actionText: '重试',
    iconColor: '#F59E0B',
  },
  'success': {
    icon: '✅',
    title: '完成',
    description: '操作已成功完成',
    actionText: '返回',
    iconColor: '#10B981',
  },
};

/**
 * 获取 Empty 状态配置
 */
export function getEmptyStateConfig(type: EmptyType): EmptyConfig {
  return emptyStatePresets[type];
}

// ============================================
// CSS 关键帧动画
// ============================================

/**
 * 生成 CSS 关键帧动画字符串
 * 
 * 需要在全局 CSS 中定义这些动画
 */
export const cssAnimations = {
  // 旋转动画
  spin: `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `,

  // 脉冲动画
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,

  // 闪烁动画
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `,

  // 跳跃动画
  bounce: `
    @keyframes bounce {
      0%, 80%, 100% { transform: translateY(0); }
      40% { transform: translateY(-8px); }
    }
  `,

  // 淡入动画
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  // 滑入动画
  slideIn: `
    @keyframes slideIn {
      from { transform: translateY(10px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
};

// ============================================
// 辅助工具函数
// ============================================

/**
 * 检测是否支持自定义滚动条
 */
export function supportsCustomScrollbar(): boolean {
  if (typeof window === 'undefined') return false;

  // 检测 WebKit 前缀
  const element = document.createElement('div');
  const style = element.style;

  return (
    'scrollbarWidth' in style ||
    'WebkitOverflowScrolling' in style
  );
}

/**
 * 生成随机 Skeleton 宽度
 * 
 * 用于模拟真实文本宽度变化
 */
export function getRandomSkeletonWidth(min = 60, max = 100): string {
  const width = Math.floor(Math.random() * (max - min + 1)) + min;
  return `${width}%`;
}

/**
 * 延迟加载辅助函数
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
