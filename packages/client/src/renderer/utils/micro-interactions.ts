/**
 * Apple 风格微交互动画增强
 * 
 * 为常见 UI 组件提供精细的交互反馈动画
 * 参考：macOS Big Sur / iOS 17 设计规范
 * 
 * @version 2.0.0
 */

import type { MotionProps, Variants } from 'framer-motion';
import { DURATION, SPRING, TRANSFORM, getSpring, getDuration } from '@/config/animation.config';

/**
 * 按钮微交互动画 - 增强版
 * 
 * 特性：
 * - Hover: 微妙放大 (1.02) + 阴影增强
 * - Tap: 快速缩小 (0.96) 模拟按下
 * - Focus: 光晕效果（通过 CSS 实现）
 */
export const buttonMicroInteraction: MotionProps = {
  whileHover: { 
    scale: 1.02,
    transition: { 
      type: 'spring', 
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.instant),
    }
  },
  whileTap: { 
    scale: TRANSFORM.active.scale,
    transition: { 
      type: 'spring', 
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.instant),
    }
  },
};

/**
 * 主要操作按钮（Primary）动画
 * 
 * 特性：
 * - Hover: 明显放大 (1.05) + 品牌色光晕
 * - Tap: 按下效果 (0.95)
 * - 适用于 CTA 按钮
 */
export const primaryButtonInteraction: MotionProps = {
  whileHover: { 
    scale: 1.05,
    transition: { 
      type: 'spring', 
      ...getSpring(SPRING.bouncy),
      duration: getDuration(DURATION.instant),
    }
  },
  whileTap: { 
    scale: 0.95,
    transition: { 
      type: 'spring', 
      ...getSpring(SPRING.swift),
      duration: getDuration(50),
    }
  },
};

/**
 * 图标按钮脉冲动画
 * 
 * 特性：
 * - Hover: 旋转 + 缩放
 * - 适用于刷新、关闭等图标按钮
 */
export const iconPulseInteraction: MotionProps = {
  whileHover: { 
    scale: 1.1,
    rotate: [0, -10, 10, 0],
    transition: { 
      scale: {
        type: 'spring', 
        ...getSpring(SPRING.bouncy),
      },
      rotate: {
        duration: getDuration(DURATION.fast) / 1000,
        ease: 'easeInOut',
      }
    }
  },
  whileTap: { 
    scale: 0.9,
    transition: { 
      type: 'spring', 
      ...getSpring(SPRING.swift),
      duration: getDuration(100),
    }
  },
};

/**
 * Toggle 开关动画变体
 * 
 * 使用方式：
 * ```tsx
 * <motion.div
 *   variants={toggleVariants}
 *   initial="off"
 *   animate={isEnabled ? "on" : "off"}
 * >
 * ```
 */
export const toggleVariants: Variants = {
  off: {
    x: 0,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    transition: {
      type: 'spring',
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.fast),
    },
  },
  on: {
    x: 20, // Toggle thumb 移动距离
    backgroundColor: 'rgb(101, 187, 233)', // brand-blue-400
    transition: {
      type: 'spring',
      ...getSpring(SPRING.bouncy),
      duration: getDuration(DURATION.fast),
    },
  },
};

/**
 * 输入框 Focus 动画
 * 
 * 特性：
 * - Focus: 边框光晕 + 微妙放大
 * - Blur: 恢复原状
 */
export const inputFocusVariants: Variants = {
  blur: {
    scale: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.gentle),
      duration: getDuration(DURATION.fast),
    },
  },
  focus: {
    scale: 1.01,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.instant),
    },
  },
};

/**
 * Toast 通知进出场动画
 * 
 * 特性：
 * - 从右侧滑入 + 淡入
 * - 向右滑出 + 淡出
 */
export const toastVariants: Variants = {
  initial: {
    x: 400,
    opacity: 0,
    scale: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.bouncy),
      duration: getDuration(DURATION.normal),
    },
  },
  exit: {
    x: 400,
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: getDuration(DURATION.fast) / 1000,
      ease: 'easeIn',
    },
  },
};

