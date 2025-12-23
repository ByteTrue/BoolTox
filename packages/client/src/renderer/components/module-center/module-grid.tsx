/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import { PackageOpen } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';
import { SkeletonLoader } from '../ui/skeleton-loader';
import { ModuleCard, AvailableModuleCard } from './module-card';
import { ModuleListItem } from './module-list-item';
import type { ModuleInstance, ModuleDefinition } from '@/types/module';
import type { ToolRegistryEntry } from '@booltox/shared';
import type { ViewMode } from './types';

interface ModuleGridProps {
  modules: ModuleInstance[] | ModuleDefinition[] | ToolRegistryEntry[];
  viewMode: ViewMode;
  isLoading?: boolean;
  processingModuleId?: string | null;
  onUninstall?: (moduleId: string) => void;
  onInstall?: (moduleId: string) => void;
  onOpen?: (moduleId: string) => void;
  onStop?: (moduleId: string) => void;
  onPinToggle?: (moduleId: string) => void;
  onCardClick: (moduleId: string) => void;
  emptyMessage?: string;
  isDevPlugin?: (moduleId: string) => boolean;
  isSelectionMode?: boolean;
  selectedToolIds?: Set<string>;
  onSelect?: (moduleId: string) => void;
}

export function ModuleGrid({
  modules,
  viewMode,
  isLoading = false,
  processingModuleId,
  onUninstall,
  onInstall,
  onOpen,
  onStop,
  onPinToggle,
  onCardClick,
  emptyMessage = '暂无工具',
  isDevPlugin,
  isSelectionMode = false,
  selectedToolIds = new Set(),
  onSelect,
}: ModuleGridProps) {
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns:
            viewMode === 'grid'
              ? { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }
              : '1fr',
        }}
      >
        <SkeletonLoader type="module-card" count={8} />
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

  const isInstalledModule = (
    module: ModuleInstance | ModuleDefinition | ToolRegistryEntry
  ): module is ModuleInstance => {
    return 'runtime' in module && (module as ModuleInstance).runtime.installed !== false;
  };

  const isToolRegistryEntry = (
    module: ModuleInstance | ModuleDefinition | ToolRegistryEntry
  ): module is ToolRegistryEntry => {
    return 'downloadUrl' in module || ('hash' in module && !('loader' in module));
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns:
          viewMode === 'grid'
            ? { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)' }
            : '1fr',
      }}
    >
      {modules.map(module => {
        if (viewMode === 'list') {
          if (isToolRegistryEntry(module)) {
            const moduleData = {
              id: module.id,
              name: module.name,
              description: module.description,
              version: module.version,
              category: module.category,
              icon: module.icon,
            };
            return (
              <AvailableModuleCard
                key={module.id}
                module={moduleData}
                onInstall={onInstall || (() => {})}
                onClick={onCardClick}
                isInstalling={processingModuleId === module.id}
              />
            );
          }

          if ('runtime' in module && !isInstalledModule(module)) {
            const moduleInstance = module as unknown as ModuleInstance;
            const moduleData = {
              id: moduleInstance.id,
              name: moduleInstance.definition.name,
              description: moduleInstance.definition.description,
              version: moduleInstance.definition.version,
              category: moduleInstance.definition.category,
              icon: moduleInstance.definition.icon,
            };
            return (
              <AvailableModuleCard
                key={module.id}
                module={moduleData}
                onInstall={onInstall || (() => {})}
                onClick={onCardClick}
                isInstalling={processingModuleId === module.id}
              />
            );
          }

          return (
            <ModuleListItem
              key={module.id}
              module={module}
              onUninstall={onUninstall}
              onOpen={onOpen}
              onStop={onStop}
              onInstall={onInstall}
              onClick={onCardClick}
              isProcessing={processingModuleId === module.id}
              isDev={isDevPlugin?.(module.id) || false}
            />
          );
        }

        if (isToolRegistryEntry(module) || !isInstalledModule(module)) {
          const hasDefinition = 'definition' in module;
          const moduleData = {
            id: module.id,
            name: hasDefinition
              ? (module as unknown as ModuleInstance).definition.name
              : (module as unknown as ModuleDefinition).name,
            description: hasDefinition
              ? (module as unknown as ModuleInstance).definition.description
              : (module as unknown as ModuleDefinition).description,
            version: hasDefinition
              ? (module as unknown as ModuleInstance).definition.version
              : (module as unknown as ModuleDefinition).version,
            category: hasDefinition
              ? (module as unknown as ModuleInstance).definition.category
              : (module as unknown as ModuleDefinition).category,
            icon: hasDefinition
              ? (module as unknown as ModuleInstance).definition.icon
              : (module as unknown as ModuleDefinition).icon,
          };

          return (
            <AvailableModuleCard
              key={module.id}
              module={moduleData}
              onInstall={onInstall || (() => {})}
              onClick={onCardClick}
              isInstalling={processingModuleId === module.id}
            />
          );
        } else {
          return (
            <ModuleCard
              key={module.id}
              module={module}
              onUninstall={onUninstall || (() => {})}
              onOpen={onOpen || (() => {})}
              onStop={onStop || (() => {})}
              onPinToggle={onPinToggle || (() => {})}
              onClick={onCardClick}
              isDev={isDevPlugin?.(module.id) || false}
              isSelectionMode={isSelectionMode}
              isSelected={selectedToolIds.has(module.id)}
              onSelect={onSelect}
            />
          );
        }
      })}
    </Box>
  );
}
