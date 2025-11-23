import { useMemo } from "react";
import type { ModuleDefinition, ModuleInstance } from "@core/modules/types";
import type { ModuleSortConfig } from "../types";

/**
 * 排序 Hook - 提供模块排序功能
 * 支持按名称、更新时间、下载量排序
 */
export function useModuleSort<T extends ModuleDefinition | ModuleInstance>(
  modules: T[],
  sortConfig: ModuleSortConfig
): T[] {
  const sortedModules = useMemo(() => {
    if (!modules || modules.length === 0) {
      return modules;
    }

    const sorted = [...modules];

    sorted.sort((a, b) => {
      const defA: ModuleDefinition = "definition" in a ? a.definition : a;
      const defB: ModuleDefinition = "definition" in b ? b.definition : b;

      let comparison = 0;

      switch (sortConfig.by) {
        case "name":
          comparison = defA.name.localeCompare(defB.name, "zh-CN");
          break;

        case "updatedAt":
          // 暂时使用版本号排序(未来可以添加 updatedAt 字段)
          comparison = defA.version.localeCompare(defB.version);
          break;

        case "downloads":
          // 预留下载量排序(未来可以添加 downloads 字段)
          // 目前按名称排序
          comparison = defA.name.localeCompare(defB.name, "zh-CN");
          break;

        case "default":
        default:
          // 默认排序: 按名称排序
          comparison = defA.name.localeCompare(defB.name, "zh-CN");
          break;
      }

      return sortConfig.order === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [modules, sortConfig]);

  return sortedModules;
}
