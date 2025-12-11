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
  onPinToggle?: (moduleId: string) => void;
  onCardClick: (moduleId: string) => void;
  emptyMessage?: string;
  isDevPlugin?: (moduleId: string) => boolean; // 检查是否为开发工具
}

export function ModuleGrid({
  modules,
  viewMode,
  isLoading = false,
  processingModuleId,
  onUninstall,
  onInstall,
  onOpen,
  onPinToggle,
  onCardClick,
  emptyMessage = "暂无工具",
  isDevPlugin,
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
    return "runtime" in module;
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
            
            return (
              <ModuleListItem
                key={module.id}
                module={module}
                onUninstall={onUninstall}
                onOpen={onOpen}
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
          } else {
            // 已安装模块卡片
            return (
              <ModuleCard
                key={module.id}
                module={module}
                onUninstall={onUninstall || (() => {})}
                onOpen={onOpen || (() => {})}
                onPinToggle={onPinToggle || (() => {})}
                onClick={onCardClick}
                isDev={isDevPlugin?.(module.id) || false}
              />
            );
          }
        })}
      </AnimatePresence>
    </motion.div>
  );
}
