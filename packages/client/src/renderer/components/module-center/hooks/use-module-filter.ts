import { useMemo } from "react";
import type { ModuleDefinition, ModuleInstance } from "@core/modules/types";
import type { ModuleFilter } from "../types";

/**
 * 过滤 Hook - 提供多维度过滤功能
 * 支持按状态、来源、分类过滤
 */
export function useModuleFilter(
  installedModules: ModuleInstance[],
  availableModules: ModuleDefinition[],
  filter: ModuleFilter
) {
  // 过滤已安装模块
  const filteredInstalled = useMemo(() => {
    let result = installedModules;

    // 按状态过滤
    if (filter.status && filter.status !== "all") {
      result = result.filter((module) => {
        if (filter.status === "enabled") {
          return module.runtime.status === "enabled";
        }
        return module.runtime.status === "disabled";
      });
    }

    // 按来源过滤
    if (filter.source && filter.source !== "all") {
      result = result.filter((module) => {
        return module.definition.source === filter.source;
      });
    }

    // 按分类过滤
    if (filter.category && filter.category !== "all") {
      result = result.filter((module) => {
        return module.definition.category === filter.category;
      });
    }

    return result;
  }, [installedModules, filter]);

  // 过滤可用模块 (未安装的)
  const filteredAvailable = useMemo(() => {
    const installedIds = new Set(installedModules.map((m) => m.id));
    let result = availableModules.filter((def) => !installedIds.has(def.id));

    // 按来源过滤
    if (filter.source && filter.source !== "all") {
      result = result.filter((module) => {
        return module.source === filter.source;
      });
    }

    // 按分类过滤
    if (filter.category && filter.category !== "all") {
      result = result.filter((module) => {
        return module.category === filter.category;
      });
    }

    return result;
  }, [availableModules, installedModules, filter]);

  // 获取所有可用分类
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    
    [...installedModules, ...availableModules].forEach((module) => {
      const definition = "definition" in module ? module.definition : module;
      if (definition.category) {
        categories.add(definition.category);
      }
    });

    return Array.from(categories).sort();
  }, [installedModules, availableModules]);

  return {
    filteredInstalled,
    filteredAvailable,
    availableCategories,
  };
}
