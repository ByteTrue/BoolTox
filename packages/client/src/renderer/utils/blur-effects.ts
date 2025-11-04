/**
 * 背景模糊增强工具
 * 
 * 提供统一的背景模糊效果，遵循 Apple 设计规范
 * 支持多层级模糊、动态模糊、性能优化
 */

import { CSSProperties } from 'react';

/**
 * 模糊强度等级
 */
export type BlurIntensity = 'subtle' | 'light' | 'medium' | 'strong' | 'ultra';

/**
 * 模糊层级类型
 */
export type BlurLayer = 
  | 'titlebar'     // 标题栏模糊
  | 'sidebar'      // 侧边栏模糊
  | 'panel'        // 面板模糊
  | 'modal'        // 模态框模糊
  | 'dropdown'     // 下拉菜单模糊
  | 'tooltip'      // 提示框模糊
  | 'card'         // 卡片模糊
  | 'overlay';     // 遮罩层模糊

/**
 * 模糊配置映射
 * 
 * 参考 Apple Design Resources:
 * - macOS: systemUltraThinMaterial (blur: 80px)
 * - macOS: systemThinMaterial (blur: 60px)
 * - macOS: systemMaterial (blur: 40px)
 * - macOS: systemThickMaterial (blur: 30px)
 * - iOS: ultraThinMaterial (blur: 40-60px)
 */
const BLUR_CONFIG: Record<BlurLayer, {
  blur: number;
  brightness: { light: number; dark: number };
  saturation: number;
  opacity: { light: number; dark: number };
}> = {
  titlebar: {
    blur: 60,
    brightness: { light: 1.05, dark: 1.1 },
    saturation: 1.8,
    opacity: { light: 0.75, dark: 0.88 },
  },
  sidebar: {
    blur: 40,
    brightness: { light: 1.02, dark: 1.05 },
    saturation: 1.6,
    opacity: { light: 0.65, dark: 0.78 },
  },
  panel: {
    blur: 30,
    brightness: { light: 1.0, dark: 1.02 },
    saturation: 1.4,
    opacity: { light: 0.55, dark: 0.68 },
  },
  modal: {
    blur: 20,
    brightness: { light: 0.95, dark: 0.9 },
    saturation: 1.2,
    opacity: { light: 0.8, dark: 0.85 },
  },
  dropdown: {
    blur: 24,
    brightness: { light: 1.05, dark: 1.08 },
    saturation: 1.5,
    opacity: { light: 0.85, dark: 0.9 },
  },
  tooltip: {
    blur: 16,
    brightness: { light: 1.1, dark: 1.15 },
    saturation: 1.3,
    opacity: { light: 0.9, dark: 0.95 },
  },
  card: {
    blur: 12,
    brightness: { light: 1.0, dark: 1.0 },
    saturation: 1.2,
    opacity: { light: 0.5, dark: 0.6 },
  },
  overlay: {
    blur: 12,
    brightness: { light: 0.85, dark: 0.7 },
    saturation: 1.0,
    opacity: { light: 0.4, dark: 0.6 },
  },
};

/**
 * 强度系数映射
 */
const INTENSITY_MULTIPLIER: Record<BlurIntensity, number> = {
  subtle: 0.5,
  light: 0.75,
  medium: 1.0,
  strong: 1.5,
  ultra: 2.0,
};

/**
 * 获取背景模糊样式
 * 
 * @param layer - 模糊层级
 * @param theme - 主题模式
 * @param intensity - 模糊强度（可选）
 * @param customBlur - 自定义模糊值（可选，会覆盖默认配置）
 * @returns CSS 样式对象
 */
export function getBlurStyle(
  layer: BlurLayer,
  theme: 'light' | 'dark',
  intensity: BlurIntensity = 'medium',
  customBlur?: number
): CSSProperties {
  const config = BLUR_CONFIG[layer];
  const multiplier = INTENSITY_MULTIPLIER[intensity];
  
  const blur = customBlur ?? config.blur * multiplier;
  const brightness = config.brightness[theme];
  const saturation = config.saturation;
  const opacity = config.opacity[theme];

  return {
    backdropFilter: `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`,
    WebkitBackdropFilter: `blur(${blur}px) brightness(${brightness}) saturate(${saturation})`,
    backgroundColor: theme === 'dark'
      ? `rgba(28, 30, 35, ${opacity})`
      : `rgba(255, 255, 255, ${opacity})`,
  };
}

/**
 * 获取模态框遮罩模糊样式
 * 
 * @param theme - 主题模式
 * @param intensity - 模糊强度
 * @returns CSS 样式对象
 */
