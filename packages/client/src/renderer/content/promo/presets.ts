/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

// 宣传 / 落地页 设计预设：用于生成静态截图、分享卡片或动效脚本数据。
// 后续可以在构建阶段或独立脚本中读取此配置批量生成图像。

export interface PromoVisualPreset {
  id: string;
  category: 'home' | 'themes' | 'marketplace';
  title: string;
  subtitle: string;
  tagline?: string;
  gradient: string;
  darkOverlay?: boolean;
  features: Array<{ icon?: string; label: string; emphasis?: boolean }>;
  layout: 'hero-centered' | 'split' | 'stack-cards';
  aspect: '16:9' | '1:1' | '9:16';
}

export const promoPresets: PromoVisualPreset[] = [
  {
    id: 'home-recommend-hero',
    category: 'home',
    title: '首页推荐 · 即时上新',
    subtitle: '精选模块与限时活动一览',
    tagline: '探索 · 收藏 · 启动只需一步',
    gradient: 'linear-gradient(135deg,#0a84ff,#5ac8fa,#64d2ff)',
    darkOverlay: true,
    features: [
      { label: '今日新增 8 款', emphasis: true },
      { label: '限免福利' },
      { label: '高评分优选' },
    ],
    layout: 'hero-centered',
    aspect: '16:9',
  },
  {
    id: 'theme-lab-showcase',
    category: 'themes',
    title: '主题体验馆',
    subtitle: '随心切换 · 多端同步',
    tagline: 'Starlight / Dawn / Neon / Minimal',
    gradient: 'linear-gradient(135deg,#af52de,#d5b3ff,#f7d3ff)',
    features: [
      { label: 'Light / Dark 对比', emphasis: true },
      { label: '一键预览' },
      { label: '护眼模式预告' },
    ],
    layout: 'split',
    aspect: '16:9',
  },
  {
    id: 'marketplace-progress',
    category: 'marketplace',
    title: '模块市场 Roadmap',
    subtitle: '配置 · 安装 · 评分 即将启用',
    gradient: 'linear-gradient(135deg,#34c759,#a0f0c5,#d6ffe7)',
    features: [
      { label: '配置 JSON 标准', emphasis: true },
      { label: 'URL 安装入口' },
      { label: '评分与反馈系统' },
    ],
    layout: 'stack-cards',
    aspect: '16:9',
  },
];