/**
 * Modal/Dialog 进出场动画
 * 
 * 特性：
 * - 缩放 + 淡入
 * - 背景模糊渐变
 */
export const modalVariants: Variants = {
  initial: {
    scale: 0.9,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.gentle),
      duration: getDuration(DURATION.normal),
    },
  },
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      duration: getDuration(DURATION.fast) / 1000,
      ease: 'easeOut',
    },
  },
};

/**
 * Modal 背景遮罩动画
 */
export const modalBackdropVariants: Variants = {
  initial: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
  },
  animate: {
    opacity: 1,
    backdropFilter: 'blur(12px)',
    transition: {
      duration: getDuration(DURATION.normal) / 1000,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    backdropFilter: 'blur(0px)',
    transition: {
      duration: getDuration(DURATION.fast) / 1000,
      ease: 'easeIn',
    },
  },
};

/**
 * Dropdown 菜单动画
 * 
 * 特性：
 * - 从上方滑下 + 淡入
 * - 向上滑出 + 淡出
 */
export const dropdownVariants: Variants = {
  initial: {
    y: -10,
    opacity: 0,
    scale: 0.95,
  },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.fast),
    },
  },
  exit: {
    y: -10,
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: getDuration(DURATION.instant) / 1000,
      ease: 'easeIn',
    },
  },
};

/**
 * 列表项交错动画（Stagger）
 * 
 * 使用方式：
 * ```tsx
 * <motion.ul variants={listContainerVariants} initial="hidden" animate="visible">
 *   <motion.li variants={listItemVariants}>Item 1</motion.li>
 *   <motion.li variants={listItemVariants}>Item 2</motion.li>
 * </motion.ul>
 * ```
 */
export const listContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05, // 每个子元素延迟 50ms
      delayChildren: 0.1,    // 整体延迟 100ms
    },
  },
};

export const listItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.swift),
    },
  },
};

/**
 * 卡片 Flip 翻转动画
 * 
 * 用于卡片正反面切换
 */
export const cardFlipVariants: Variants = {
  front: {
    rotateY: 0,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.gentle),
      duration: getDuration(DURATION.normal),
    },
  },
  back: {
    rotateY: 180,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.gentle),
      duration: getDuration(DURATION.normal),
    },
  },
};

/**
 * 数字计数器动画
 * 
 * 用于统计数字的变化动画
 */
export const counterVariants: Variants = {
  initial: {
    scale: 1,
  },
  update: {
    scale: [1, 1.2, 1],
    transition: {
      duration: getDuration(DURATION.fast) / 1000,
      ease: 'easeInOut',
    },
  },
};

/**
 * Checkbox/Radio 选中动画
 */
export const checkboxVariants: Variants = {
  unchecked: {
    scale: 0,
    opacity: 0,
  },
  checked: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.bouncy),
      duration: getDuration(DURATION.fast),
    },
  },
};

/**
 * 进度条填充动画
 * 
 * 使用方式：
 * ```tsx
 * <motion.div
 *   initial={{ width: 0 }}
 *   animate={{ width: `${progress}%` }}
 *   transition={progressTransition}
 * />
 * ```
 */
export const progressTransition = {
  duration: getDuration(DURATION.normal) / 1000,
  ease: 'easeOut',
};

/**
 * Skeleton 加载动画（脉冲效果）
 */
export const skeletonVariants: Variants = {
  pulse: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * Badge 数字变化动画
 * 
 * 用于通知徽章等
 */
export const badgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: [0, 1.2, 1],
    opacity: 1,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.bouncy),
      duration: getDuration(DURATION.fast),
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: getDuration(DURATION.instant) / 1000,
    },
  },
};

/**
 * 工具提示（Tooltip）动画
 */
export const tooltipVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.swift),
      duration: getDuration(DURATION.instant),
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 10,
    transition: {
      duration: getDuration(50) / 1000,
    },
  },
};
