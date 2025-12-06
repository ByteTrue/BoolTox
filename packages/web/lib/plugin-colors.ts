/**
 * 插件颜色映射系统
 * 根据插件分类或 ID 生成不同的渐变色，提升视觉识别度
 */

export type PluginCategory =
  | 'productivity'
  | 'development'
  | 'design'
  | 'utility'
  | 'media'
  | 'social'
  | 'finance'
  | 'education'
  | 'entertainment'
  | 'health';

export interface CategoryColor {
  // 亮色模式渐变
  light: string;
  // 深色模式渐变
  dark: string;
  // 背景色
  bg: string;
  // 边框色
  border: string;
  // 文字色
  text: string;
}

/**
 * 分类颜色映射表
 * 基于 2025 UI 趋势选择柔和且现代的配色
 */
export const CATEGORY_COLORS: Record<PluginCategory | 'default', CategoryColor> = {
  // 生产力 - 蓝色（专注、可靠）
  productivity: {
    light: 'from-blue-400 to-blue-600',
    dark: 'from-blue-500 to-blue-700',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800/50',
    text: 'text-blue-600 dark:text-blue-400'
  },

  // 开发工具 - 紫色（创造、智慧）
  development: {
    light: 'from-purple-400 to-purple-600',
    dark: 'from-purple-500 to-purple-700',
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-purple-800/50',
    text: 'text-purple-600 dark:text-purple-400'
  },

  // 设计 - 粉色（创意、美感）
  design: {
    light: 'from-pink-400 to-pink-600',
    dark: 'from-pink-500 to-pink-700',
    bg: 'bg-pink-50 dark:bg-pink-900/30',
    border: 'border-pink-200 dark:border-pink-800/50',
    text: 'text-pink-600 dark:text-pink-400'
  },

  // 实用工具 - 绿色（效率、成长）
  utility: {
    light: 'from-green-400 to-green-600',
    dark: 'from-green-500 to-green-700',
    bg: 'bg-green-50 dark:bg-green-900/30',
    border: 'border-green-200 dark:border-green-800/50',
    text: 'text-green-600 dark:text-green-400'
  },

  // 媒体 - 橙色（活力、热情）
  media: {
    light: 'from-orange-400 to-orange-600',
    dark: 'from-orange-500 to-orange-700',
    bg: 'bg-orange-50 dark:bg-orange-900/30',
    border: 'border-orange-200 dark:border-orange-800/50',
    text: 'text-orange-600 dark:text-orange-400'
  },

  // 社交 - 青色（沟通、连接）
  social: {
    light: 'from-cyan-400 to-cyan-600',
    dark: 'from-cyan-500 to-cyan-700',
    bg: 'bg-cyan-50 dark:bg-cyan-900/30',
    border: 'border-cyan-200 dark:border-cyan-800/50',
    text: 'text-cyan-600 dark:text-cyan-400'
  },

  // 金融 - 祖母绿（稳重、价值）
  finance: {
    light: 'from-emerald-400 to-emerald-600',
    dark: 'from-emerald-500 to-emerald-700',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    text: 'text-emerald-600 dark:text-emerald-400'
  },

  // 教育 - 靛蓝（知识、学习）
  education: {
    light: 'from-indigo-400 to-indigo-600',
    dark: 'from-indigo-500 to-indigo-700',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-800/50',
    text: 'text-indigo-600 dark:text-indigo-400'
  },

  // 娱乐 - 玫瑰红（愉悦、轻松）
  entertainment: {
    light: 'from-rose-400 to-rose-600',
    dark: 'from-rose-500 to-rose-700',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-800/50',
    text: 'text-rose-600 dark:text-rose-400'
  },

  // 健康 - 青柠（活力、健康）
  health: {
    light: 'from-lime-400 to-lime-600',
    dark: 'from-lime-500 to-lime-700',
    bg: 'bg-lime-50 dark:bg-lime-900/30',
    border: 'border-lime-200 dark:border-lime-800/50',
    text: 'text-lime-600 dark:text-lime-400'
  },

  // 默认 - 中性灰
  default: {
    light: 'from-neutral-400 to-neutral-600',
    dark: 'from-neutral-500 to-neutral-700',
    bg: 'bg-neutral-50 dark:bg-neutral-800/50',
    border: 'border-neutral-200 dark:border-neutral-700',
    text: 'text-neutral-600 dark:text-neutral-400'
  }
};

/**
 * 根据分类获取颜色配置
 * @param category 插件分类
 * @returns 颜色配置对象
 */
export function getCategoryColor(category?: string): CategoryColor {
  if (!category) return CATEGORY_COLORS.default;

  const normalizedCategory = category.toLowerCase() as PluginCategory;
  return CATEGORY_COLORS[normalizedCategory] || CATEGORY_COLORS.default;
}

/**
 * 根据插件 ID 哈希生成一致的颜色
 * 用于没有分类信息的插件
 * @param pluginId 插件 ID
 * @returns 颜色配置对象
 */
export function hashPluginColor(pluginId: string): CategoryColor {
  // 使用简单的哈希算法
  const hash = pluginId.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  // 获取所有分类（排除 default）
  const categories = Object.keys(CATEGORY_COLORS).filter(
    key => key !== 'default'
  ) as PluginCategory[];

  // 根据哈希值选择分类
  const index = hash % categories.length;
  return CATEGORY_COLORS[categories[index]];
}

/**
 * 获取插件渐变色类名
 * @param category 插件分类
 * @param pluginId 插件 ID（用于无分类时的哈希）
 * @param theme 当前主题（light/dark）
 * @returns Tailwind 渐变类名字符串
 */
export function getPluginGradient(
  category: string | undefined,
  pluginId: string,
  theme: 'light' | 'dark' = 'light'
): string {
  const color = category ? getCategoryColor(category) : hashPluginColor(pluginId);
  return theme === 'dark' ? color.dark : color.light;
}

/**
 * 获取插件背景色类名
 * @param category 插件分类
 * @param pluginId 插件 ID
 * @returns Tailwind 背景类名字符串
 */
export function getPluginBackground(category: string | undefined, pluginId: string): string {
  const color = category ? getCategoryColor(category) : hashPluginColor(pluginId);
  return color.bg;
}

/**
 * 获取插件边框色类名
 * @param category 插件分类
 * @param pluginId 插件 ID
 * @returns Tailwind 边框类名字符串
 */
export function getPluginBorder(category: string | undefined, pluginId: string): string {
  const color = category ? getCategoryColor(category) : hashPluginColor(pluginId);
  return color.border;
}

/**
 * 获取插件文字色类名
 * @param category 插件分类
 * @param pluginId 插件 ID
 * @returns Tailwind 文字颜色类名字符串
 */
export function getPluginTextColor(category: string | undefined, pluginId: string): string {
  const color = category ? getCategoryColor(category) : hashPluginColor(pluginId);
  return color.text;
}

/**
 * 分类中文名称映射
 */
export const CATEGORY_NAMES: Record<PluginCategory | 'default', string> = {
  productivity: '生产力',
  development: '开发工具',
  design: '设计',
  utility: '实用工具',
  media: '媒体',
  social: '社交',
  finance: '金融',
  education: '教育',
  entertainment: '娱乐',
  health: '健康',
  default: '其他'
};

/**
 * 获取分类的中文名称
 * @param category 分类英文名
 * @returns 分类中文名
 */
export function getCategoryName(category?: string): string {
  if (!category) return CATEGORY_NAMES.default;
  const normalizedCategory = category.toLowerCase() as PluginCategory;
  return CATEGORY_NAMES[normalizedCategory] || CATEGORY_NAMES.default;
}
