import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ComponentType } from "react";
import { findModuleDefinition, listModuleDefinitions } from "@core/modules/registry";
import { moduleRegistry } from "@core/modules/registry-remote";
import { moduleInstaller } from "@core/modules/installer";
import type { ModuleDefinition, ModuleInstance, ModuleRuntime, ModuleStats, ModuleStatus, RemoteModuleEntry } from "@core/modules/types";
import { logModuleEvent } from "@/utils/module-event-logger";
import type { StoredModuleInfo } from "@shared/types/module-store.types";

interface ModuleContextValue {
  availableModules: ModuleDefinition[];
  installedModules: ModuleInstance[];
  remoteModules: RemoteModuleEntry[];
  moduleStats: ModuleStats;
  activeModuleId: string | null;
  setActiveModuleId: (moduleId: string | null) => void;
  installModule: (moduleId: string, remote?: boolean) => Promise<void>;
  uninstallModule: (moduleId: string) => Promise<void>;
  setModuleStatus: (moduleId: string, status: ModuleStatus) => void;
  toggleModuleStatus: (moduleId: string) => void;
  getModuleById: (moduleId: string) => ModuleInstance | undefined;
  refreshRemoteModules: () => Promise<void>;
  // 快速访问功能
  quickAccessModules: ModuleInstance[];
  pinToQuickAccess: (moduleId: string) => Promise<void>;
  unpinFromQuickAccess: (moduleId: string) => Promise<void>;
  updateQuickAccessOrder: (orderedIds: string[]) => Promise<void>;
}

const registryDefinitions: ModuleDefinition[] = listModuleDefinitions();
const registryMap = new Map<string, ModuleDefinition>(registryDefinitions.map((definition) => [definition.id, definition]));

