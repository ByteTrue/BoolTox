import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { ComponentType } from "react";
import { findModuleDefinition, listModuleDefinitions } from "@core/modules/registry";
import type { ModuleDefinition, ModuleInstance, ModuleRuntime, ModuleStats, ModuleLaunchState } from "@core/modules/types";
import { logModuleEvent } from "@/utils/module-event-logger";
import type { StoredModuleInfo } from "@shared/types/module-store.types";
import type { PluginRuntime as PluginProcessRuntime, PluginRegistryEntry, PluginInstallProgress } from "@booltox/shared";
import { useToast } from "./toast-context";

interface ModuleContextValue {
  availableModules: ModuleDefinition[];
  installedModules: ModuleInstance[];
  pluginRegistry: PluginProcessRuntime[]; // 已安装的插件列表(新插件系统)
  availablePlugins: PluginRegistryEntry[]; // 在线插件列表
  moduleStats: ModuleStats;
  activeModuleId: string | null;
  setActiveModuleId: (moduleId: string | null) => void;
  openModule: (moduleId: string) => Promise<void>;
  focusModuleWindow: (moduleId: string) => Promise<void>;
  installModule: (moduleId: string, remote?: boolean) => Promise<void>;
  installOnlinePlugin: (entry: PluginRegistryEntry) => Promise<void>; // 安装在线插件
  uninstallModule: (moduleId: string) => Promise<void>;
  getModuleById: (moduleId: string) => ModuleInstance | undefined;
  isDevPlugin: (moduleId: string) => boolean; // 检查是否为开发插件
  refreshAvailablePlugins: () => Promise<void>; // 刷新在线插件
  // 收藏功能
  favoriteModules: ModuleInstance[];
  addFavorite: (moduleId: string) => Promise<void>;
  removeFavorite: (moduleId: string) => Promise<void>;
  updateFavoriteOrder: (orderedIds: string[]) => Promise<void>;
  runningPluginIds: string[];
}

type PluginChannelStatus = "launching" | "loading" | "running" | "stopping" | "stopped" | "error";

interface PluginStatePayload {
  pluginId: string;
  status: PluginChannelStatus;
  windowId?: number;
  viewId?: number;
  message?: string;
  focused?: boolean;
}

const registryDefinitions: ModuleDefinition[] = listModuleDefinitions();
const registryMap = new Map<string, ModuleDefinition>(registryDefinitions.map((definition) => [definition.id, definition]));

