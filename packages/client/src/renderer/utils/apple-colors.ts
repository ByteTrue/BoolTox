/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Apple 设计系统 - 色彩规范
 * 遵循 Apple Human Interface Guidelines
 *
 * 色彩层级：
 * - Brand Colors: 品牌主色
 * - Semantic Colors: 语义化色彩（成功、警告、错误、信息）
 * - Neutral Colors: 中性色（文本、背景、边框）
 * - Accent Colors: 强调色
 */

export const AppleColors = {
  /**
   * 品牌主色 - BoolTox Brand
   * 双品牌色：蓝色 (Tailwind Blue) + 橙色 (Tailwind Orange)
   */
  brand: {
    // 蓝色系 - Tailwind Blue (主品牌色)
    blue: {
      50: '#EFF6FF',  // Blue 50
      100: '#DBEAFE', // Blue 100
      200: '#BFDBFE', // Blue 200
      300: '#93C5FD', // Blue 300
      400: '#60A5FA', // Blue 400 - Dark 模式主色
      500: '#3B82F6', // Blue 500 - Light 模式主色
      600: '#2563EB', // Blue 600
      700: '#1D4ED8', // Blue 700
      800: '#1E40AF', // Blue 800
      900: '#1E3A8A', // Blue 900
    },

    // 橙色系 - Tailwind Orange (副品牌色)
    orange: {
      50: '#FFF7ED',  // Orange 50
      100: '#FFEDD5', // Orange 100
      200: '#FED7AA', // Orange 200
      300: '#FDBA74', // Orange 300
      400: '#FB923C', // Orange 400
      500: '#F97316', // Orange 500 - 副品牌主色
      600: '#EA580C', // Orange 600
      700: '#C2410C', // Orange 700
      800: '#9A3412', // Orange 800
      900: '#7C2D12', // Orange 900
    },

    // Slate 灰色系 - 中性色
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },

    // 双品牌色渐变组合
    gradient: {
      primary: 'linear-gradient(135deg, #60A5FA 0%, #F97316 100%)',
      secondary: 'linear-gradient(135deg, #3B82F6 0%, #F97316 100%)',
      accent: 'linear-gradient(135deg, #93C5FD 0%, #FB923C 100%)',
    },
  },

  /**
   * 语义化色彩 - Semantic Colors
   * 遵循 Apple 标准色彩语义
   */
  semantic: {
    // 成功 - 绿色
    success: {
      light: '#34C759', // iOS/macOS 标准绿色
      dark: '#30D158',
      bg: {
        light: 'rgba(52, 199, 89, 0.1)',
        dark: 'rgba(48, 209, 88, 0.15)',
      },
      border: {
        light: 'rgba(52, 199, 89, 0.3)',
        dark: 'rgba(48, 209, 88, 0.4)',
      },
    },

    // 警告 - 橙色
    warning: {
      light: '#FF9500', // iOS/macOS 标准橙色
      dark: '#FF9F0A',
      bg: {
        light: 'rgba(255, 149, 0, 0.1)',
        dark: 'rgba(255, 159, 10, 0.15)',
      },
      border: {
        light: 'rgba(255, 149, 0, 0.3)',
        dark: 'rgba(255, 159, 10, 0.4)',
      },
    },

    // 错误/危险 - 红色
    error: {
      light: '#FF3B30', // iOS/macOS 标准红色
      dark: '#FF453A',
      bg: {
        light: 'rgba(255, 59, 48, 0.1)',
        dark: 'rgba(255, 69, 58, 0.15)',
      },
      border: {
        light: 'rgba(255, 59, 48, 0.3)',
        dark: 'rgba(255, 69, 58, 0.4)',
      },
    },

    // 信息 - 蓝色（使用品牌色）
    info: {
      light: '#3B82F6',  // Blue 500
      dark: '#60A5FA',   // Blue 400
      bg: {
        light: 'rgba(59, 130, 246, 0.1)',
        dark: 'rgba(96, 165, 250, 0.15)',
      },
      border: {
        light: 'rgba(59, 130, 246, 0.3)',
        dark: 'rgba(96, 165, 250, 0.4)',
      },
    },
  },

  /**
   * 中性色 - Neutral Colors
   * 用于文本、背景、边框
   */
  neutral: {
    // Light Mode
    light: {
      // 文本
      text: {
        primary: 'rgba(0, 0, 0, 0.85)', // 主要文本
        secondary: 'rgba(0, 0, 0, 0.60)', // 次要文本
        tertiary: 'rgba(0, 0, 0, 0.45)', // 三级文本
        quaternary: 'rgba(0, 0, 0, 0.30)', // 四级文本
        disabled: 'rgba(0, 0, 0, 0.25)', // 禁用文本
      },

      // 背景
      bg: {
        primary: '#FFFFFF', // 主背景
        secondary: '#F5F5F7', // 次级背景
        tertiary: '#E8E8ED', // 三级背景
        elevated: '#FFFFFF', // 悬浮背景
        grouped: '#F2F2F7', // 分组背景
      },

      // 边框
      border: {
        primary: 'rgba(0, 0, 0, 0.10)', // 主边框
        secondary: 'rgba(0, 0, 0, 0.08)', // 次边框
        tertiary: 'rgba(0, 0, 0, 0.05)', // 三级边框
      },

      // 分隔线
      separator: 'rgba(0, 0, 0, 0.08)',

      // 填充
      fill: {
        primary: 'rgba(120, 120, 128, 0.20)',
        secondary: 'rgba(120, 120, 128, 0.16)',
        tertiary: 'rgba(118, 118, 128, 0.12)',
        quaternary: 'rgba(116, 116, 128, 0.08)',
      },
    },

    // Dark Mode
    dark: {
      // 文本
      text: {
        primary: 'rgba(255, 255, 255, 0.85)', // 主要文本
        secondary: 'rgba(255, 255, 255, 0.60)', // 次要文本
        tertiary: 'rgba(255, 255, 255, 0.45)', // 三级文本
        quaternary: 'rgba(255, 255, 255, 0.30)', // 四级文本
        disabled: 'rgba(255, 255, 255, 0.25)', // 禁用文本
      },

      // 背景
      bg: {
        primary: '#1C1C1E', // 主背景
        secondary: '#2C2C2E', // 次级背景
        tertiary: '#3A3A3C', // 三级背景
        elevated: '#1C1C1E', // 悬浮背景
        grouped: '#000000', // 分组背景
      },

      // 边框
      border: {
        primary: 'rgba(255, 255, 255, 0.13)', // 主边框
        secondary: 'rgba(255, 255, 255, 0.10)', // 次边框
        tertiary: 'rgba(255, 255, 255, 0.07)', // 三级边框
      },

      // 分隔线
      separator: 'rgba(255, 255, 255, 0.10)',

      // 填充
      fill: {
        primary: 'rgba(120, 120, 128, 0.36)',
        secondary: 'rgba(120, 120, 128, 0.32)',
        tertiary: 'rgba(118, 118, 128, 0.24)',
        quaternary: 'rgba(116, 116, 128, 0.18)',
      },
    },
  },

  /**
   * 特殊效果色彩
   */
  effects: {
    // 玻璃拟态
    glass: {
      light: {
        base: 'rgba(255, 255, 255, 0.55)',
        overlay: 'rgba(255, 255, 255, 0.25)',
      },
      dark: {
        base: 'rgba(28, 30, 35, 0.78)',
        overlay: 'rgba(255, 255, 255, 0.08)',
      },
    },

    // 阴影
    shadow: {
      light: {
        sm: 'rgba(0, 0, 0, 0.04)',
        md: 'rgba(0, 0, 0, 0.08)',
        lg: 'rgba(0, 0, 0, 0.12)',
        xl: 'rgba(0, 0, 0, 0.16)',
      },
      dark: {
        sm: 'rgba(0, 0, 0, 0.20)',
        md: 'rgba(0, 0, 0, 0.30)',
        lg: 'rgba(0, 0, 0, 0.40)',
        xl: 'rgba(0, 0, 0, 0.50)',
      },
    },

    // Focus Ring
    focusRing: {
      light: '#3B82F6',  // Blue 500
      dark: '#60A5FA',   // Blue 400
    },
  },
} as const;

