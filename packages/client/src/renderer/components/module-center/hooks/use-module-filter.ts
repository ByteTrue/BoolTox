/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import type { ModuleDefinition, ModuleInstance } from '@/types/module';
import type { ToolRegistryEntry } from '@booltox/shared';
import type { ModuleFilter } from '../types';

/**
 * 过滤 Hook - 提供多维度过滤功能
 * 支持按状态、来源、分类过滤
 */
export function useModuleFilter(
  installedModules: ModuleInstance[],
  availableModules: ModuleDefinition[],
  availablePlugins: ToolRegistryEntry[], // 新增：在线工具列表
  filter: ModuleFilter
) {
  // 过滤已安装模块
  const filteredInstalled = useMemo(() => {
    let result = installedModules;

    // 按来源过滤
    if (filter.source && filter.source !== 'all') {
      result = result.filter(module => {
        return module.definition.source === filter.source;
      });
    }

    // 按分类过滤
    if (filter.category && filter.category !== 'all') {
      result = result.filter(module => {
        return module.definition.category === filter.category;
      });
    }

    return result;
  }, [installedModules, filter]);

  // 过滤可用模块 (未安装的)
  const filteredAvailable = useMemo(() => {
    const installedIds = new Set(installedModules.map(m => m.id));
    let result = availableModules.filter(def => !installedIds.has(def.id));

    // 按来源过滤
    if (filter.source && filter.source !== 'all') {
      result = result.filter(module => {
        return module.source === filter.source;
      });
    }

    // 按分类过滤
    if (filter.category && filter.category !== 'all') {
      result = result.filter(module => {
        return module.category === filter.category;
      });
    }

    return result;
  }, [availableModules, installedModules, filter]);

  // 获取所有可用分类
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();

    // 从已安装模块提取分类
    installedModules.forEach(module => {
      if (module.definition.category) {
        categories.add(module.definition.category);
      }
    });

    // 从本地可用模块提取分类
    availableModules.forEach(module => {
      if (module.category) {
        categories.add(module.category);
      }
    });

    // 从在线工具提取分类
    availablePlugins.forEach(plugin => {
      if (plugin.category) {
        categories.add(plugin.category);
      }
    });

    return Array.from(categories).sort();
  }, [installedModules, availableModules, availablePlugins]);

  return {
    filteredInstalled,
    filteredAvailable,
    availableCategories,
  };
}
