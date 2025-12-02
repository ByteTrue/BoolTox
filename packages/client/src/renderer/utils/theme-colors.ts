/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 主题色系统
 * 统一管理整个应用的颜色
 */

export const THEME_COLORS = {
  // 主题色 - 淡蓝色 #65BBE9
  primary: {
    light: 'rgb(138, 206, 241)',   // 更浅的 #65BBE9
    base: 'rgb(101, 187, 233)',    // #65BBE9
    dark: 'rgb(81, 169, 213)',     // 更深的 #65BBE9
    darker: 'rgb(61, 151, 193)',   // 最深的 #65BBE9
  },

  // 副色 - 淡粉色
  secondary: {
    light: 'rgb(251, 207, 232)',   // pink-200
    base: 'rgb(249, 168, 212)',    // pink-300
    dark: 'rgb(244, 114, 182)',    // pink-400
    darker: 'rgb(236, 72, 153)',   // pink-500
  },
} as const;

/**
 * 获取主题色的 rgba 格式
 */
export function getPrimaryRgba(opacity: number): string {
  return `rgba(96, 165, 250, ${opacity})`;  // blue-400
}

/**
 * 获取副色的 rgba 格式
 */
export function getSecondaryRgba(opacity: number): string {
  return `rgba(244, 114, 182, ${opacity})`;  // pink-400
}

/**
 * 获取渐变背景
 */
export function getGradientBg(theme: 'dark' | 'light'): string {
  if (theme === 'dark') {
    return 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900';
  }
  return 'bg-gradient-to-br from-blue-50 via-pink-50 to-blue-100';
}

/**
 * 获取品牌渐变(用于Logo、重要按钮等)
 */
export function getBrandGradient(): string {
  return 'from-blue-400 to-pink-400';
}

/**
 * 获取主题色文字颜色
 */
export function getPrimaryTextColor(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'text-blue-300' : 'text-blue-600';
}

/**
 * 获取副色文字颜色
 */
export function getSecondaryTextColor(theme: 'dark' | 'light'): string {
  return theme === 'dark' ? 'text-pink-300' : 'text-pink-600';
}

/**
 * 获取主题色边框颜色
 */
export function getPrimaryBorderColor(theme: 'dark' | 'light', opacity: number = 0.3): string {
  return theme === 'dark'
    ? `rgba(147, 197, 253, ${opacity})`  // blue-300
    : `rgba(59, 130, 246, ${opacity})`;   // blue-500
}

/**
 * 获取主题色阴影(使用统一阴影系统)
 */
export function getPrimaryShadow(theme: 'dark' | 'light'): string {
  return theme === 'dark'
    ? 'shadow-unified-xl-dark'
    : 'shadow-unified-xl';
}
