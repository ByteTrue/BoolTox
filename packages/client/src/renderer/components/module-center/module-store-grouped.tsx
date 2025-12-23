/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { AvailableModuleCard } from './module-card';
import { EmptyState } from '../ui/empty-state';
import { getGridColumns, GRID_BREAKPOINTS } from '@/theme/grid-config';
import type { ModuleInstance } from '@/types/module';
import { PackageOpen } from 'lucide-react';

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
      <EmptyState
        icon={<PackageOpen size={64} strokeWidth={1.5} />}
        title="暂无可安装的工具"
        description="尝试添加新的工具源"
      />
    );
  }

  return (
    <Stack spacing={6}>
      {groupedBySource.map(group => (
        <Box key={group.sourceId}>
          {/* 分组标题 */}
          <Stack direction="row" spacing={2} alignItems="baseline" sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={700}>
              📂 {group.sourceName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ({group.count} 个可安装)
            </Typography>
          </Stack>

          {/* 工具网格 */}
          {group.count === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
              暂无未安装的工具
            </Typography>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 3,
                gridTemplateColumns: getGridColumns(GRID_BREAKPOINTS.MODULE_CARD),
              }}
            >
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
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}