/**
 * 获取主题色彩
 */
export function getThemeColor(colorPath: string, theme: 'light' | 'dark'): string {
  const parts = colorPath.split('.');
  let current: unknown = AppleColors;

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      console.warn(`Color path not found: ${colorPath}`);
      return '#000000';
    }
  }

  // 如果是对象且有 light/dark 属性，返回对应主题的值
  if (
    typeof current === 'object' &&
    current !== null &&
    theme in current &&
    typeof (current as Record<string, unknown>)[theme] === 'string'
  ) {
    return (current as Record<'light' | 'dark', string>)[theme];
  }

  // 否则直接返回值
  return typeof current === 'string' ? current : '#000000';
}

/**
 * CSS 变量导出（用于 Tailwind 配置）
 */
export const appleCSSVariables = {
  // 品牌色
  '--color-brand-blue': AppleColors.brand.blue[500],
  '--color-brand-blue-light': AppleColors.brand.blue[400],
  '--color-brand-blue-dark': AppleColors.brand.blue[600],
  '--color-brand-slate': AppleColors.brand.slate[500],

  // 语义色
  '--color-success': AppleColors.semantic.success.light,
  '--color-success-dark': AppleColors.semantic.success.dark,
  '--color-warning': AppleColors.semantic.warning.light,
  '--color-warning-dark': AppleColors.semantic.warning.dark,
  '--color-error': AppleColors.semantic.error.light,
  '--color-error-dark': AppleColors.semantic.error.dark,
  '--color-info': AppleColors.semantic.info.light,
  '--color-info-dark': AppleColors.semantic.info.dark,
};
