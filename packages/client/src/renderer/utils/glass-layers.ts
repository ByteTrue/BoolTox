import type { CSSProperties } from 'react';

/**
 * 玻璃拟态设计系统 - Apple 标准
 * Glassmorphism Design System - Apple Standard
 *
 * 层级说明:
 * - BACKGROUND: 最底层,主内容面板
 * - PANEL: 次级面板,如侧边栏
 * - CARD: 卡片元素
 * - BUTTON: 交互按钮
 * - ACTIVE: 激活/高亮状态
 * - MODAL: 浮动元素(弹窗、tooltip)
 * - TITLEBAR: 窗口标题栏
 * 
 * 参考: macOS Big Sur / iOS 15+ 玻璃材质标准
 */

// 浅色模式玻璃层级 (Light Mode)
// 使用较低不透明度保持玻璃透明质感，增大层级间距提升层次感
export const GLASS_LAYERS = {
  BACKGROUND: 'rgba(255, 255, 255, 0.45)',  // 主面板 (45%)
  PANEL: 'rgba(255, 255, 255, 0.50)',       // 侧边栏 (50%)
  CARD: 'rgba(255, 255, 255, 0.55)',        // 卡片 (55%)
  BUTTON: 'rgba(255, 255, 255, 0.65)',      // 按钮 (65%) - 提升10%增强对比
  ACTIVE: 'rgba(255, 255, 255, 0.75)',      // 激活状态 (75%) - 显著提升
  MODAL: 'rgba(255, 255, 255, 0.70)',       // 浮动元素 (70%)
  TITLEBAR: 'rgba(255, 255, 255, 0.75)',    // 标题栏 (75%)
} as const;

// 深色模式玻璃层级 (Dark Mode)
export const GLASS_LAYERS_DARK = {
  BACKGROUND: 'rgba(28, 30, 35, 0.70)',     // 主面板 (70%)
  PANEL: 'rgba(28, 30, 35, 0.75)',          // 侧边栏 (75%)
  CARD: 'rgba(28, 30, 35, 0.78)',           // 卡片 (78%)
  BUTTON: 'rgba(28, 30, 35, 0.84)',         // 按钮 (84%) - 提升4%增强对比
  ACTIVE: 'rgba(28, 30, 35, 0.90)',         // 激活状态 (90%) - 显著提升
  MODAL: 'rgba(28, 30, 35, 0.85)',          // 浮动元素 (85%)
  TITLEBAR: 'rgba(28, 30, 35, 0.88)',       // 标题栏 (88%)
} as const;

// Apple 标准模糊强度 + 饱和度增强
export const GLASS_BLUR = 30; // Apple 标准: 30-40px
export const GLASS_SATURATE = 170; // 饱和度增强百分比

// 统一边框颜色
export const GLASS_BORDERS = {
  LIGHT: 'rgba(0, 0, 0, 0.08)',        // 浅色模式边框 (深色半透明)
  DARK: 'rgba(255, 255, 255, 0.12)',   // 深色模式边框 (白色半透明)
} as const;

export type GlassLayer = keyof typeof GLASS_LAYERS;

export interface GlassStyleOptions {
  /** 是否添加边框高光效果 */
  withBorderGlow?: boolean;
  /** 是否添加内阴影 */
  withInnerShadow?: boolean;
  /** 自定义边框颜色 (覆盖默认) */
  customBorderColor?: string;
}

/**
 * 获取 Apple 标准玻璃拟态样式
 * @param layer - 层级名称
 * @param theme - 主题(dark/light)
 * @param options - 可选配置
 * @returns React style 对象
 */
export function getGlassStyle(
  layer: GlassLayer,
  theme: 'dark' | 'light',
  options?: GlassStyleOptions
): CSSProperties {
  const {
    withBorderGlow = true,
    withInnerShadow = true,
    customBorderColor,
  } = options || {};

  // 选择正确的层级映射
  const layers = theme === 'dark' ? GLASS_LAYERS_DARK : GLASS_LAYERS;
  const borderColor = customBorderColor || (theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT);

  // 构建 box-shadow (边框高光 + 内阴影)
  const shadows: string[] = [];
  if (withBorderGlow) {
    // 顶部微光边框 - 浅色用深色，深色用白色
    shadows.push(
      theme === 'dark'
        ? '0 0.5px 0 0 rgba(255, 255, 255, 0.1)'
        : '0 0.5px 0 0 rgba(0, 0, 0, 0.05)'  // 浅色模式用深色边框高光
    );
  }
  if (withInnerShadow) {
    // 内阴影增强立体感 - 浅色用深色，深色用白色
    shadows.push(
      theme === 'dark'
        ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)'
        : 'inset 0 1px 0 0 rgba(0, 0, 0, 0.03)'  // 浅色模式用深色内阴影
    );
  }

  return {
    background: layers[layer],
    borderColor,
    backdropFilter: `blur(${GLASS_BLUR}px) saturate(${GLASS_SATURATE}%)`,
    WebkitBackdropFilter: `blur(${GLASS_BLUR}px) saturate(${GLASS_SATURATE}%)`,
    ...(shadows.length > 0 && { boxShadow: shadows.join(', ') }),
  };
}

/**
 * 获取统一的玻璃拟态阴影(使用统一阴影系统)
 * @param theme - 主题(dark/light)
 * @returns Tailwind shadow class
 */
export function getGlassShadow(theme: 'dark' | 'light'): string {
  return theme === 'dark'
    ? 'shadow-unified-lg-dark'
    : 'shadow-unified-lg';
}

/**
 * 获取激活状态的玻璃拟态样式(带主题色高亮)
 * @param theme - 主题(dark/light)
 * @returns React style 对象
 */
export function getGlassActiveStyle(theme: 'dark' | 'light' = 'light'): CSSProperties {
  return {
    background: theme === 'dark'
      ? 'rgba(101, 187, 233, 0.25)'  // 深色模式: 更亮的高亮
      : 'rgba(101, 187, 233, 0.30)',  // 浅色模式
    borderColor: theme === 'dark'
      ? 'rgba(101, 187, 233, 0.4)'
      : 'rgba(81, 169, 213, 0.5)',
    backdropFilter: `blur(${GLASS_BLUR}px) saturate(${GLASS_SATURATE}%)`,
    WebkitBackdropFilter: `blur(${GLASS_BLUR}px) saturate(${GLASS_SATURATE}%)`,
    boxShadow: theme === 'dark'
      ? '0 0 20px rgba(101, 187, 233, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
      : '0 0 20px rgba(101, 187, 233, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.2)',
  };
}
