/**
 * 统一动画配置系统 - Apple 风格
 * 
 * 设计原则:
 * 1. 所有动画参数必须从此文件引用，确保一致性
 * 2. 使用 GPU 加速属性 (transform, opacity)，避免布局重排
 * 3. 遵循苹果设计规范的缓动曲线和时间层级
 * 
 * @author Animation System
 * @version 1.0.0
 */

/**
 * 缓动曲线 - 基于 Apple Human Interface Guidelines
 */
export const EASING = {
  /** 快速响应 - 用于微交互 (按钮点击、图标切换) */
  swift: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
  
  /** 温和过渡 - 用于卡片、面板 */
  gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  
  /** 标准过渡 - 用于常规动画 */
  standard: 'cubic-bezier(0.4, 0.0, 0.6, 1)',
} as const;

/**
 * 持续时间层级 (毫秒)
 * 
 * 分层策略:
 * - Tier 1 (instant): 微交互，几乎瞬间完成
 * - Tier 2 (fast): 小元素交互，快速但可感知
 * - Tier 3 (normal): 面板切换，标准流畅度
 * - Tier 4 (slow): 背景效果，缓慢优雅
 */
export const DURATION = {
  /** 150ms - 微交互 (按钮、开关、图标) */
  instant: 150,
  
  /** 250ms - 快速交互 (卡片、列表项、小按钮) */
  fast: 250,
  
  /** 350ms - 标准交互 (面板、抽屉、导航) */
  normal: 350,
  
  /** 500ms - 慢速交互 (背景、主题切换、大型转换) */
  slow: 500,
} as const;

/**
 * Framer Motion Spring 配置
 * 
 * stiffness: 弹簧刚度 (值越大越快)
 * damping: 阻尼系数 (值越大反弹越少)
 */
export const SPRING = {
  /** 快速弹性 - 敏锐响应 */
  swift: { 
    stiffness: 380, 
    damping: 28 
  },
  
  /** 温和弹性 - 平滑过渡 */
  gentle: { 
    stiffness: 300, 
    damping: 30 
  },
  
  /** 活泼弹性 - 明显反弹 (谨慎使用) */
  bouncy: { 
    stiffness: 400, 
    damping: 20 
  },
} as const;

/**
 * 动画变换值
 * 
 * 使用场景:
 * - hover: 悬停状态
 * - active: 激活/按下状态
 * - focus: 聚焦状态
 */
export const TRANSFORM = {
  hover: {
    /** -4px - 小卡片上浮距离 */
    lift: -4,
    
    /** -6px - 大卡片上浮距离 */
    liftLarge: -6,
    
    /** 0.98 - 按钮按下缩放 */
    scale: 0.98,
    
    /** 1.02 - 微妙放大 (谨慎使用，可能导致裁剪) */
    scaleUp: 1.02,
  },
  
  active: {
    /** 0.96 - 激活状态缩放 */
    scale: 0.96,
  },
  
  focus: {
    /** 1.01 - 聚焦状态微妙放大 */
    scale: 1.01,
  },
} as const;

/**
 * 延迟时间 - 用于交错动画
 */
export const DELAY = {
  /** 无延迟 */
  none: 0,
  
  /** 50ms - 微小延迟 */
  tiny: 0.05,
  
  /** 100ms - 小延迟 */
  small: 0.1,
  
  /** 150ms - 中等延迟 */
  medium: 0.15,
  
  /** 200ms - 大延迟 */
  large: 0.2,
} as const;

/**
 * 检测用户是否启用了减少动画偏好
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * 根据用户偏好获取持续时间
 * 如果用户启用了减少动画，返回极短时间
 */
export const getDuration = (duration: number): number => {
  return prefersReducedMotion() ? 1 : duration;
};

/**
 * 根据用户偏好获取 Spring 配置
 * 如果用户启用了减少动画，返回无弹性配置
 */
export const getSpring = (spring: { stiffness: number; damping: number }): { stiffness: number; damping: number } => {
  if (prefersReducedMotion()) {
    return { stiffness: 500, damping: 50 }; // 极快，无反弹
  }
  return spring;
};
