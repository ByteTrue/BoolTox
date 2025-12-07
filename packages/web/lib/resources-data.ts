import { Code, Palette, Brain, Wrench, BookOpen, Compass, Globe, LucideIcon } from 'lucide-react';
import resourcesData from '@/data/resources.json';

// 图标映射
const iconMap: Record<string, LucideIcon> = {
  Compass,
  Code,
  Palette,
  Brain,
  Wrench,
  BookOpen,
  Globe,
};

// 类型定义
export type ResourceCategory = 'all' | 'dev' | 'design' | 'ai' | 'productivity' | 'learning';

export interface ResourceCategoryItem {
  id: ResourceCategory;
  name: string;
  icon: LucideIcon;
}

export interface Resource {
  id: string;
  name: string;
  description: string;
  url: string;
  category: ResourceCategory;
  featured?: boolean;
  tags: string[];
}

// 从 JSON 加载分类（附加图标组件）
export const resourceCategories: ResourceCategoryItem[] = resourcesData.categories.map(cat => ({
  ...cat,
  id: cat.id as ResourceCategory,
  icon: iconMap[cat.icon] || Globe,
}));

// 从 JSON 加载资源
export const resources: Resource[] = resourcesData.resources as Resource[];

// 工具函数：根据分类获取渐变色
export const getCategoryGradient = (categoryId: string): string => {
  const gradients: Record<string, string> = {
    dev: 'from-blue-500 to-cyan-500',
    design: 'from-pink-500 to-rose-500',
    ai: 'from-purple-500 to-violet-500',
    productivity: 'from-green-500 to-emerald-500',
    learning: 'from-orange-500 to-amber-500',
  };
  return gradients[categoryId] || 'from-neutral-500 to-neutral-600';
};

// 工具函数：根据分类获取图标
export const getCategoryIcon = (categoryId: string) => {
  const category = resourceCategories.find(c => c.id === categoryId);
  return category?.icon || Globe;
};

// 工具函数：获取精选资源
export const getFeaturedResources = () => resources.filter(r => r.featured);
