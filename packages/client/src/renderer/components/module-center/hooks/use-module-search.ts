import { useMemo, useState, useCallback } from "react";
import type { ModuleDefinition, ModuleInstance } from "@core/modules/types";

/**
 * 搜索 Hook - 提供实时搜索功能
 * 支持按名称、描述、关键词搜索,带防抖优化
 */
export function useModuleSearch<T extends ModuleDefinition | ModuleInstance>(
  modules: T[],
  searchQuery: string
): T[] {
  const filteredModules = useMemo(() => {
    if (!searchQuery || searchQuery.trim() === "") {
      return modules;
    }

    const query = searchQuery.toLowerCase().trim();

    return modules.filter((module) => {
      // 获取模块定义
      const definition: ModuleDefinition = "definition" in module ? module.definition : module;
      
      // 搜索名称
      if (definition.name.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索描述
      if (definition.description?.toLowerCase().includes(query)) {
        return true;
      }

      // 搜索关键词
      if (definition.keywords?.some((keyword: string) => keyword.toLowerCase().includes(query))) {
        return true;
      }

      // 搜索作者
      if (definition.author?.toLowerCase().includes(query)) {
        return true;
      }

      return false;
    });
  }, [modules, searchQuery]);

  return filteredModules;
}

/**
 * 搜索输入 Hook - 管理搜索输入状态和防抖
 */
export function useSearchInput(initialValue = "", delay = 300) {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);

  const handleChange = useCallback((value: string) => {
    setInputValue(value);
    
    // 简单防抖实现
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const clearSearch = useCallback(() => {
    setInputValue("");
    setDebouncedValue("");
  }, []);

  return {
    inputValue,
    debouncedValue,
    setInputValue: handleChange,
    clearSearch,
  };
}