function createRuntime(
  component: ComponentType | null = null, 
  loading = false, 
  installed = true
): ModuleRuntime {
  return {
    component,
    loading,
    error: null,
    installed,
    launchState: "idle",
    lastError: null,
  };
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [installedModules, setInstalledModules] = useState<ModuleInstance[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [availablePlugins, setAvailablePlugins] = useState<PluginRegistryEntry[]>([]);
  const { showToast } = useToast();
  const [pluginRegistry, setPluginRegistry] = useState<PluginProcessRuntime[]>([]);
  const installedModulesRef = useRef<ModuleInstance[]>([]);
  const toastHistoryRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    installedModulesRef.current = installedModules;
  }, [installedModules]);

  const refreshPluginRegistry = useCallback(async () => {
    try {
      const plugins = await window.ipc.invoke('plugin:get-all');
      if (Array.isArray(plugins)) {
        setPluginRegistry(plugins as PluginProcessRuntime[]);
      } else {
        setPluginRegistry([]);
      }
    } catch (error) {
      console.error('[ModuleContext] 获取插件列表失败:', error);
    }
  }, []);

  useEffect(() => {
    void refreshPluginRegistry();
  }, [refreshPluginRegistry]);

  // 获取在线插件列表
  const refreshAvailablePlugins = useCallback(async () => {
    try {
      const registry = await window.gitOps.getPlugins();
      setAvailablePlugins(registry.plugins || []);
    } catch (error) {
      console.error('[ModuleContext] 获取在线插件列表失败:', error);
    }
  }, []);

  useEffect(() => {
    void refreshAvailablePlugins();
  }, [refreshAvailablePlugins]);

  const pluginIdSet = useMemo(() => new Set(pluginRegistry.map((plugin) => plugin.id)), [pluginRegistry]);

  const isWindowPlugin = useCallback(
    (moduleId: string) => pluginIdSet.has(moduleId) || moduleId.startsWith("com.booltox."),
    [pluginIdSet],
  );

  // 检查是否为开发插件(不可卸载)
  const isDevPlugin = useCallback(
    (moduleId: string) => {
      const plugin = pluginRegistry.find((p) => p.id === moduleId);
      return plugin?.isDev === true;
    },
    [pluginRegistry],
  );

  const mapStatusToLaunchState = useCallback((status: PluginChannelStatus): ModuleLaunchState => {
    switch (status) {
      case "launching":
      case "loading":
        return "launching";
      case "running":
        return "running";
      case "stopping":
        return "stopping";
      case "error":
        return "error";
      case "stopped":
      default:
        return "idle";
    }
  }, []);

  const patchModuleRuntime = useCallback(
    (moduleId: string, patch: Partial<ModuleRuntime> | ((runtime: ModuleRuntime) => Partial<ModuleRuntime>)) => {
      setInstalledModules((current) =>
        current.map((module) => {
          if (module.id !== moduleId) return module;
          const nextPatch = typeof patch === "function" ? patch(module.runtime) : patch;
          return {
            ...module,
            runtime: {
              ...module.runtime,
              ...nextPatch,
            },
          };
        }),
      );
    },
    [setInstalledModules],
  );

  const shouldAnnounceToast = useCallback(
    (key: string, interval = 1500) => {
      const now = Date.now();
      const last = toastHistoryRef.current.get(key);
      if (last && now - last < interval) {
        return false;
      }
      toastHistoryRef.current.set(key, now);
      return true;
    },
    [],
  );

  useEffect(() => {
    const handler = (payload: PluginStatePayload) => {
      if (!payload?.pluginId) return;
      const { pluginId, status, windowId, message } = payload;
      const launchState = mapStatusToLaunchState(status);

      patchModuleRuntime(pluginId, (runtime) => ({
        launchState,
        runningWindowId:
          status === "running"
            ? windowId ?? runtime.runningWindowId
            : status === "stopped"
              ? undefined
              : runtime.runningWindowId,
        lastLaunchAt: status === "running" ? new Date().toISOString() : runtime.lastLaunchAt,
        lastError: status === "error" ? (message ?? "插件启动失败") : status === "running" ? null : runtime.lastError,
      }));

      const isFocusedUpdate = payload.focused === true;

      if ((status === "running" && !isFocusedUpdate) || status === "error") {
        const targetModule = installedModulesRef.current.find((module) => module.id === pluginId);
        const moduleName = targetModule?.definition.name ?? pluginId;
        if (status === "running" && !isFocusedUpdate) {
          if (shouldAnnounceToast(`running:${pluginId}`)) {
            showToast({
              message: `${moduleName} 已在新窗口打开`,
              type: "success",
              duration: 2600,
            });
          }
        } else if (status === "error") {
          if (shouldAnnounceToast(`error:${pluginId}`, 2000)) {
            showToast({
              message: `${moduleName} 启动失败: ${message ?? "未知错误"}`,
              type: "error",
              duration: 4200,
            });
          }
        }
      }
    };

    window.ipc.on("plugin:state", handler as (...args: unknown[]) => void);
    return () => {
      window.ipc.off("plugin:state", handler as (...args: unknown[]) => void);
    };
}, [mapStatusToLaunchState, patchModuleRuntime, shouldAnnounceToast, showToast]);

const openModule = useCallback(
  async (moduleId: string) => {
    const module = installedModulesRef.current.find((item) => item.id === moduleId);
    if (!module) {
      return;
    }

    if (isWindowPlugin(moduleId)) {
      patchModuleRuntime(moduleId, {
        launchState: "launching",
        lastError: null,
      });
      try {
        await window.ipc.invoke("plugin:start", moduleId);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        patchModuleRuntime(moduleId, {
          launchState: "error",
          lastError: message,
        });
        showToast({
          message: `${module.definition.name} 启动失败: ${message}`,
          type: "error",
          duration: 4200,
        });
      }
      return;
    }

    setActiveModuleId(moduleId);
  },
  [isWindowPlugin, patchModuleRuntime, setActiveModuleId, showToast],
);

