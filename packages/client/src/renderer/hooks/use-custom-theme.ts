/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 用户自定义主题 Hook
 * 参考 Cherry Studio useUserTheme 设计
 */

import { colord } from 'colord';
import { useEffect, useState } from 'react';
import { createLogger } from '../lib/logger';

const logger = createLogger('CustomTheme');

// 默认主色调
const DEFAULT_COLORS = {
  blue: '#65BBE9',    // BoolTox 品牌蓝
  pink: '#F9C1CF',    // BoolTox 品牌粉
  purple: '#A78BFA',  // 紫色
  green: '#10B981',   // 绿色
  orange: '#F59E0B',  // 橙色
};

export interface CustomThemeConfig {
  primaryColor: string;      // 主色调（HEX）
  accentColor?: string;      // 强调色（可选）
  fontFamily?: string;       // 自定义字体
  codeFontFamily?: string;   // 代码字体
}

export function useCustomTheme() {
  // 从 localStorage 读取用户配置
  const [config, setConfig] = useState<CustomThemeConfig>(() => {
    try {
      const saved = localStorage.getItem('booltox-custom-theme');
      return saved ? JSON.parse(saved) : { primaryColor: DEFAULT_COLORS.blue };
    } catch (error) {
      logger.error('读取自定义主题失败', error);
      return { primaryColor: DEFAULT_COLORS.blue };
    }
  });

  /**
   * 应用主题到 CSS 变量
   */
  const applyTheme = (themeConfig: CustomThemeConfig) => {
    const primary = colord(themeConfig.primaryColor);

    // 主色调变体（自动计算）
    document.body.style.setProperty('--color-primary', primary.toHex());
    document.body.style.setProperty('--color-primary-soft', primary.alpha(0.6).toHex());
    document.body.style.setProperty('--color-primary-mute', primary.alpha(0.3).toHex());
    document.body.style.setProperty('--color-primary-darker', primary.darken(0.1).toHex());
    document.body.style.setProperty('--color-primary-lighter', primary.lighten(0.1).toHex());

    // Tailwind 兼容
    const rgb = primary.toRgb();
    document.body.style.setProperty('--primary', `${rgb.r} ${rgb.g} ${rgb.b}`);

    // 强调色（如果有）
    if (themeConfig.accentColor) {
      const accent = colord(themeConfig.accentColor);
      document.body.style.setProperty('--color-accent', accent.toHex());
      const accentRgb = accent.toRgb();
      document.body.style.setProperty('--accent', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
    }

    // 自定义字体
    if (themeConfig.fontFamily) {
      document.documentElement.style.setProperty('--font-family-custom', `'${themeConfig.fontFamily}'`);
    }

    if (themeConfig.codeFontFamily) {
      document.documentElement.style.setProperty('--font-mono-custom', `'${themeConfig.codeFontFamily}'`);
    }

    logger.info('主题已应用', themeConfig);
  };

  /**
   * 更新主题配置
   */
  const updateTheme = (newConfig: Partial<CustomThemeConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);

    // 持久化
    try {
      localStorage.setItem('booltox-custom-theme', JSON.stringify(updated));
    } catch (error) {
      logger.error('保存自定义主题失败', error);
    }

    // 应用
    applyTheme(updated);
  };

  /**
   * 重置为默认主题
   */
  const resetTheme = () => {
    const defaultConfig = { primaryColor: DEFAULT_COLORS.blue };
    updateTheme(defaultConfig);
  };

  // 初始化时应用主题
  useEffect(() => {
    applyTheme(config);
  }, []);

  return {
    config,
    updateTheme,
    resetTheme,
    defaultColors: DEFAULT_COLORS,
  };
}
