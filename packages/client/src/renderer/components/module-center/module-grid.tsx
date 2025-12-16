/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { AnimatePresence, motion } from "framer-motion";
import { PackageOpen } from "lucide-react";
import { EmptyState } from "../ui/empty-state";
import { SkeletonLoader } from "../ui/skeleton-loader";
import { ModuleCard, AvailableModuleCard } from "./module-card";
import { ModuleListItem } from "./module-list-item";
import type { ModuleInstance, ModuleDefinition } from "@/types/module";
import type { ToolRegistryEntry } from "@booltox/shared";
import type { ViewMode } from "./types";

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
  isDevPlugin?: (moduleId: string) => boolean; // 检查是否为开发工具
  isSelectionMode?: boolean; // 是否为选择模式
  selectedToolIds?: Set<string>; // 已选中的工具 ID
  onSelect?: (moduleId: string) => void; // 选择回调
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
  emptyMessage = "暂无工具",
  isDevPlugin,
  isSelectionMode = false,
  selectedToolIds = new Set(),
  onSelect,
}: ModuleGridProps) {
  // 加载状态
  if (isLoading) {
    return (
      <div
        className={`grid gap-6 ${
          viewMode === "grid"
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        }`}
      >
        <SkeletonLoader type="module-card" count={8} />
      </div>
    );
  }

  // 空状态
  if (modules.length === 0) {
    return (
      <EmptyState
        icon={<PackageOpen size={64} strokeWidth={1.5} />}
        title={emptyMessage}
        description="尝试调整搜索条件或过滤器"
      />
    );
  }

  // 判断是已安装模块还是可用模块
  const isInstalledModule = (
    module: ModuleInstance | ModuleDefinition | ToolRegistryEntry
  ): module is ModuleInstance => {
    // 不仅要有 runtime 属性，还要检查 runtime.installed 的值
    return "runtime" in module && (module as ModuleInstance).runtime.installed !== false;
  };

  const isToolRegistryEntry = (
    module: ModuleInstance | ModuleDefinition | ToolRegistryEntry
  ): module is ToolRegistryEntry => {
    return "downloadUrl" in module || ("hash" in module && !("loader" in module));
  };

  return (
    <motion.div
      layout
      className={`grid gap-6 ${
        viewMode === "grid"
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
      }`}
    >
      <AnimatePresence mode="popLayout">
        {modules.map((module) => {
          // 列表视图: 使用统一的列表项组件
          if (viewMode === "list") {
            // ToolRegistryEntry 不支持列表视图,跳过或使用卡片
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

            // 对于 ModuleInstance，如果未安装也使用 AvailableModuleCard
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

          // 网格视图: 使用不同的卡片组件
          if (isToolRegistryEntry(module) || !isInstalledModule(module)) {
            // 可用模块/工具卡片
            // 处理不同的数据结构：ModuleInstance 的属性在 definition 里
            const hasDefinition = 'definition' in module;
            const moduleData = {
              id: module.id,
              name: hasDefinition ? (module as unknown as ModuleInstance).definition.name : (module as unknown as ModuleDefinition).name,
              description: hasDefinition ? (module as unknown as ModuleInstance).definition.description : (module as unknown as ModuleDefinition).description,
              version: hasDefinition ? (module as unknown as ModuleInstance).definition.version : (module as unknown as ModuleDefinition).version,
              category: hasDefinition ? (module as unknown as ModuleInstance).definition.category : (module as unknown as ModuleDefinition).category,
              icon: hasDefinition ? (module as unknown as ModuleInstance).definition.icon : (module as unknown as ModuleDefinition).icon,
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
            // 已安装模块卡片
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
      </AnimatePresence>
    </motion.div>
  );
}
