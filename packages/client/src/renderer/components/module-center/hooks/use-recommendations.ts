/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from "react";
import type { ModuleDefinition, ModuleInstance } from "@/types/module";
import type { RecommendedModules } from "../types";

/**
 * 推荐 Hook - 提供智能推荐算法
 * 包括热门推荐、新发布、智能推荐
 */
export function useRecommendations(
  installedModules: ModuleInstance[],
  availableModules: ModuleDefinition[]
): RecommendedModules {
  const recommendations = useMemo(() => {
    // 排除已安装的模块
    const installedIds = new Set(installedModules.map((m) => m.id));
    const uninstalledModules = availableModules.filter((def) => !installedIds.has(def.id));

    // 1. 热门推荐 - 简单取前10个
    // TODO: 未来可以基于下载量、使用量等指标
    const popular = uninstalledModules.slice(0, 10);

    // 2. 新发布模块 - 最近7天内
    // TODO: 未来添加 publishedAt 字段后实现
    // 目前返回空数组
    const newReleases: ModuleDefinition[] = [];

    // 3. 智能推荐 - 基于已安装模块的分类
    const installedCategories = new Set(
      installedModules
        .map((m) => m.definition.category)
        .filter((c): c is string => Boolean(c))
    );

    const smart = uninstalledModules
      .filter((module) => {
        // 推荐相同分类的模块
        return module.category && installedCategories.has(module.category);
      })
      .slice(0, 10);

    // 如果智能推荐不足,补充热门模块
    if (smart.length < 5) {
      const smartIds = new Set(smart.map((m) => m.id));
      const supplements = popular
        .filter((m) => !smartIds.has(m.id))
        .slice(0, 5 - smart.length);
      smart.push(...supplements);
    }

    return {
      popular,
      newReleases,
      smart,
    };
  }, [installedModules, availableModules]);

  return recommendations;
}
