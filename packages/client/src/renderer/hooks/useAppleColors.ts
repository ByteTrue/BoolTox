/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import { useTheme } from '../components/theme-provider';
import { AppleColors } from '../utils/apple-colors';

/**
 * Apple 色彩系统 Hook
 * 自动根据当前主题返回对应的色彩值
 */
export function useAppleColors() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return useMemo(() => ({
    // 品牌色（不区分主题）
    brand: {
      blue: isDark ? AppleColors.brand.blue[400] : AppleColors.brand.blue[500],
      blueLight: AppleColors.brand.blue[300],
      blueDark: AppleColors.brand.blue[600],
      pink: AppleColors.brand.pink[300],
      pinkLight: AppleColors.brand.pink[200],
      pinkDark: AppleColors.brand.pink[400],
      gradient: AppleColors.brand.gradient.primary,
      gradientSecondary: AppleColors.brand.gradient.secondary,
      gradientAccent: AppleColors.brand.gradient.accent,
    },

    // 语义色（根据主题）
    semantic: {
      success: isDark ? AppleColors.semantic.success.dark : AppleColors.semantic.success.light,
      successBg: isDark ? AppleColors.semantic.success.bg.dark : AppleColors.semantic.success.bg.light,
      successBorder: isDark ? AppleColors.semantic.success.border.dark : AppleColors.semantic.success.border.light,
      
      warning: isDark ? AppleColors.semantic.warning.dark : AppleColors.semantic.warning.light,
      warningBg: isDark ? AppleColors.semantic.warning.bg.dark : AppleColors.semantic.warning.bg.light,
      warningBorder: isDark ? AppleColors.semantic.warning.border.dark : AppleColors.semantic.warning.border.light,
      
      error: isDark ? AppleColors.semantic.error.dark : AppleColors.semantic.error.light,
      errorBg: isDark ? AppleColors.semantic.error.bg.dark : AppleColors.semantic.error.bg.light,
      errorBorder: isDark ? AppleColors.semantic.error.border.dark : AppleColors.semantic.error.border.light,
      
      info: isDark ? AppleColors.semantic.info.dark : AppleColors.semantic.info.light,
      infoBg: isDark ? AppleColors.semantic.info.bg.dark : AppleColors.semantic.info.bg.light,
      infoBorder: isDark ? AppleColors.semantic.info.border.dark : AppleColors.semantic.info.border.light,
    },

    // 中性色（根据主题）
    neutral: isDark ? AppleColors.neutral.dark : AppleColors.neutral.light,

    // 玻璃拟态效果
    glass: isDark ? AppleColors.effects.glass.dark : AppleColors.effects.glass.light,

    // 阴影
    shadow: isDark ? AppleColors.effects.shadow.dark : AppleColors.effects.shadow.light,

    // Focus Ring
    focusRing: isDark ? AppleColors.effects.focusRing.dark : AppleColors.effects.focusRing.light,

    // 主题标识
    isDark,
  }), [isDark]);
}

/**
 * 获取主题色彩的工具函数
 * 用于在非 React 组件中使用
 */
export function getAppleColor(
  colorPath: 'brand.blue' | 'brand.pink' | 'semantic.success' | 'semantic.warning' | 'semantic.error' | 'semantic.info',
  theme: 'light' | 'dark' = 'light'
): string {
  const isDark = theme === 'dark';
  
  switch (colorPath) {
    case 'brand.blue':
      return isDark ? AppleColors.brand.blue[400] : AppleColors.brand.blue[500];
    case 'brand.pink':
      return AppleColors.brand.pink[300];
    case 'semantic.success':
      return isDark ? AppleColors.semantic.success.dark : AppleColors.semantic.success.light;
    case 'semantic.warning':
      return isDark ? AppleColors.semantic.warning.dark : AppleColors.semantic.warning.light;
    case 'semantic.error':
      return isDark ? AppleColors.semantic.error.dark : AppleColors.semantic.error.light;
    case 'semantic.info':
      return isDark ? AppleColors.semantic.info.dark : AppleColors.semantic.info.light;
    default:
      return AppleColors.brand.blue[500];
  }
}
