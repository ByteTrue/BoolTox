/**
 * 触觉反馈模拟系统
 * 
 * 通过视觉动画模拟物理触觉反馈，增强交互体验
 * 参考 Apple Taptic Engine 的反馈模式
 */

import { Variants } from 'framer-motion';
import { SPRING, getDuration } from '../config/animation.config';

/**
 * 触觉反馈强度类型
 */
export type HapticIntensity = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';

/**
 * 触觉反馈模式
 */
export type HapticPattern = 'impact' | 'selection' | 'notification' | 'success' | 'warning' | 'error';

/**
 * 按钮点击触觉反馈
 * 模拟物理按下 + 快速回弹
 */
export const buttonTapFeedback: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.95,
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(100),
    },
  },
  release: {
    scale: 1,
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(200),
    },
  },
};

/**
 * 图标按钮触觉反馈（更轻微）
 */
export const iconButtonTapFeedback: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.92,
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(80),
    },
  },
  release: {
    scale: 1,
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(180),
    },
  },
};

/**
 * 重按钮触觉反馈（更明显）
 */
export const primaryButtonTapFeedback: Variants = {
  initial: { scale: 1 },
  tap: { 
    scale: 0.97,
    y: 1,
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(100),
    },
  },
  release: {
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(220),
    },
  },
};

/**
 * Toggle 开关触觉反馈
 * 带有轻微震动效果的切换动画
 */
export const toggleHapticFeedback: Variants = {
  off: {
    x: 0,
    scale: 1,
  },
  on: {
    x: [0, 22, 20], // 先过冲再回弹，模拟"咔嚓"声
    scale: [1, 1.15, 1], // 轻微放大
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(300),
    },
  },
};

/**
 * Checkbox 勾选触觉反馈
 */
export const checkboxHapticFeedback: Variants = {
  unchecked: {
    scale: 1,
    rotate: 0,
  },
  checked: {
    scale: [0.8, 1.2, 1], // 压缩→弹出
    rotate: [0, -5, 0], // 轻微旋转
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(350),
    },
  },
};

/**
 * 拖拽操作触觉反馈
 * 模拟阻尼效果
 */
export const dragHapticFeedback = {
  drag: {
    // 拖拽时轻微缩小，模拟"抓取"感觉
    scale: 0.98,
    rotate: 1.5,
    transition: {
      type: 'spring',
      ...SPRING.gentle,
      duration: getDuration(150),
    },
  },
  drop: {
    // 释放时回弹 + 轻微震动
    scale: [0.98, 1.05, 1],
    rotate: [1.5, -1.5, 0],
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(400),
    },
  },
};

/**
 * 滚动边界触觉反馈
 * 橡皮筋回弹效果
 */
export const scrollBounceHapticFeedback = {
  overscroll: {
    // 超出滚动边界时的阻尼效果
    scale: [1, 0.98, 1],
    transition: {
      type: 'spring',
      ...SPRING.gentle,
      duration: getDuration(300),
    },
  },
  bounce: {
    // 释放后的回弹
    y: [10, -5, 0],
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(500),
    },
  },
};

/**
 * 列表项选择触觉反馈
 */
export const listItemSelectFeedback: Variants = {
  initial: { scale: 1, backgroundColor: 'transparent' },
  select: {
    scale: [1, 0.98, 1],
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(200),
    },
  },
};

/**
 * 卡片点击触觉反馈
 */
export const cardTapFeedback: Variants = {
  initial: { scale: 1, y: 0 },
  tap: {
    scale: 0.98,
    y: 2,
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(120),
    },
  },
  release: {
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(250),
    },
  },
};

/**
 * 通知到达触觉反馈
 * 模拟"震动"效果
 */
export const notificationArrivalFeedback: Variants = {
  initial: { x: 0, scale: 1 },
  arrive: {
    x: [0, -2, 2, -2, 2, 0], // 左右震动
    scale: [1, 1.02, 1],
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(400),
    },
  },
};

/**
 * 成功操作触觉反馈
 */
export const successHapticFeedback: Variants = {
  initial: { scale: 1, rotate: 0 },
  success: {
    scale: [1, 1.15, 1],
    rotate: [0, 10, -10, 0],
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(500),
    },
  },
};

/**
 * 错误操作触觉反馈
 * 模拟"拒绝"的震动
 */
export const errorHapticFeedback: Variants = {
  initial: { x: 0, rotate: 0 },
  error: {
    x: [-10, 10, -10, 10, -5, 5, 0],
    rotate: [-2, 2, -2, 2, 0],
    transition: {
      type: 'spring',
      ...SPRING.swift,
      duration: getDuration(500),
    },
  },
};

/**
 * 加载旋转触觉反馈
 */
export const loadingSpinFeedback: Variants = {
  initial: { rotate: 0 },
  spin: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * 脉冲触觉反馈
 * 用于吸引注意力
 */
export const pulseFeedback: Variants = {
  initial: { scale: 1, opacity: 1 },
  pulse: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

/**
 * 长按触觉反馈
 * 模拟积累压力
 */
export const longPressFeedback: Variants = {
  initial: { scale: 1 },
  pressing: {
    scale: 0.93,
    transition: {
      type: 'spring',
      ...SPRING.gentle,
      duration: getDuration(800),
    },
  },
  release: {
    scale: [0.93, 1.08, 1],
    transition: {
      type: 'spring',
      ...SPRING.bouncy,
      duration: getDuration(400),
    },
  },
};

/**
 * 根据强度生成触觉反馈配置
 */
export function getHapticConfig(intensity: HapticIntensity): {
  scale: number;
  duration: number;
  spring: { stiffness: number; damping: number };
} {
  switch (intensity) {
    case 'light':
      return {
        scale: 0.98,
        duration: getDuration(100),
        spring: SPRING.swift,
      };
    case 'medium':
      return {
        scale: 0.95,
        duration: getDuration(150),
        spring: SPRING.swift,
      };
    case 'heavy':
      return {
        scale: 0.92,
        duration: getDuration(200),
        spring: SPRING.bouncy,
      };
    case 'rigid':
      return {
        scale: 0.97,
        duration: getDuration(80),
        spring: { stiffness: 600, damping: 35 },
      };
    case 'soft':
      return {
        scale: 0.94,
        duration: getDuration(250),
        spring: SPRING.gentle,
      };
  }
}

/**
 * 触觉反馈 Hook (用于手动触发)
 */
export function useTriggerHaptic() {
  const triggerHaptic = (pattern: HapticPattern) => {
    // 在 Electron 中可以调用系统触觉反馈
    // 这里先用动画模拟
    console.log(`[Haptic] Triggered: ${pattern}`);
    
    // 未来可以集成 Electron API
    // if (window.electron?.haptic) {
    //   window.electron.haptic.trigger(pattern);
    // }
  };

  return { triggerHaptic };
}
