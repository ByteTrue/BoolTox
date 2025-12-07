/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type {
  ModuleDefinition,
  ModuleInstance,
  ModuleRuntime,
  ModuleStats,
  ModuleLaunchState,
} from "@/types/module";
import { logModuleEvent } from "@/utils/module-event-logger";
import type { StoredModuleInfo } from "@shared/types/module-store.types";
import type { PluginRuntime as PluginProcessRuntime, PluginRegistryEntry, PluginInstallProgress } from "@booltox/shared";
import { useToast } from "./toast-context";
import { createLogger } from "@/lib/logger";

const logger = createLogger("ModuleContext");

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
  mode?: 'webview' | 'standalone';
  pid?: number;
  external?: boolean;
  exitCode?: number | null;
}

function createRuntime(installed = true): ModuleRuntime {
  return {
    component: null,
    loading: false,
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

  const pluginRuntimeModeMap = useMemo(() => {
    const map = new Map<string, 'webview' | 'standalone'>();
    for (const plugin of pluginRegistry) {
      map.set(plugin.id, plugin.manifest.runtime?.type === 'standalone' ? 'standalone' : 'webview');
    }
    return map;
  }, [pluginRegistry]);

  // 将 pluginRegistry 转换为 ModuleDefinition (动态插件定义)
  const pluginDefinitions = useMemo<ModuleDefinition[]>(() => {
    return pluginRegistry.map((plugin) => {
      const manifest = plugin.manifest;
      const runtimeMode = plugin.manifest.runtime?.type === 'standalone' ? 'standalone' : 'webview';
      return {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description || '',
        version: manifest.version,
        category: manifest.category || 'utilities',
        keywords: manifest.keywords || [],
        icon: manifest.icon || '🔌',
        installedByDefault: false,
        source: plugin.isDev ? 'dev' : 'remote',
        runtimeMode,
      } as ModuleDefinition;
    });
  }, [pluginRegistry]);

  const isWindowPlugin = useCallback(
    (moduleId: string) => pluginRuntimeModeMap.has(moduleId) || moduleId.startsWith("com.booltox."),
    [pluginRuntimeModeMap],
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

  // 从持久化存储恢复已安装插件（包含收藏信息等元数据）
  useEffect(() => {
    if (pluginDefinitions.length === 0) {
      setInstalledModules([]);
      return;
    }

    const restoreInstalledModules = async () => {
      try {
        const storedModules = await window.moduleStore.getAll();
        if (storedModules.length === 0) {
          setInstalledModules([]);
          return;
        }

        const restoredModules: ModuleInstance[] = [];
        const orphanedIds: string[] = [];

        for (const stored of storedModules) {
          const definition = pluginDefinitions.find((definition) => definition.id === stored.id);

          if (!definition) {
            console.warn(`[ModuleContext] 无法找到插件定义: ${stored.id}，将从存储中清理`);
            orphanedIds.push(stored.id);
            continue;
          }

          restoredModules.push({
            id: stored.id,
            definition,
            runtime: createRuntime(true),
            isFavorite: stored.isFavorite ?? false,
            favoriteOrder: stored.favoriteOrder ?? undefined,
            favoritedAt: stored.favoritedAt ?? undefined,
          });
        }

        // 清理孤立的插件记录
        for (const id of orphanedIds) {
          await window.moduleStore.remove(id);
          logger.info(`[ModuleContext] 已清理孤立插件记录: ${id}`);
        }

        setInstalledModules(restoredModules);
      } catch (error) {
        console.error("[ModuleContext] 恢复插件失败:", error);
        setInstalledModules([]);
      }
    };

    void restoreInstalledModules();
  }, [pluginDefinitions]);

  // 同步 pluginRegistry 到 installedModules
  useEffect(() => {
    if (pluginRegistry.length === 0) return;

    const syncPlugins = async () => {
      try {
        // 获取存储中的所有模块
        const storedModules = await window.moduleStore.getAll();
        const storedIds = new Set(storedModules.map(m => m.id));

        setInstalledModules((current) => {
          const currentIds = new Set(current.map(m => m.id));
          const updates = [...current];
          const toStore: StoredModuleInfo[] = [];

          // 遍历所有插件
          for (const plugin of pluginRegistry) {
            const pluginId = plugin.manifest.id;
            const pluginDef = pluginDefinitions.find(d => d.id === pluginId);
            
            if (!pluginDef) continue;

            // 如果已在存储中但未在当前列表,添加它
            if (storedIds.has(pluginId) && !currentIds.has(pluginId)) {
              const stored = storedModules.find(m => m.id === pluginId);
              if (stored) {
                logger.info(`[ModuleContext] 从存储恢复插件: ${pluginId}`);
                updates.push({
                  id: pluginId,
                  definition: pluginDef,
                  runtime: createRuntime(true),
                  isFavorite: stored.isFavorite ?? false,
                  favoriteOrder: stored.favoriteOrder,
                  favoritedAt: stored.favoritedAt,
                });
              }
            } else if (currentIds.has(pluginId)) {
              // 如果已存在,更新其定义(确保 source 正确)
              const index = updates.findIndex(m => m.id === pluginId);
              if (index !== -1) {
                updates[index] = {
                  ...updates[index],
                  definition: pluginDef,
                };
              }
            } else if (!currentIds.has(pluginId)) {
              // 所有不在当前列表的插件都需要添加(开发插件或新安装的远程插件)
              const source = plugin.isDev ? 'dev' : 'remote';
              logger.info(`[ModuleContext] 自动添加${source === 'dev' ? '开发' : ''}插件: ${pluginId}`);
              
              updates.push({
                id: pluginId,
                definition: pluginDef,
                runtime: createRuntime(true),
                isFavorite: false,
              });
              
              // 持久化到存储
              if (!storedIds.has(pluginId)) {
                toStore.push({
                  id: pluginId,
                  installedAt: new Date().toISOString(),
                  lastUsedAt: new Date().toISOString(),
                  version: pluginDef.version,
                  source,
                  isFavorite: false,
                  favoriteOrder: undefined,
                  favoritedAt: undefined,
                });
              }
            }
          }

          // 异步存储新插件
          if (toStore.length > 0) {
            void (async () => {
              for (const info of toStore) {
                try {
                  await window.moduleStore.add(info);
                  logger.info(`[ModuleContext] 插件已存储: ${info.id}`);
                } catch (error) {
                  console.error(`[ModuleContext] 存储插件失败 ${info.id}:`, error);
                }
              }
            })();
          }

          return updates;
        });
      } catch (error) {
        console.error('[ModuleContext] 同步插件失败:', error);
      }
    };

    void syncPlugins();
  }, [pluginRegistry, pluginDefinitions]);


  const moduleStats = useMemo<ModuleStats>(() => {
    const stats = installedModules.reduce<ModuleStats>(
      (acc, module) => {
        acc.total += 1;
        if (module.runtime.launchState === "running") {
          acc.enabled += 1;
        }
        if (module.definition.source === "remote") {
          acc.remote += 1;
        } else {
          acc.local += 1;
        }
        return acc;
      },
      { total: 0, enabled: 0, disabled: 0, local: 0, remote: 0 },
    );
    stats.disabled = Math.max(stats.total - stats.enabled, 0);
    return stats;
  }, [installedModules]);

  const runningPluginIds = useMemo(
    () =>
      installedModules
        .filter((module) => module.runtime.launchState === "running")
        .map((module) => module.id),
    [installedModules],
  );

  const installModule = useCallback(
    async (moduleId: string) => {
      const plugin = pluginRegistry.find((item) => item.id === moduleId);
      const definition = pluginDefinitions.find((item) => item.id === moduleId);

      if (!plugin || !definition) {
        throw new Error(`未找到插件 ${moduleId}，请先在插件商店安装`);
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
            runtime: createRuntime(true),
          },
        ];
      });

      const info: StoredModuleInfo = {
        id: moduleId,
        installedAt: new Date().toISOString(),
        lastUsedAt: new Date().toISOString(),
        version: definition.version,
        source: plugin.isDev ? "dev" : "remote",
        isFavorite: false,
        favoriteOrder: undefined,
        favoritedAt: undefined,
      };

      await window.moduleStore.add(info);

      logModuleEvent({
        moduleId,
        moduleName: definition.name,
        action: "install",
        category: definition.category || "unknown",
      });
    },
    [pluginDefinitions, pluginRegistry],
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
      availableModules: pluginDefinitions,
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
      pluginDefinitions,
      focusModuleWindow,
      getModuleById,
      isDevPlugin,
      installModule,
      installOnlinePlugin,
      installedModules,
      pluginRegistry,
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
