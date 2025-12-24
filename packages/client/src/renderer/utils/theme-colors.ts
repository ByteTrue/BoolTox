/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 主题色系统
 * 统一管理整个应用的颜色
 * 双品牌色: 蓝色 (Tailwind Blue) + 橙色 (Tailwind Orange)
 */

export const THEME_COLORS = {
  // 主题色 - 经典蓝色 (Tailwind Blue)
  primary: {
    lighter: 'rgb(219, 234, 254)', // Blue 100 #DBEAFE
    light: 'rgb(96, 165, 250)',    // Blue 400 #60A5FA
    base: 'rgb(59, 130, 246)',     // Blue 500 #3B82F6
    dark: 'rgb(37, 99, 235)',      // Blue 600 #2563EB
    darker: 'rgb(29, 78, 216)',    // Blue 700 #1D4ED8
  },

  // 副品牌色 - 橙色 (Tailwind Orange)
  secondary: {
    lighter: 'rgb(254, 215, 170)', // Orange 200 #FED7AA
    light: 'rgb(251, 146, 60)',    // Orange 400 #FB923C
    base: 'rgb(249, 115, 22)',     // Orange 500 #F97316
    dark: 'rgb(234, 88, 12)',      // Orange 600 #EA580C
    darker: 'rgb(194, 65, 12)',    // Orange 700 #C2410C
  },

  // 中性色 - Slate 灰色
  neutral: {
    light: 'rgb(148, 163, 184)',   // Slate 400 #94A3B8
    base: 'rgb(100, 116, 139)',    // Slate 500 #64748B
    dark: 'rgb(71, 85, 105)',      // Slate 600 #475569
    darker: 'rgb(51, 65, 85)',     // Slate 700 #334155
  },
} as const;

/**
 * 获取主题色的 rgba 格式
 */
export function getPrimaryRgba(opacity: number): string {
  return `rgba(96, 165, 250, ${opacity})`; // blue-400
}

/**
 * 获取副品牌色的 rgba 格式
 */
export function getSecondaryRgba(opacity: number): string {
  return `rgba(249, 115, 22, ${opacity})`; // orange-500
}

/**
 * 获取渐变背景
 */
export function getGradientBg(theme: 'dark' | 'light'): string {
  if (theme === 'dark') {
    return 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900';
  }
  return 'bg-gradient-to-br from-blue-50 via-orange-50 to-blue-100';
}

/**
 * 获取品牌渐变(用于Logo、重要按钮等)
 */
export function getBrandGradient(): string {
  return 'from-blue-400 to-orange-500';
}

/**
 * 获取主题色文字颜色
 */
export function getPrimaryTextColor(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'text-blue-300' : 'text-blue-600';
}

/**
 * 获取副品牌色文字颜色
 */
export function getSecondaryTextColor(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'text-orange-300' : 'text-orange-600';
}

/**
 * 获取主题色边框颜色
 */
export function getPrimaryBorderColor(theme: 'dark' | 'light', opacity: number = 0.3): string {
  return theme === 'dark'
    ? `rgba(147, 197, 253, ${opacity})` // blue-300
    : `rgba(59, 130, 246, ${opacity})`; // blue-500
}

/**
 * 获取主题色阴影(使用统一阴影系统)
 */
export function getPrimaryShadow(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'shadow-unified-xl-dark' : 'shadow-unified-xl';
}