const focusModuleWindow = useCallback(
  async (moduleId: string) => {
    if (!isWindowPlugin(moduleId)) {
      setActiveModuleId(moduleId);
      return;
    }

    try {
      await window.ipc.invoke("plugin:focus", moduleId);
    } catch (error) {
      const module = installedModulesRef.current.find((item) => item.id === moduleId);
      const moduleName = module?.definition.name ?? moduleId;
      const message = error instanceof Error ? error.message : String(error);
      showToast({
        message: `${moduleName} 聚焦失败: ${message}`,
        type: "error",
        duration: 3800,
      });
    }
  },
  [isWindowPlugin, setActiveModuleId, showToast],
);

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
              runtime: createRuntime(),
              isFavorite: false,
            }));
          
          setInstalledModules(defaultModules);
          
          // 持久化默认模块
          for (const module of defaultModules) {
            const info: StoredModuleInfo = {
              id: module.id,
              installedAt: new Date().toISOString(),
              lastUsedAt: new Date().toISOString(),
              version: module.definition.version,
              source: module.definition.source || 'local',
              // 初始化收藏字段为 false
              isFavorite: false,
              favoriteOrder: undefined,
              favoritedAt: undefined,
            };
            await window.moduleStore.add(info);
          }
        } else {
          // 从存储恢复
          const restoredModules: ModuleInstance[] = [];
          
          for (const stored of storedModules) {
            const definition = registryMap.get(stored.id) ?? findModuleDefinition(stored.id);
            
            if (definition) {
              const isFavorite = stored.isFavorite ?? false;
              const favoriteOrder = stored.favoriteOrder ?? undefined;
              const favoritedAt = stored.favoritedAt ?? undefined;

              restoredModules.push({
                id: stored.id,
                definition,
                runtime: createRuntime(null, false, true),
                // 携带收藏信息
                isFavorite,
                favoriteOrder,
                favoritedAt,
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
            runtime: createRuntime(),
            isFavorite: false,
          }));
        setInstalledModules(defaultModules);
      }
    };

    void restoreInstalledModules();
  }, []);

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

  const runningPluginIds = useMemo(
    () =>
      installedModules
        .filter((module) => module.runtime.launchState === "running")
        .map((module) => module.id),
    [installedModules],
  );

  const installModule = useCallback(
    async (moduleId: string, remote = false) => {
      // TODO: 实现新的插件在线安装逻辑
      // 暂时只支持本地模块安装
      if (remote) {
        throw new Error("在线安装功能正在开发中");
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
            runtime: createRuntime(null, true),
          },
        ];
      });

      // 持久化到存储
      const info: StoredModuleInfo = {
        id: moduleId,
        installedAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      version: definition.version,
      source: definition.source || 'local',
      // 初始化收藏字段
      isFavorite: false,
      favoriteOrder: undefined,
      favoritedAt: undefined,
    };
      await window.moduleStore.add(info);

      await loadModuleComponent(moduleId, definition);
      void refreshPluginRegistry();

      // 记录安装事件
      logModuleEvent({
        moduleId,
        moduleName: definition.name,
        action: 'install',
        category: definition.category || 'unknown',
      });
    },
    [loadModuleComponent, refreshPluginRegistry],
  );

  // 安装在线插件
  const installOnlinePlugin = useCallback(
    async (entry: PluginRegistryEntry) => {
      try {
        showToast({
          type: 'info',
          message: `开始安装 ${entry.name}...`,
        });

        // 监听安装进度
        const unsubscribe = window.plugin.onInstallProgress((progress: PluginInstallProgress) => {
          if (progress.stage === 'complete') {
            showToast({
              type: 'success',
              message: `${entry.name} 安装成功!`,
            });
          } else if (progress.stage === 'error') {
            showToast({
              type: 'error',
              message: `安装失败: ${progress.error || '未知错误'}`,
            });
          }
        });

        const result = await window.plugin.install(entry);

        unsubscribe();

        if (!result.success) {
          throw new Error(result.error || '安装失败');
        }

        // 刷新插件列表
        await refreshPluginRegistry();
        await refreshAvailablePlugins();

        // 记录安装事件
        logModuleEvent({
          moduleId: entry.id,
          moduleName: entry.name,
          action: 'install',
          category: entry.category || 'unknown',
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        showToast({
          type: 'error',
          message: `安装失败: ${errorMessage}`,
        });
        throw error;
      }
    },
    [refreshPluginRegistry, refreshAvailablePlugins, showToast],
  );

  const uninstallModule = useCallback(
    async (moduleId: string) => {
      // 检查是否为开发插件
      if (isDevPlugin(moduleId)) {
        showToast({
          message: '开发插件无法卸载,请在开发目录中手动删除',
          type: 'info',
          duration: 3000,
        });
        return;
      }

      const module = installedModules.find((m) => m.id === moduleId);

      if (module && isWindowPlugin(moduleId)) {
        try {
          await window.ipc.invoke("plugin:stop", moduleId);
        } catch (error) {
          console.warn(`[ModuleContext] 停止插件失败: ${moduleId}`, error);
        }
        patchModuleRuntime(moduleId, {
          launchState: "idle",
          runningWindowId: undefined,
        });
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

      // 如果是插件,调用插件卸载 IPC 删除文件
      if (isWindowPlugin(moduleId)) {
        try {
          const result = await window.ipc.invoke("plugin:uninstall", moduleId) as { success: boolean; error?: string };
          if (!result.success) {
            console.error(`[ModuleContext] 插件文件删除失败: ${result.error}`);
            showToast({
              message: `卸载失败: ${result.error}`,
              type: 'error',
              duration: 4000,
            });
            return;
          }
        } catch (error) {
          console.error(`[ModuleContext] 插件卸载失败:`, error);
          showToast({
            message: `卸载失败: ${error instanceof Error ? error.message : String(error)}`,
            type: 'error',
            duration: 4000,
          });
          return;
        }
      }

      // 从持久化存储删除
      await window.moduleStore.remove(moduleId);

      setInstalledModules((current) => current.filter((module) => module.id !== moduleId));
      setActiveModuleId((current) => (current === moduleId ? null : current));
      void refreshPluginRegistry();
      
      showToast({
        message: `${module?.definition.name || moduleId} 已卸载`,
        type: 'success',
        duration: 3000,
      });
    },
    [installedModules, isWindowPlugin, isDevPlugin, patchModuleRuntime, refreshPluginRegistry, showToast],
  );

  const getModuleById = useCallback(
    (moduleId: string) => installedModules.find((module) => module.id === moduleId),
    [installedModules],
  );

  // 收藏功能实现
  const favoriteModules = useMemo(() => {
    const favorites = installedModules
      .filter((module) => module.isFavorite === true)
      .sort((a, b) => {
        const orderA = a.favoriteOrder ?? 999;
        const orderB = b.favoriteOrder ?? 999;
        return orderA - orderB;
      });
    
    return favorites;
  }, [installedModules]);

  const addFavorite = useCallback(async (moduleId: string) => {
    const module = installedModules.find((m) => m.id === moduleId);
    if (!module) return;

    // 获取当前最大的 order 值
    const maxOrder = Math.max(
      0,
      ...installedModules
        .filter((m) => m.isFavorite)
        .map((m) => m.favoriteOrder ?? 0)
    );

    const now = new Date().toISOString();

    // 更新存储
    const stored = await window.moduleStore.get(moduleId);
    
    // 即使 stored 不存在（理论上不应该），我们也尝试更新或处理
    if (stored) {
      await window.moduleStore.update(moduleId, {
        isFavorite: true,
        favoriteOrder: maxOrder + 1,
        favoritedAt: now,
      });
    } else {
      console.warn(`[ModuleContext] Pin failed: Module ${moduleId} not found in store`);
    }

    // 无论存储是否成功，都更新本地状态以获得即时反馈
    setInstalledModules((current) =>
      current.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              isFavorite: true,
              favoriteOrder: maxOrder + 1,
              favoritedAt: now,
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
  }, [installedModules]);

  const removeFavorite = useCallback(async (moduleId: string) => {
    const module = installedModules.find((m) => m.id === moduleId);
    if (!module) return;

    // 更新存储
    const stored = await window.moduleStore.get(moduleId);
    if (stored) {
      await window.moduleStore.update(moduleId, {
        isFavorite: false,
        favoriteOrder: undefined,
        favoritedAt: undefined,
      });

      // 更新本地状态
      setInstalledModules((current) =>
        current.map((m) =>
          m.id === moduleId
            ? {
                ...m,
                isFavorite: false,
                favoriteOrder: undefined,
                favoritedAt: undefined,
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

  const updateFavoriteOrder = useCallback(async (orderedIds: string[]) => {
    // 批量更新排序
    for (let i = 0; i < orderedIds.length; i++) {
      const moduleId = orderedIds[i];
      const stored = await window.moduleStore.get(moduleId);
      if (stored) {
        await window.moduleStore.update(moduleId, {
          favoriteOrder: i,
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
            favoriteOrder: newOrder,
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
      pluginRegistry,
      availablePlugins,
      moduleStats,
      activeModuleId,
      setActiveModuleId,
      openModule,
      focusModuleWindow,
      installModule,
      installOnlinePlugin,
      uninstallModule,
      getModuleById,
      isDevPlugin,
      refreshAvailablePlugins,
      favoriteModules,
      addFavorite,
      removeFavorite,
      updateFavoriteOrder,
      runningPluginIds,
    }),
    [
      activeModuleId,
      focusModuleWindow,
      getModuleById,
      isDevPlugin,
      installModule,
      installOnlinePlugin,
      installedModules,
      availablePlugins,
      openModule,
      moduleStats,
      uninstallModule,
      refreshAvailablePlugins,
      favoriteModules,
      addFavorite,
      removeFavorite,
      updateFavoriteOrder,
      runningPluginIds,
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
