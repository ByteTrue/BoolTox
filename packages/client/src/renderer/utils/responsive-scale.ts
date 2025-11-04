/**
 * 响应式缩放工具
 * 提供基于视口宽度的字体、间距动态缩放
 * 遵循 KISS & DRY 原则，使用 CSS clamp() 实现流畅缩放
 */

export type ResponsiveScaleConfig = {
  /** 最小值（窄视口） */
  min: number;
  /** 最大值（宽视口） */
  max: number;
  /** 最小视口宽度（px） */
  minVw: number;
  /** 最大视口宽度（px） */
  maxVw: number;
  /** 单位 */
  unit?: 'px' | 'rem' | 'em';
};

/**
 * 生成 CSS clamp() 表达式
 * 例如：clamp(14px, 0.875rem + 0.5vw, 18px)
 */
export function getResponsiveClamp(config: ResponsiveScaleConfig): string {
  const { min, max, minVw, maxVw, unit = 'px' } = config;

  // 计算斜率：(max - min) / (maxVw - minVw)
  const slope = (max - min) / (maxVw - minVw);
  // 计算截距：min - slope * minVw
  const intercept = min - slope * minVw;

  const minVal = `${min}${unit}`;
  const maxVal = `${max}${unit}`;
  const preferred = `${intercept.toFixed(3)}${unit} + ${(slope * 100).toFixed(3)}vw`;

  return `clamp(${minVal}, ${preferred}, ${maxVal})`;
}

/**
 * 预设的响应式字体规模
 */
export const fontScalePresets = {
  /** 超小文本：10-12px */
  xs: {
    min: 10,
    max: 12,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 小文本：12-14px */
  sm: {
    min: 12,
    max: 14,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 基础文本：14-16px */
  base: {
    min: 14,
    max: 16,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 中等文本：16-18px */
  md: {
    min: 16,
    max: 18,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 大文本：18-22px */
  lg: {
    min: 18,
    max: 22,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 超大文本：24-32px */
  xl: {
    min: 24,
    max: 32,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 标题1：32-48px */
  '2xl': {
    min: 32,
    max: 48,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 标题2：40-64px */
  '3xl': {
    min: 40,
    max: 64,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
} as const;

/**
 * 预设的响应式间距规模（用于 padding、margin、gap）
 */
export const spacingScalePresets = {
  /** 超小间距：4-6px */
  xs: {
    min: 4,
    max: 6,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 小间距：8-12px */
  sm: {
    min: 8,
    max: 12,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 基础间距：12-16px */
  base: {
    min: 12,
    max: 16,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 中等间距：16-24px */
  md: {
    min: 16,
    max: 24,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 大间距：24-32px */
  lg: {
    min: 24,
    max: 32,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 超大间距：32-48px */
  xl: {
    min: 32,
    max: 48,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
  /** 巨大间距：48-64px */
  '2xl': {
    min: 48,
    max: 64,
    minVw: 320,
    maxVw: 1920,
    unit: 'px' as const,
  },
} as const;

/**
 * 获取响应式字体大小的 CSS 属性对象
 */
export function getResponsiveFontSize(
  preset: keyof typeof fontScalePresets,
  customConfig?: Partial<ResponsiveScaleConfig>
): { fontSize: string } {
  const config = customConfig
    ? { ...fontScalePresets[preset], ...customConfig }
    : fontScalePresets[preset];
  return {
    fontSize: getResponsiveClamp(config),
  };
}

/**
 * 获取响应式间距的 CSS 属性对象
 */
export function getResponsiveSpacing(
  preset: keyof typeof spacingScalePresets,
  property: 'padding' | 'margin' | 'gap',
  customConfig?: Partial<ResponsiveScaleConfig>
): Record<string, string> {
  const config = customConfig
    ? { ...spacingScalePresets[preset], ...customConfig }
    : spacingScalePresets[preset];
  const value = getResponsiveClamp(config);
  return { [property]: value };
}

/**
 * 获取响应式行高（相对于字号的倍数）
 */
export function getResponsiveLineHeight(
  fontPreset: keyof typeof fontScalePresets,
  multiplier = 1.5
): { lineHeight: string } {
  const { min, max, minVw, maxVw, unit } = fontScalePresets[fontPreset];
  const lineHeightConfig: ResponsiveScaleConfig = {
    min: min * multiplier,
    max: max * multiplier,
    minVw,
    maxVw,
    unit,
  };
  return {
    lineHeight: getResponsiveClamp(lineHeightConfig),
  };
}

/**
 * 获取响应式字体 + 行高组合样式
 */
export function getResponsiveTypography(
  fontPreset: keyof typeof fontScalePresets,
  lineHeightMultiplier = 1.5,
  customConfig?: Partial<ResponsiveScaleConfig>
): { fontSize: string; lineHeight: string } {
  return {
    ...getResponsiveFontSize(fontPreset, customConfig),
    ...getResponsiveLineHeight(fontPreset, lineHeightMultiplier),
  };
}

/**
 * 生成所有预设的 CSS 变量（可注入到 :root）
 */
export function generateResponsiveCSSVariables(): Record<string, string> {
  const variables: Record<string, string> = {};

  // 字体变量
  Object.keys(fontScalePresets).forEach((key) => {
    const preset = key as keyof typeof fontScalePresets;
    variables[`--font-${key}`] = getResponsiveClamp(fontScalePresets[preset]);
  });

  // 间距变量
  Object.keys(spacingScalePresets).forEach((key) => {
    const preset = key as keyof typeof spacingScalePresets;
    variables[`--spacing-${key}`] = getResponsiveClamp(spacingScalePresets[preset]);
  });

  return variables;
}

/**
 * 断点判断工具（客户端）
 */
export function getBreakpoint(): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' {
  if (typeof window === 'undefined') return 'lg';
  const width = window.innerWidth;
  if (width < 640) return 'xs';
  if (width < 768) return 'sm';
  if (width < 1024) return 'md';
  if (width < 1280) return 'lg';
  if (width < 1536) return 'xl';
  return '2xl';
}

/**
 * 检测是否为窄视口（移动端）
 */
export function isNarrowViewport(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * 检测是否为宽视口（桌面端）
 */
export function isWideViewport(): boolean {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 1280;
}
