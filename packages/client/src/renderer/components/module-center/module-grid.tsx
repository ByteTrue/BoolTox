/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import { PackageOpen } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { SkeletonLoader } from '../ui/skeleton-loader';
import { AvailableModuleCard } from './module-card';
import { ModuleListItem } from './module-list-item';
import { toModuleViewModels } from './module-view-model';
import type { ModuleInstance, ModuleDefinition } from '@/types/module';
import type { ToolRegistryEntry } from '@booltox/shared';

interface ModuleGridProps {
  modules: ModuleInstance[] | ModuleDefinition[] | ToolRegistryEntry[];
  isLoading?: boolean;
  processingModuleId?: string | null;
  onUninstall?: (moduleId: string) => void;
  onInstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  onStop?: (moduleId: string) => void;
  onCardClick: (moduleId: string) => void;
  emptyMessage?: string;
  isDevPlugin?: (moduleId: string) => boolean;
}

export function ModuleGrid({
  modules,
  isLoading = false,
  processingModuleId,
  onUninstall,
  onInstall,
  onOpen,
  onStop,
  onCardClick,
  emptyMessage = '暂无工具',
  isDevPlugin,
}: ModuleGridProps) {
  // 统一转换为 ViewModel - 消除类型判断逻辑（必须在所有 hooks 之前）
  const viewModels = useMemo(() => toModuleViewModels(modules), [modules]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
        <SkeletonLoader type="list-item" count={8} />
      </Box>
    );
  }

  if (modules.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen size={64} strokeWidth={1.5} />}
        title={emptyMessage}
        description="尝试调整搜索条件或过滤器"
      />
    );
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr' }}>
      {viewModels.map(vm => {
        if (vm.type === 'installed') {
          return (
            <ModuleListItem
              key={vm.id}
              module={modules.find(m => m.id === vm.id)!}
              onUninstall={onUninstall}
              onOpen={onOpen}
              onStop={onStop}
              onInstall={onInstall}
              onClick={onCardClick}
              isProcessing={processingModuleId === vm.id}
              isDev={isDevPlugin?.(vm.id) || false}
            />
          );
        } else {
          // available 或 registry
          return (
            <AvailableModuleCard
              key={vm.id}
              module={{
                id: vm.id,
                name: vm.name,
                description: vm.description,
                version: vm.version,
                category: vm.category,
                icon: vm.icon,
              }}
              onInstall={onInstall || (() => {})}
              onClick={onCardClick}
              isInstalling={processingModuleId === vm.id}
            />
          );
        }
      })}
    </Box>
  );
}
