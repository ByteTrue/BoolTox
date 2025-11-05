/**
 * 动画预设组合 - 开箱即用的动画配置
 * 
 * 使用方式:
 * ```tsx
 * import { cardHover } from '@/utils/animation-presets';
 * 
 * <motion.div {...cardHover}>
 *   卡片内容
 * </motion.div>
 * ```
 * 
 * @author Animation System
 * @version 1.0.0
 */

import { DURATION, SPRING, TRANSFORM, getDuration, getSpring } from '@/config/animation.config';
import type { MotionProps } from 'framer-motion';

/**
 * 卡片悬停动画 - 最常用
 * 
 * 效果: 向上浮动 4px + 点击缩小
 * 适用: 中小型卡片、列表项
 */
export const cardHover: MotionProps = {
  whileHover: { y: TRANSFORM.hover.lift },
  whileTap: { scale: TRANSFORM.hover.scale },
  transition: { 
    type: 'spring', 
    ...getSpring(SPRING.swift),
  },
};

/**
 * 大卡片悬停动画
 * 
 * 效果: 向上浮动 6px (更明显)
 * 适用: 大型卡片、重要模块
 */
export const cardHoverLarge: MotionProps = {
  whileHover: { y: TRANSFORM.hover.liftLarge },
  transition: { 
    type: 'spring', 
    ...getSpring(SPRING.swift),
  },
};

/**
 * 按钮交互动画
 * 
 * 效果: 点击时缩小至 0.98
 * 适用: 所有按钮元素
 */
export const buttonInteraction: MotionProps = {
  whileTap: { scale: TRANSFORM.hover.scale },
  transition: { 
    type: 'spring', 
    ...getSpring(SPRING.swift),
  },
};

/**
 * 图标按钮交互
 * 
 * 效果: 悬停微妙放大 + 点击缩小
 * 适用: 图标按钮、工具按钮
 */
export const iconButtonInteraction: MotionProps = {
  whileHover: { scale: TRANSFORM.focus.scale },
  whileTap: { scale: TRANSFORM.active.scale },
  transition: { 
    type: 'spring', 
    ...getSpring(SPRING.swift),
  },
};

/**
 * 导航项动画 (进场)
 * 
 * 效果: 从左侧滑入 + 淡入
 * 适用: 侧边栏导航项
 */
export const navItemAnimation: MotionProps = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { 
    type: 'spring', 
    ...getSpring(SPRING.gentle),
  },
};

/**
 * 淡入动画变体
 * 
 * 使用方式:
 * ```tsx
 * <motion.div variants={fadeInVariants} initial="hidden" animate="visible">
 * ```
 */
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: getDuration(DURATION.fast) / 1000,
    },
  },
};

/**
 * 向上滑入动画变体
 * 
 * 效果: 从下方滑入 + 淡入
 * 适用: 模态框、抽屉、通知
 */
export const slideUpVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      ...getSpring(SPRING.gentle),
    },
  },
};

/**
 * 向下滑入动画变体
 * 
 * 效果: 从上方滑入 + 淡入
 * 适用: 下拉菜单、提示条
 */
export const slideDownVariants = {
  hidden: { 
    opacity: 0, 
    y: -20,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      type: 'spring',
      ...getSpring(SPRING.gentle),
    },
  },
};

/**
 * 缩放进入动画变体
 * 
 * 效果: 从小到大 + 淡入
 * 适用: 弹窗、对话框
 */
export const scaleInVariants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { 
      type: 'spring',
      ...getSpring(SPRING.swift),
    },
  },
};

/**
 * 交错列表动画容器
 * 
 * 使用方式:
 * ```tsx
 * <motion.div variants={staggerContainer}>
 *   <motion.div variants={staggerItem}>项目 1</motion.div>
 *   <motion.div variants={staggerItem}>项目 2</motion.div>
 * </motion.div>
 * ```
 */
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/**
 * 交错列表子项动画
 */
export const staggerItem = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      ...getSpring(SPRING.gentle),
    },
  },
};

/**
 * 页面切换动画 - 淡入淡出
 */
export const pageTransition = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: {
    duration: getDuration(DURATION.normal) / 1000,
  },
};

/**
 * 页面切换动画 - 滑动
 */
export const pageTransitionSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: {
    type: 'spring',
    ...getSpring(SPRING.gentle),
  },
};
