/**
 * 统一的动画配置系统
 * 基于 Apple Human Interface Guidelines 和 2025 UI 趋势
 */

import type { Transition, Variants } from 'framer-motion';

/**
 * 缓动曲线（Apple 标准）
 */
export const EASING = {
  // 标准曲线（推荐用于大多数动画）
  apple: [0.4, 0.0, 0.2, 1] as const,
  // 进入曲线（元素进场）
  appleIn: [0.4, 0.0, 1, 1] as const,
  // 退出曲线（元素退场）
  appleOut: [0.0, 0.0, 0.2, 1] as const,
  // 柔和曲线（温和过渡）
  gentle: [0.25, 0.1, 0.25, 1] as const,
} as const;

/**
 * 动画时间（毫秒）
 */
export const DURATION = {
  instant: 0.15,  // 150ms - 微交互
  fast: 0.25,     // 250ms - 小元素
  normal: 0.35,   // 350ms - 标准
  slow: 0.5,      // 500ms - 大型元素
} as const;

/**
 * Spring 弹簧配置
 */
export const SPRING = {
  // 快速敏锐（按钮、小卡片）
  swift: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
  },
  // 温和平滑（大卡片、面板）
  gentle: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  // 弹性反馈（有趣的交互）
  bouncy: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 20,
  },
} as const;

/**
 * 交错延迟（列表项）
 */
export const STAGGER = {
  fast: 0.03,     // 30ms
  normal: 0.05,   // 50ms
  slow: 0.08,     // 80ms
} as const;

// ==================== 常用动画变体 ====================

/**
 * 淡入淡出
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 向上滑入（页面、卡片）
 */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

/**
 * 向下滑入（下拉菜单）
 */
export const slideDown: Variants = {
  initial: { opacity: 0, y: -10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/**
 * 缩放进入（模态框）
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/**
 * 从右侧滑入（Toast、侧边栏）
 */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 100 },
};

/**
 * 从左侧滑入（移动菜单）
 */
export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -100 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -100 },
};

// ==================== 容器和子元素交错 ====================

/**
 * 交错容器（优雅流畅，参考首页成功案例）
 */
export const staggerContainer: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,   // 50ms，优雅节奏
      delayChildren: 0.1,      // 100ms 初始延迟，让页面呼吸
    },
  },
  exit: { opacity: 0 },
};

/**
 * 交错子元素（明显的上浮感）
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },  // 20px，清晰可见的上浮
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// ==================== 组件级动画配置 ====================

/**
 * 卡片 Hover/Tap 动画（优雅明显）
 */
export const cardAnimation = {
  whileHover: {
    y: -4,
    scale: 1.01,
    transition: { duration: 0.2, ease: [0.4, 0.0, 0.2, 1] },
  },
  whileTap: {
    scale: 0.98,
    transition: { duration: 0.15, ease: [0.4, 0.0, 0.2, 1] },
  },
};

/**
 * 按钮动画
 */
export const buttonAnimation = {
  whileHover: {
    scale: 1.02,
    transition: SPRING.swift,
  },
  whileTap: {
    scale: 0.98,
    transition: SPRING.swift,
  },
};

/**
 * 图标按钮动画
 */
export const iconButtonAnimation = {
  whileHover: {
    scale: 1.1,
    rotate: 5,
    transition: SPRING.swift,
  },
  whileTap: {
    scale: 0.9,
    rotate: -5,
    transition: SPRING.swift,
  },
};

/**
 * 页面切换动画（优雅流畅）
 */
export const pageTransition: Transition = {
  duration: 0.35,              // 350ms，优雅舒适
  ease: [0.4, 0.0, 0.2, 1],   // Apple 标准曲线
};

/**
 * 页面切换变体（保持状态，不再额外过渡，避免二次阶段感）
 */
export const pageVariants: Variants = {
  initial: { opacity: 1 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

// ==================== 辅助函数 ====================

/**
 * 检测用户是否偏好减少动画
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * 获取安全的过渡配置（考虑减少动画偏好）
 * @param transition 原始过渡配置
 * @returns 安全的过渡配置
 */
export function getSafeTransition(transition: Transition): Transition {
  if (prefersReducedMotion()) {
    return {
      duration: 0.01, // 几乎无延迟
      ease: 'linear' as const,
    };
  }
  return transition;
}

/**
 * 获取安全的动画变体（考虑减少动画偏好）
 * @param variants 原始变体
 * @returns 安全的变体（减少动画时禁用动画）
 */
export function getSafeVariants(variants: Variants): Variants | false {
  if (prefersReducedMotion()) {
    return false;
  }
  return variants;
}

// ==================== 预设动画组合 ====================

/**
 * Toast 通知动画
 */
export const toastAnimation: Variants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

/**
 * 模态框背景动画
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * 模态框内容动画
 */
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.9, y: 20 },
};

/**
 * 抽屉菜单动画（从侧边滑入）
 */
export const drawerAnimation: Variants = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

/**
 * 导航项动画
 */
export const navItemAnimation: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

/**
 * 列表加载骨架动画
 */
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};

// ==================== 导出默认配置 ====================

export const ANIMATION_CONFIG = {
  easing: EASING,
  duration: DURATION,
  spring: SPRING,
  stagger: STAGGER,
} as const;

export default ANIMATION_CONFIG;
