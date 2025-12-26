/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import { useModulePlatform } from '@/contexts/module-context';

/**
 * 模块统计数据接口
 */
export interface ModuleStats {
  /** 已安装模块总数 */
  installed: number;
  /** 已启用模块数 */
  enabled: number;
  /** 已禁用模块数 */
  disabled: number;
  /** 远程可用模块数 */
  remote: number;
  /** 按分类统计已启用模块 */
  byCategory: Record<string, number>;
  /** 按分类统计所有已安装模块 */
  allByCategory: Record<string, number>;
}

/**
 * 分类显示名称映射
 */
export const CATEGORY_LABELS: Record<string, string> = {
  productivity: '效率工具',
  design: '设计美化',
  utility: '实用工具',
  entertainment: '娱乐休闲',
  development: '开发工具',
  system: '系统工具',
};

/**
 * 获取分类的显示名称
 */
export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] || category;
}

/**
 * 模块统计数据 Hook
 * 计算并返回模块系统的各项统计数据
 */
export function useModuleStats(): ModuleStats {
  const { installedModules, availableTools, toolRegistry } = useModulePlatform();

  const stats = useMemo(() => {
    const installed = installedModules.length;
    const enabled = 0; // 不再使用 enabled/disabled 状态
    const disabled = 0;

    // 过滤掉已安装的非开发工具
    const installedToolIds = new Set(toolRegistry.filter(p => !p.isDev).map(p => p.id));
    const remote = availableTools.filter(p => !installedToolIds.has(p.id)).length;

    // 按分类统计已安装模块
    const byCategory = installedModules.reduce(
      (acc, m) => {
        const cat = m.definition.category;
        if (!cat) {
          return acc;
        }
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // 按分类统计所有已安装模块
    const allByCategory = installedModules.reduce(
      (acc, m) => {
        const cat = m.definition.category;
        if (!cat) {
          return acc;
        }
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      installed,
      enabled,
      disabled,
      remote,
      byCategory,
      allByCategory,
    };
  }, [installedModules, availableTools, toolRegistry]);

  return stats;
}

/**
 * 获取分类统计的百分比数据
 * 用于圆环图显示
 */
export function useCategoryPercentages(): Array<{
  category: string;
  label: string;
  count: number;
  percentage: number;
}> {
  const stats = useModuleStats();

  return useMemo(() => {
    const { byCategory, enabled } = stats;

    if (enabled === 0) return [];

    return Object.entries(byCategory).map(([category, count]) => ({
      category,
      label: getCategoryLabel(category),
      count,
      percentage: Math.round((count / enabled) * 100),
    }));
  }, [stats]);
}
