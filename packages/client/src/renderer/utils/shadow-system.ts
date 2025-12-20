/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 统一阴影系统
 * 所有阴影统一为右下角柔和阴影风格
 */

export type ShadowLevel = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type Theme = 'dark' | 'light';

/**
 * 获取统一的右下角柔和阴影
 * @param level 阴影级别
 * @param theme 主题
 * @returns CSS box-shadow 字符串
 */
export function getUnifiedShadow(level: ShadowLevel, theme: Theme): string {
  const shadows: Record<ShadowLevel, { dark: string; light: string }> = {
    sm: {
      dark: '1px 1px 3px rgba(0, 0, 0, 0.2)',
      light: '1px 1px 3px rgba(0, 0, 0, 0.06)',
    },
    md: {
      dark: '2px 2px 6px rgba(0, 0, 0, 0.25)',
      light: '2px 2px 6px rgba(0, 0, 0, 0.08)',
    },
    lg: {
      dark: '3px 3px 8px rgba(0, 0, 0, 0.3)',
      light: '3px 3px 8px rgba(0, 0, 0, 0.1)',
    },
    xl: {
      dark: '4px 4px 12px rgba(0, 0, 0, 0.35)',
      light: '4px 4px 12px rgba(0, 0, 0, 0.12)',
    },
    '2xl': {
      dark: '6px 6px 16px rgba(0, 0, 0, 0.4)',
      light: '6px 6px 16px rgba(0, 0, 0, 0.15)',
    },
  };

  return shadows[level][theme];
}

/**
 * 获取统一的 Tailwind CSS 阴影类名
 * 注意: Tailwind 默认阴影不是右下角的，需要自定义
 */
export function getUnifiedShadowClass(level: ShadowLevel): string {
  // 返回对应的自定义类名，需要在 tailwind.config.js 中配置
  return `shadow-unified-${level}`;
}
