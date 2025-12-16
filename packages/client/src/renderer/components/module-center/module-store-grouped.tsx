/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import { AvailableModuleCard } from './module-card';
import type { ModuleInstance } from '@/types/module';
import { useTheme } from '../theme-provider';

interface ModuleStoreGroupedProps {
  modules: ModuleInstance[];
  processingModuleId?: string | null;
  onInstall: (moduleId: string) => void;
  onCardClick: (moduleId: string) => void;
}

/**
 * 按工具源分组展示工具市场
 */
export function ModuleStoreGrouped({
  modules,
  processingModuleId,
  onInstall,
  onCardClick,
}: ModuleStoreGroupedProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // 按 sourceId 分组
  const groupedBySource = useMemo(() => {
    const groups = new Map<string, ModuleInstance[]>();

    modules.forEach(module => {
      const sourceId = module.sourceId || 'unknown';
      if (!groups.has(sourceId)) {
        groups.set(sourceId, []);
      }
      groups.get(sourceId)!.push(module);
    });

    // 转换为数组并排序（官方源优先）
    return Array.from(groups.entries())
      .map(([sourceId, tools]) => ({
        sourceId,
        sourceName: tools[0]?.sourceName || '未知来源',
        tools,
        count: tools.length,
      }))
      .sort((a, b) => {
        if (a.sourceId === 'official') return -1;
        if (b.sourceId === 'official') return 1;
        return a.sourceName.localeCompare(b.sourceName);
      });
  }, [modules]);

  // 空状态
  if (modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className={`text-6xl mb-4 ${isDark ? 'opacity-20' : 'opacity-10'}`}>
          📦
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
          暂无可安装的工具
        </h3>
        <p className="text-gray-500 text-sm">
          尝试添加新的工具源
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {groupedBySource.map(group => (
        <div key={group.sourceId}>
          {/* 分组标题 */}
          <div className="flex items-baseline gap-3 mb-6">
            <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              📂 {group.sourceName}
            </h3>
            <span className="text-sm text-gray-500">
              ({group.count} 个可安装)
            </span>
          </div>

          {/* 工具网格 */}
          {group.count === 0 ? (
            <p className="text-gray-500 text-sm pl-4">暂无未安装的工具</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {group.tools.map(tool => {
                const moduleData = {
                  id: tool.id,
                  name: tool.definition.name,
                  description: tool.definition.description,
                  version: tool.definition.version,
                  category: tool.definition.category,
                  icon: tool.definition.icon,
                };
                return (
                  <AvailableModuleCard
                    key={tool.id}
                    module={moduleData}
                    onInstall={onInstall}
                    onClick={onCardClick}
                    isInstalling={processingModuleId === tool.id}
                  />
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