export function getModalBackdropBlur(
  theme: 'light' | 'dark',
  intensity: BlurIntensity = 'medium'
): CSSProperties {
  return {
    ...getBlurStyle('overlay', theme, intensity),
    backgroundColor: theme === 'dark'
      ? 'rgba(0, 0, 0, 0.6)'
      : 'rgba(0, 0, 0, 0.4)',
  };
}

/**
 * 获取下拉菜单模糊样式
 * 
 * @param theme - 主题模式
 * @returns CSS 样式对象
 */
export function getDropdownBlur(theme: 'light' | 'dark'): CSSProperties {
  return {
    ...getBlurStyle('dropdown', theme, 'medium'),
    boxShadow: theme === 'dark'
      ? '0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
      : '0 10px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
  };
}

/**
 * 获取提示框模糊样式
 * 
 * @param theme - 主题模式
 * @returns CSS 样式对象
 */
export function getTooltipBlur(theme: 'light' | 'dark'): CSSProperties {
  return {
    ...getBlurStyle('tooltip', theme, 'strong'),
    boxShadow: theme === 'dark'
      ? '0 4px 16px rgba(0, 0, 0, 0.4)'
      : '0 4px 16px rgba(0, 0, 0, 0.15)',
  };
}

/**
 * 动态模糊 CSS 类名生成器
 * 用于 Tailwind CSS
 */
export function getBlurClasses(
  layer: BlurLayer,
  intensity: BlurIntensity = 'medium'
): string {
  const baseClasses = 'backdrop-blur backdrop-brightness backdrop-saturate';
  
  // 根据层级和强度生成 Tailwind 类名
  const intensityMap = {
    subtle: 'backdrop-blur-sm',
    light: 'backdrop-blur-md',
    medium: 'backdrop-blur-lg',
    strong: 'backdrop-blur-xl',
    ultra: 'backdrop-blur-2xl',
  };

  return `${baseClasses} ${intensityMap[intensity]}`;
}

/**
 * 检测浏览器是否支持 backdrop-filter
 */
export function supportsBackdropFilter(): boolean {
  if (typeof window === 'undefined') return false;
  
  return (
    CSS.supports('backdrop-filter', 'blur(1px)') ||
    CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
  );
}

/**
 * 为不支持 backdrop-filter 的浏览器提供降级方案
 */
export function getBlurFallbackStyle(
  layer: BlurLayer,
  theme: 'light' | 'dark'
): CSSProperties {
  const config = BLUR_CONFIG[layer];
  const opacity = config.opacity[theme];

  // 不支持模糊时，增加不透明度以保证可读性
  const fallbackOpacity = Math.min(opacity + 0.15, 0.98);

  return {
    backgroundColor: theme === 'dark'
      ? `rgba(28, 30, 35, ${fallbackOpacity})`
      : `rgba(255, 255, 255, ${fallbackOpacity})`,
  };
}

/**
 * 智能模糊样式（自动检测支持情况）
 */
export function getSmartBlurStyle(
  layer: BlurLayer,
  theme: 'light' | 'dark',
  intensity: BlurIntensity = 'medium'
): CSSProperties {
  if (supportsBackdropFilter()) {
    return getBlurStyle(layer, theme, intensity);
  } else {
    return getBlurFallbackStyle(layer, theme);
  }
}

/**
 * 分层模糊效果
 * 用于多层嵌套的模糊元素
 */
export interface LayeredBlurConfig {
  base: BlurLayer;
  overlay?: BlurLayer;
  intensity?: BlurIntensity;
}

export function getLayeredBlurStyle(
  config: LayeredBlurConfig,
  theme: 'light' | 'dark'
): {
  base: CSSProperties;
  overlay?: CSSProperties;
} {
  return {
    base: getBlurStyle(config.base, theme, config.intensity),
    overlay: config.overlay
      ? getBlurStyle(config.overlay, theme, config.intensity)
      : undefined,
  };
}

/**
 * 动画模糊变体（用于 Framer Motion）
 */
export const blurAnimationVariants = {
  titlebar: {
    initial: {
      backdropFilter: 'blur(0px) brightness(1) saturate(1)',
      opacity: 0,
    },
    animate: {
      backdropFilter: 'blur(60px) brightness(1.05) saturate(1.8)',
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  },
  modal: {
    initial: {
      backdropFilter: 'blur(0px)',
      opacity: 0,
    },
    animate: {
      backdropFilter: 'blur(20px)',
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut',
      },
    },
    exit: {
      backdropFilter: 'blur(0px)',
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn',
      },
    },
  },
  dropdown: {
    initial: {
      backdropFilter: 'blur(0px)',
      opacity: 0,
      scale: 0.95,
    },
    animate: {
      backdropFilter: 'blur(24px)',
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.25,
        ease: 'easeOut',
      },
    },
    exit: {
      backdropFilter: 'blur(0px)',
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: 'easeIn',
      },
    },
  },
};