function createRuntime(
  status: ModuleStatus, 
  component: ComponentType | null = null, 
  loading = false, 
  installed = true
): ModuleRuntime {
  return {
    status,
    component,
    loading,
    error: null,
    installed,
  };
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [installedModules, setInstalledModules] = useState<ModuleInstance[]>([]);
  const [remoteModules, setRemoteModules] = useState<RemoteModuleEntry[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);

  // 从持久化存储恢复已安装模块
  useEffect(() => {
    const restoreInstalledModules = async () => {
      try {
        const storedModules = await window.moduleStore.getAll();
        
        if (storedModules.length === 0) {
          // 首次启动：加载默认模块
          const defaultModules = registryDefinitions
            .filter((definition) => definition.installedByDefault)
            .map((definition) => ({
              id: definition.id,
              definition,
              runtime: createRuntime("enabled"),
            }));
          
          setInstalledModules(defaultModules);
          
          // 持久化默认模块
          for (const module of defaultModules) {
            const info: StoredModuleInfo = {
              id: module.id,
              status: module.runtime.status,
              installedAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
              version: module.definition.version,
              source: module.definition.source || 'local',
              // 初始化快速访问字段为 false
              pinnedToQuickAccess: false,
              quickAccessOrder: undefined,
              pinnedAt: undefined,
            };
            await window.moduleStore.add(info);
          }
        } else {
          // 从存储恢复
          const restoredModules: ModuleInstance[] = [];
          
          for (const stored of storedModules) {
            const definition = registryMap.get(stored.id) ?? findModuleDefinition(stored.id);
            
            if (definition) {
              restoredModules.push({
                id: stored.id,
                definition,
                runtime: createRuntime(stored.status, null, false, true),
                // 携带快速访问信息
                pinnedToQuickAccess: stored.pinnedToQuickAccess,
                quickAccessOrder: stored.quickAccessOrder,
                pinnedAt: stored.pinnedAt,
              });
            } else {
              console.warn(`[ModuleContext] 无法找到模块定义: ${stored.id}`);
            }
          }
          
          setInstalledModules(restoredModules);
        }
        
      } catch (error) {
        console.error('[ModuleContext] 恢复模块失败:', error);
        // 降级：使用默认模块
        const defaultModules = registryDefinitions
          .filter((definition) => definition.installedByDefault)
          .map((definition) => ({
            id: definition.id,
            definition,
            runtime: createRuntime("enabled"),
          }));
        setInstalledModules(defaultModules);
      }
    };

    void restoreInstalledModules();
  }, []);

  // 加载远程模块清单
  const refreshRemoteModules = useCallback(async () => {
    try {
      const manifest = await moduleRegistry.fetchManifest();
      setRemoteModules(manifest.modules);
    } catch (error) {
      console.error("获取远程模块失败:", error);
    }
  }, []);

  // 初始化时加载远程模块
  useEffect(() => {
    void refreshRemoteModules();
  }, [refreshRemoteModules]);

  const loadModuleComponent = useCallback(async (moduleId: string, definition: ModuleDefinition) => {
    setInstalledModules((current) =>
      current.map((module) =>
        module.id === moduleId
          ? { ...module, runtime: { ...module.runtime, loading: true, error: null } }
          : module,
      ),
    );

    try {
      const result = await definition.loader();
      if (!result) {
        throw new Error(`${definition.name} 未提供可用入口`);
      }
      const component: ComponentType = result;

      setInstalledModules((current) =>
        current.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                runtime: {
                  ...module.runtime,
                  component,
                  loading: false,
                  error: null,
                },
              }
            : module,
        ),
      );
    } catch (error) {
      setInstalledModules((current) =>
        current.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                runtime: {
                  ...module.runtime,
                  loading: false,
                  error: error instanceof Error ? error.message : "模块加载失败",
                },
              }
            : module,
        ),
      );
    }
  }, []);

  useEffect(() => {
    installedModules.forEach((module) => {
      if (module.runtime.component || module.runtime.loading) {
        return;
      }
      const definition = registryMap.get(module.id);
      if (definition) {
        void loadModuleComponent(module.id, definition);
      }
    });
  }, [installedModules, loadModuleComponent]);

  const moduleStats = useMemo<ModuleStats>(() => {
    return installedModules.reduce<ModuleStats>(
      (stats, module) => {
        stats.total += 1;
        if (module.runtime.status === "enabled") {
          stats.enabled += 1;
        } else {
          stats.disabled += 1;
        }
        if (module.definition.source === "remote") {
          stats.remote += 1;
        } else {
          stats.local += 1;
        }
        return stats;
      },
      { total: 0, enabled: 0, disabled: 0, local: 0, remote: 0 },
    );
  }, [installedModules]);

  const installModule = useCallback(
    async (moduleId: string, remote = false) => {
      // 如果是远程模块,先下载安装
      if (remote) {
        const remoteEntry = remoteModules.find((m) => m.id === moduleId);
        if (!remoteEntry) {
          throw new Error(`未找到远程模块 ${moduleId}`);
        }

        // 使用 installer 下载并创建模块定义
        const definition = await moduleInstaller.installRemoteModule(remoteEntry);
        registryMap.set(moduleId, definition);

        // 获取缓存路径
        const cachePath = await window.moduleStore.getCachePath(moduleId);

        setInstalledModules((current) => {
          if (current.some((module) => module.id === moduleId)) {
            return current;
          }
          return [
            ...current,
            {
              id: moduleId,
              definition,
              runtime: createRuntime("enabled", null, true, true),
            },
          ];
        });

        // 持久化到存储
        const info: StoredModuleInfo = {
          id: moduleId,
          status: 'enabled',
          installedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          version: definition.version,
          source: 'remote',
          cachedPath: cachePath || undefined,
          // 初始化快速访问字段
          pinnedToQuickAccess: false,
          quickAccessOrder: undefined,
          pinnedAt: undefined,
        };
        await window.moduleStore.add(info);

        await loadModuleComponent(moduleId, definition);
        return;
      }

      // 本地模块安装逻辑
      const definition = registryMap.get(moduleId) ?? findModuleDefinition(moduleId);
      if (!definition) {
        throw new Error(`未找到模块 ${moduleId}`);
      }

      setInstalledModules((current) => {
        if (current.some((module) => module.id === moduleId)) {
          return current;
        }
        return [
          ...current,
          {
            id: moduleId,
            definition,
            runtime: createRuntime("enabled", null, true),
          },
        ];
      });

      // 持久化到存储
      const info: StoredModuleInfo = {
        id: moduleId,
        status: 'enabled',
        installedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        version: definition.version,
        source: definition.source || 'local',
        // 初始化快速访问字段
        pinnedToQuickAccess: false,
        quickAccessOrder: undefined,
        pinnedAt: undefined,
      };
      await window.moduleStore.add(info);

      await loadModuleComponent(moduleId, definition);

      // 记录安装事件
      logModuleEvent({
        moduleId,
        moduleName: definition.name,
        action: 'install',
        category: definition.category || 'unknown',
      });
    },
    [loadModuleComponent, remoteModules],
  );

  const uninstallModule = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find((m) => m.id === moduleId);
      
      // 如果是远程模块,清理缓存
      if (module?.definition.source === "remote") {
        await moduleInstaller.uninstallModule(moduleId);
        // 删除文件系统缓存
        await window.moduleStore.removeCache(moduleId);
      }

      // 记录卸载事件（在删除之前）
      if (module) {
        logModuleEvent({
          moduleId,
          moduleName: module.definition.name,
          action: 'uninstall',
          category: module.definition.category || 'unknown',
        });
      }

      // 从持久化存储删除
      await window.moduleStore.remove(moduleId);

      setInstalledModules((current) => current.filter((module) => module.id !== moduleId));
      setActiveModuleId((current) => (current === moduleId ? null : current));
    },
    [installedModules],
  );

  const setModuleStatus = useCallback(async (moduleId: string, status: ModuleStatus) => {
    setInstalledModules((current) =>
      current.map((module) => {
        if (module.id === moduleId) {
          // 记录状态变更事件
          logModuleEvent({
            moduleId,
            moduleName: module.definition.name,
            action: status === 'enabled' ? 'enable' : 'disable',
            category: module.definition.category || 'unknown',
          });
          return { ...module, runtime: { ...module.runtime, status } };
        }
        return module;
      }),
    );

    // 持久化状态变更
    await window.moduleStore.updateStatus(moduleId, status);

    if (status === "disabled") {
      setActiveModuleId((current) => (current === moduleId ? null : current));
    }
  }, []);

  const toggleModuleStatus = useCallback(async (moduleId: string) => {
    let newStatus: ModuleStatus = 'enabled';
    
    setInstalledModules((current) =>
      current.map((module) => {
        if (module.id !== moduleId) {
          return module;
        }
        const nextStatus: ModuleStatus = module.runtime.status === "enabled" ? "disabled" : "enabled";
        newStatus = nextStatus;
        return {
          ...module,
          runtime: { ...module.runtime, status: nextStatus },
        };
      }),
    );
    
    // 持久化状态变更
    await window.moduleStore.updateStatus(moduleId, newStatus);
  }, []);

  const getModuleById = useCallback(
    (moduleId: string) => installedModules.find((module) => module.id === moduleId),
    [installedModules],
  );

  // 快速访问功能实现
  const quickAccessModules = useMemo(() => {
    const pinned = installedModules
      .filter((module) => module.pinnedToQuickAccess === true)
      .sort((a, b) => {
        const orderA = a.quickAccessOrder ?? 999;
        const orderB = b.quickAccessOrder ?? 999;
        return orderA - orderB;
      });
    
    return pinned;
  }, [installedModules]);

  const pinToQuickAccess = useCallback(async (moduleId: string) => {
    const module = installedModules.find((m) => m.id === moduleId);
    if (!module) return;

    // 获取当前最大的 order 值
    const maxOrder = Math.max(
      0,
      ...installedModules
        .filter((m) => m.pinnedToQuickAccess)
        .map((m) => m.quickAccessOrder ?? 0)
    );

    const now = new Date().toISOString();

    // 更新存储
    const stored = await window.moduleStore.get(moduleId);
    
    if (stored) {
      await window.moduleStore.update(moduleId, {
        pinnedToQuickAccess: true,
        quickAccessOrder: maxOrder + 1,
        pinnedAt: now,
      });

      // 更新本地状态
      setInstalledModules((current) =>
        current.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                pinnedToQuickAccess: true,
                quickAccessOrder: maxOrder + 1,
                pinnedAt: now,
              }
            : m
        )
      );

      logModuleEvent({
        moduleId,
        moduleName: module.definition.name,
        action: 'pin-to-quick-access',
        category: module.definition.category || 'unknown',
      });
    }
  }, [installedModules]);

  const unpinFromQuickAccess = useCallback(async (moduleId: string) => {
    const module = installedModules.find((m) => m.id === moduleId);
    if (!module) return;

    // 更新存储
    const stored = await window.moduleStore.get(moduleId);
    if (stored) {
      await window.moduleStore.update(moduleId, {
        pinnedToQuickAccess: false,
        quickAccessOrder: undefined,
        pinnedAt: undefined,
      });

      // 更新本地状态
      setInstalledModules((current) =>
        current.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                pinnedToQuickAccess: false,
                quickAccessOrder: undefined,
                pinnedAt: undefined,
              }
            : m
        )
      );

      logModuleEvent({
        moduleId,
        moduleName: module.definition.name,
        action: 'unpin-from-quick-access',
        category: module.definition.category || 'unknown',
      });
    }
  }, [installedModules]);

  const updateQuickAccessOrder = useCallback(async (orderedIds: string[]) => {
    // 批量更新排序
    for (let i = 0; i < orderedIds.length; i++) {
      const moduleId = orderedIds[i];
      const stored = await window.moduleStore.get(moduleId);
      if (stored) {
        await window.moduleStore.update(moduleId, {
          quickAccessOrder: i,
        });
      }
    }

    // 更新本地状态
    setInstalledModules((current) =>
      current.map((m) => {
        const newOrder = orderedIds.indexOf(m.id);
        if (newOrder >= 0) {
          return {
            ...m,
            quickAccessOrder: newOrder,
          };
        }
        return m;
      })
    );
  }, []);

  const contextValue = useMemo<ModuleContextValue>(
    () => ({
      availableModules: registryDefinitions,
      installedModules,
      remoteModules,
      moduleStats,
      activeModuleId,
      setActiveModuleId,
      installModule,
      uninstallModule,
      setModuleStatus,
      toggleModuleStatus,
      getModuleById,
      refreshRemoteModules,
      quickAccessModules,
      pinToQuickAccess,
      unpinFromQuickAccess,
      updateQuickAccessOrder,
    }),
    [
      activeModuleId,
      getModuleById,
      installModule,
      installedModules,
      moduleStats,
      remoteModules,
      setModuleStatus,
      toggleModuleStatus,
      uninstallModule,
      refreshRemoteModules,
      quickAccessModules,
      pinToQuickAccess,
      unpinFromQuickAccess,
      updateQuickAccessOrder,
    ],
  );

  return <ModuleContext.Provider value={contextValue}>{children}</ModuleContext.Provider>;
}

export function useModulePlatform() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error("useModulePlatform 必须在 ModuleProvider 内使用");
  }
  return context;
}
