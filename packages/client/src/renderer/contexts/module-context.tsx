/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  ModuleDefinition,
  ModuleInstance,
  ModuleRuntime,
  ModuleStats,
  ModuleLaunchState,
} from '@/types/module';
import { logModuleEvent } from '@/utils/module-event-logger';
import type { StoredModuleInfo } from '@shared/types/module-store.types';
import type {
  ToolRuntime as ToolProcessRuntime,
  ToolRegistryEntry,
  ToolInstallProgress,
} from '@booltox/shared';
import { useToast } from './toast-context';
import { createLogger } from '@/lib/logger';

const logger = createLogger('ModuleContext');

interface ModuleContextValue {
  availableModules: ModuleDefinition[];
  installedModules: ModuleInstance[];
  toolRegistry: ToolProcessRuntime[]; // 已安装的工具列表(新工具系统)
  availableTools: ToolRegistryEntry[]; // 在线工具列表
  moduleStats: ModuleStats;
  activeModuleId: string | null;
  setActiveModuleId: (moduleId: string | null) => void;
  openModule: (moduleId: string) => Promise<void>;
  stopModule: (moduleId: string) => Promise<void>;
  focusModuleWindow: (moduleId: string) => Promise<void>;
  installModule: (moduleId: string, remote?: boolean) => Promise<void>;
  installOnlineTool: (entry: ToolRegistryEntry) => Promise<void>; // 安装在线工具
  uninstallModule: (moduleId: string) => Promise<void>;
  getModuleById: (moduleId: string) => ModuleInstance | undefined;
  isDevTool: (moduleId: string) => boolean; // 检查是否为开发工具
  refreshAvailableTools: () => Promise<void>; // 刷新在线工具
  addLocalBinaryTool: () => Promise<void>; // 添加本地二进制工具
  // 收藏功能
  favoriteModules: ModuleInstance[];
  addFavorite: (moduleId: string) => Promise<void>;
  removeFavorite: (moduleId: string) => Promise<void>;
  updateFavoriteOrder: (orderedIds: string[]) => Promise<void>;
  runningToolIds: string[];
}

type ToolChannelStatus = 'launching' | 'loading' | 'running' | 'stopping' | 'stopped' | 'error';

interface ToolStatePayload {
  toolId: string;
  status: ToolChannelStatus;
  windowId?: number; // 保留用于兼容（未来可能移除）
  viewId?: number; // 保留用于兼容（未来可能移除）
  message?: string;
  focused?: boolean;
  mode?: 'http-service' | 'standalone' | 'binary'; // 新架构：http-service/standalone/binary
  pid?: number;
  external?: boolean; // http-service 模式在外部浏览器运行
  exitCode?: number | null;
}

function createRuntime(installed = true): ModuleRuntime {
  return {
    component: null,
    loading: false,
    error: null,
    installed,
    launchState: 'idle',
    lastError: null,
  };
}

const ModuleContext = createContext<ModuleContextValue | null>(null);

export function ModuleProvider({ children }: { children: ReactNode }) {
  const [installedModules, setInstalledModules] = useState<ModuleInstance[]>([]);
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [availableTools, setAvailableTools] = useState<ToolRegistryEntry[]>([]);
  const { showToast } = useToast();
  const [toolRegistry, setToolRegistry] = useState<ToolProcessRuntime[]>([]);
  const installedModulesRef = useRef<ModuleInstance[]>([]);
  const toastHistoryRef = useRef<Map<string, number>>(new Map());
  const [toolUpdates, setToolUpdates] = useState<Map<string, unknown>>(new Map()); // 工具更新信息
  const hasRestoredRef = useRef(false); // 标记是否已从存储恢复（避免重复恢复覆盖新添加的工具）

  useEffect(() => {
    installedModulesRef.current = installedModules;
  }, [installedModules]);

  const refreshToolRegistry = useCallback(async () => {
    try {
      const tools = await window.ipc.invoke('tool:get-all');
      if (Array.isArray(tools)) {
        setToolRegistry(tools as ToolProcessRuntime[]);
      } else {
        setToolRegistry([]);
      }
    } catch (error) {
      console.error('[ModuleContext] 获取工具列表失败:', error);
      // 使用 window.toast 而非 showToast，因为初始化时 hook 可能尚未就绪
      window.toast?.error('工具列表加载失败，请尝试刷新');
    }
  }, []);

  useEffect(() => {
    void refreshToolRegistry();
  }, [refreshToolRegistry]);

  // 获取在线工具列表
  const refreshAvailableTools = useCallback(async () => {
    try {
      const registry = await window.gitOps.getTools();
      setAvailableTools(registry.tools || []);
    } catch (error) {
      console.error('[ModuleContext] 获取在线工具列表失败:', error);
      // 在线工具列表加载失败不阻塞主流程，仅记录日志
      // 用户仍可使用已安装的本地工具
    }
  }, []);

  useEffect(() => {
    void refreshAvailableTools();
  }, [refreshAvailableTools]);

  // 定期检查工具更新
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        // 确保 API 已就绪
        if (!window.tool?.checkUpdates) {
          logger.warn('[ModuleContext] Tool API not ready, skipping update check');
          return;
        }

        const result = await window.tool.checkUpdates();
        if (result.success && Array.isArray(result.updates)) {
          const updatesMap = new Map<string, unknown>();
          for (const update of result.updates) {
            if (!update || typeof update !== 'object' || !('toolId' in update)) {
              continue;
            }
            const toolId = (update as { toolId?: unknown }).toolId;
            if (typeof toolId !== 'string') {
              continue;
            }
            updatesMap.set(toolId, update);
          }
          setToolUpdates(updatesMap);

          if (result.updates.length > 0) {
            logger.info(`Found ${result.updates.length} tool updates`);
          }
        }
      } catch (error) {
        logger.error('[ModuleContext] Failed to check updates:', error);
      }
    };

    // 延迟检查，确保应用完全启动
    const timeout = setTimeout(() => {
      checkUpdates();
    }, 2000);

    // 每天检查一次
    const interval = setInterval(checkUpdates, 24 * 60 * 60 * 1000);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  const toolRuntimeModeMap = useMemo(() => {
    const map = new Map<string, 'http-service' | 'standalone' | 'binary'>();
    for (const tool of toolRegistry) {
      const runtimeType = tool.manifest.runtime?.type;
      if (runtimeType === 'standalone' || runtimeType === 'binary') {
        map.set(tool.id, runtimeType);
      } else {
        // 默认为 http-service（新架构）
        map.set(tool.id, 'http-service');
      }
    }
    return map;
  }, [toolRegistry]);

  // 将 toolRegistry 转换为 ModuleDefinition (动态工具定义)
  const toolDefinitions = useMemo<ModuleDefinition[]>(() => {
    return toolRegistry.map(tool => {
      const manifest = tool.manifest;
      const runtimeType = tool.manifest.runtime?.type;
      // 新架构：http-service | standalone | binary
      const runtimeMode =
        runtimeType === 'standalone' || runtimeType === 'binary' ? runtimeType : 'http-service';

      return {
        id: manifest.id,
        name: manifest.name,
        description: manifest.description || '',
        version: manifest.version,
        category: manifest.category || 'utilities',
        keywords: manifest.keywords || [],
        icon: manifest.icon || '🔌',
        installedByDefault: false,
        source: tool.isDev ? 'dev' : 'remote',
        runtimeMode,
        runtime: manifest.runtime, // 传入运行时配置，用于判断工具类型
      } as ModuleDefinition;
    });
  }, [toolRegistry]);

  const isWindowTool = useCallback(
    (moduleId: string) => toolRuntimeModeMap.has(moduleId) || moduleId.startsWith('com.booltox.'),
    [toolRuntimeModeMap]
  );

  // 检查是否为开发工具(不可卸载)
  const isDevTool = useCallback(
    (moduleId: string) => {
      const tool = toolRegistry.find(p => p.id === moduleId);
      return tool?.isDev === true;
    },
    [toolRegistry]
  );

  const mapStatusToLaunchState = useCallback((status: ToolChannelStatus): ModuleLaunchState => {
    switch (status) {
      case 'launching':
      case 'loading':
        return 'launching';
      case 'running':
        return 'running';
      case 'stopping':
        return 'stopping';
      case 'error':
        return 'error';
      case 'stopped':
      default:
        return 'idle';
    }
  }, []);

  const patchModuleRuntime = useCallback(
    (
      moduleId: string,
      patch: Partial<ModuleRuntime> | ((runtime: ModuleRuntime) => Partial<ModuleRuntime>)
    ) => {
      setInstalledModules(current =>
        current.map(module => {
          if (module.id !== moduleId) return module;
          const nextPatch = typeof patch === 'function' ? patch(module.runtime) : patch;
          return {
            ...module,
            runtime: {
              ...module.runtime,
              ...nextPatch,
            },
          };
        })
      );
    },
    [setInstalledModules]
  );

  const shouldAnnounceToast = useCallback((key: string, interval = 1500) => {
    const now = Date.now();
    const last = toastHistoryRef.current.get(key);
    if (last && now - last < interval) {
      return false;
    }
    toastHistoryRef.current.set(key, now);
    return true;
  }, []);

  useEffect(() => {
    const handler = (payload: ToolStatePayload) => {
      if (!payload?.toolId) return;
      const { toolId, status, windowId, message } = payload;
      const launchState = mapStatusToLaunchState(status);

      patchModuleRuntime(toolId, runtime => ({
        launchState,
        runningWindowId:
          status === 'running'
            ? (windowId ?? runtime.runningWindowId)
            : status === 'stopped'
              ? undefined
              : runtime.runningWindowId,
        lastLaunchedAt: status === 'running' ? Date.now() : runtime.lastLaunchedAt,
        lastError:
          status === 'error'
            ? (message ?? '工具启动失败')
            : status === 'running'
              ? null
              : runtime.lastError,
      }));

      const isFocusedUpdate = payload.focused === true;

      if ((status === 'running' && !isFocusedUpdate) || status === 'error') {
        const targetModule = installedModulesRef.current.find(module => module.id === toolId);
        const moduleName = targetModule?.definition.name ?? toolId;
        if (status === 'running' && !isFocusedUpdate) {
          if (shouldAnnounceToast(`running:${toolId}`)) {
            showToast({
              message: `${moduleName} 已在新窗口打开`,
              type: 'success',
              duration: 2600,
            });
          }
        } else if (status === 'error') {
          if (shouldAnnounceToast(`error:${toolId}`, 2000)) {
            showToast({
              message: `${moduleName} 启动失败: ${message ?? '未知错误'}`,
              type: 'error',
              duration: 4200,
            });
          }
        }
      }
    };

    window.ipc.on('tool:state', handler as (...args: unknown[]) => void);
    return () => {
      window.ipc.off('tool:state', handler as (...args: unknown[]) => void);
    };
  }, [mapStatusToLaunchState, patchModuleRuntime, shouldAnnounceToast, showToast]);

  const openModule = useCallback(
    async (moduleId: string) => {
      const module = installedModulesRef.current.find(item => item.id === moduleId);
      if (!module) {
        return;
      }

      if (isWindowTool(moduleId)) {
        patchModuleRuntime(moduleId, {
          launchState: 'launching',
          lastError: null,
          lastLaunchedAt: Date.now(), // 记录启动时间
        });
        try {
          await window.ipc.invoke('tool:start', moduleId);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          patchModuleRuntime(moduleId, {
            launchState: 'error',
            lastError: message,
          });
          showToast({
            message: `${module.definition.name} 启动失败: ${message}`,
            type: 'error',
            duration: 4200,
          });
        }
        return;
      }

      setActiveModuleId(moduleId);
    },
    [isWindowTool, patchModuleRuntime, setActiveModuleId, showToast]
  );

  const stopModule = useCallback(
    async (moduleId: string) => {
      const module = installedModulesRef.current.find(item => item.id === moduleId);
      if (!module) {
        return;
      }

      if (isWindowTool(moduleId)) {
        patchModuleRuntime(moduleId, {
          launchState: 'stopping',
          lastError: null,
        });
        try {
          await window.ipc.invoke('tool:stop', moduleId);
          showToast({
            message: `${module.definition.name} 已停止`,
            type: 'success',
            duration: 2000,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          patchModuleRuntime(moduleId, {
            launchState: 'error',
            lastError: message,
          });
          showToast({
            message: `${module.definition.name} 停止失败: ${message}`,
            type: 'error',
            duration: 4200,
          });
        }
        return;
      }
    },
    [isWindowTool, patchModuleRuntime, showToast]
  );

  const focusModuleWindow = useCallback(
    async (moduleId: string) => {
      if (!isWindowTool(moduleId)) {
        setActiveModuleId(moduleId);
        return;
      }

      try {
        await window.ipc.invoke('tool:focus', moduleId);
      } catch (error) {
        const module = installedModulesRef.current.find(item => item.id === moduleId);
        const moduleName = module?.definition.name ?? moduleId;
        const message = error instanceof Error ? error.message : String(error);
        showToast({
          message: `${moduleName} 聚焦失败: ${message}`,
          type: 'error',
          duration: 3800,
        });
      }
    },
    [isWindowTool, setActiveModuleId, showToast]
  );

  // 从持久化存储恢复已安装工具（包含收藏信息等元数据）
  // 注意：此 effect 只在首次加载时执行，避免与 syncTools 竞态导致新添加的工具丢失
  useEffect(() => {
    // 已经恢复过，跳过（后续同步由 syncTools 处理）
    if (hasRestoredRef.current) {
      return;
    }

    // 等待 toolDefinitions 加载完成
    if (toolDefinitions.length === 0) {
      return;
    }

    const restoreInstalledModules = async () => {
      try {
        const storedModules = await window.moduleStore.getAll();

        // 标记已恢复（即使 storedModules 为空）
        hasRestoredRef.current = true;

        if (storedModules.length === 0) {
          // 不清空，让 syncTools 处理新工具
          return;
        }

        const restoredModules: ModuleInstance[] = [];
        const orphanedIds: string[] = [];

        for (const stored of storedModules) {
          const definition = toolDefinitions.find(definition => definition.id === stored.id);

          if (!definition) {
            console.warn(`[ModuleContext] 无法找到工具定义: ${stored.id}，将从存储中清理`);
            orphanedIds.push(stored.id);
            continue;
          }

          restoredModules.push({
            id: stored.id,
            definition,
            runtime: {
              ...createRuntime(true),
              updateAvailable: toolUpdates.has(stored.id), // 添加更新信息
            },
            isFavorite: stored.isFavorite ?? false,
            favoriteOrder: stored.favoriteOrder ?? undefined,
            favoritedAt: stored.favoritedAt ?? undefined,
          });
        }

        // 清理孤立的工具记录
        for (const id of orphanedIds) {
          await window.moduleStore.remove(id);
          logger.info(`[ModuleContext] 已清理孤立工具记录: ${id}`);
        }

        // 使用 updater 函数合并，避免覆盖 syncTools 可能已添加的工具
        setInstalledModules(current => {
          const currentIds = new Set(current.map(m => m.id));
          // 只添加当前列表中没有的工具
          const toAdd = restoredModules.filter(m => !currentIds.has(m.id));
          if (toAdd.length > 0) {
            logger.info(`[ModuleContext] 从存储恢复 ${toAdd.length} 个工具`);
            return [...current, ...toAdd];
          }
          return current;
        });
      } catch (error) {
        console.error('[ModuleContext] 恢复工具失败:', error);
        hasRestoredRef.current = true; // 即使失败也标记，避免反复重试
        // 告知用户恢复失败
        window.toast?.error('工具列表恢复失败，部分工具可能无法显示');
      }
    };

    void restoreInstalledModules();
  }, [toolDefinitions, toolUpdates]); // 添加 toolUpdates 依赖

  // 同步 toolRegistry 到 installedModules
  useEffect(() => {
    if (toolRegistry.length === 0) return;

    const syncTools = async () => {
      try {
        // 获取存储中的所有模块
        const storedModules = await window.moduleStore.getAll();
        const storedIds = new Set(storedModules.map(m => m.id));

        // 先计算需要更新的模块和需要存储的信息（纯计算，无副作用）
        const toStore: StoredModuleInfo[] = [];

        setInstalledModules(current => {
          const currentIds = new Set(current.map(m => m.id));
          const updates = [...current];

          // 遍历所有工具
          for (const tool of toolRegistry) {
            const toolId = tool.manifest.id;
            if (!toolId) continue; // 跳过没有 ID 的工具

            const toolDef = toolDefinitions.find(d => d.id === toolId);

            if (!toolDef) continue;

            // 如果已在存储中但未在当前列表,添加它
            if (storedIds.has(toolId) && !currentIds.has(toolId)) {
              const stored = storedModules.find(m => m.id === toolId);
              if (stored) {
                logger.info(`[ModuleContext] 从存储恢复工具: ${toolId}`);
                updates.push({
                  id: toolId,
                  definition: toolDef,
                  runtime: createRuntime(true),
                  isFavorite: stored.isFavorite ?? false,
                  favoriteOrder: stored.favoriteOrder ?? undefined,
                  favoritedAt: stored.favoritedAt ?? undefined,
                });
              }
            } else if (currentIds.has(toolId)) {
              // 如果已存在,更新其定义(确保 source 正确)
              const index = updates.findIndex(m => m.id === toolId);
              if (index !== -1) {
                updates[index] = {
                  ...updates[index],
                  definition: toolDef,
                };
              }
            } else if (!currentIds.has(toolId)) {
              // 所有不在当前列表的工具都需要添加(开发工具或新安装的远程工具)
              const source = tool.isDev ? 'dev' : 'remote';
              logger.info(
                `[ModuleContext] 自动添加${source === 'dev' ? '开发' : ''}工具: ${toolId}`
              );

              updates.push({
                id: toolId,
                definition: toolDef,
                runtime: createRuntime(true),
                isFavorite: false,
                favoriteOrder: undefined,
                favoritedAt: undefined,
              });

              // 记录需要持久化的工具（不在此处执行异步操作）
              if (!storedIds.has(toolId)) {
                toStore.push({
                  id: toolId,
                  installedAt: new Date().toISOString(),
                  lastUsedAt: new Date().toISOString(),
                  version: toolDef.version || '1.0.0',
                  source: source || 'remote',
                  isFavorite: false,
                  favoriteOrder: undefined,
                  favoritedAt: undefined,
                });
              }
            }
          }

          return updates;
        });

        // 异步存储新工具（在 setState 之后执行，避免在 updater 中产生副作用）
        // 去重：React concurrent mode 下 updater 可能被调用多次
        const uniqueToStore = Array.from(new Map(toStore.map(info => [info.id, info])).values());
        if (uniqueToStore.length > 0) {
          for (const info of uniqueToStore) {
            try {
              await window.moduleStore.add(info);
              logger.info(`[ModuleContext] 工具已存储: ${info.id}`);
            } catch (error) {
              console.error(`[ModuleContext] 存储工具失败 ${info.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('[ModuleContext] 同步工具失败:', error);
      }
    };

    void syncTools();
  }, [toolRegistry, toolDefinitions]);

  const moduleStats = useMemo<ModuleStats>(() => {
    const stats = installedModules.reduce<ModuleStats>(
      (acc, module) => {
        acc.total += 1;
        if (module.runtime.launchState === 'running') {
          acc.enabled += 1;
        }
        if (module.definition.source === 'remote') {
          acc.remote += 1;
        } else {
          acc.local += 1;
        }
        return acc;
      },
      { total: 0, enabled: 0, disabled: 0, local: 0, remote: 0 }
    );
    stats.disabled = Math.max(stats.total - stats.enabled, 0);
    return stats;
  }, [installedModules]);

  const runningToolIds = useMemo(
    () =>
      installedModules
        .filter(module => module.runtime.launchState === 'running')
        .map(module => module.id),
    [installedModules]
  );

  const installModule = useCallback(
    async (moduleId: string) => {
      const tool = toolRegistry.find(item => item.id === moduleId);
      const definition = toolDefinitions.find(item => item.id === moduleId);

      if (!tool || !definition) {
        throw new Error(`未找到工具 ${moduleId}，请先在工具商店安装`);
      }

      setInstalledModules(current => {
        if (current.some(module => module.id === moduleId)) {
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
        version: definition.version || '1.0.0',
        source: tool.isDev ? 'dev' : 'remote',
        isFavorite: false,
        favoriteOrder: undefined,
        favoritedAt: undefined,
      };

      await window.moduleStore.add(info);

      logModuleEvent({
        moduleId,
        moduleName: definition.name,
        action: 'install',
        category: definition.category || 'unknown',
      });
    },
    [toolDefinitions, toolRegistry]
  );

  // 安装在线工具
  const installOnlineTool = useCallback(
    async (entry: ToolRegistryEntry) => {
      try {
        showToast({
          type: 'info',
          message: `开始安装 ${entry.name}...`,
        });

        // 监听安装进度
        const unsubscribe = window.tool.onInstallProgress((progress: ToolInstallProgress) => {
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

        const result = await window.tool.install(entry);

        unsubscribe();

        if (!result.success) {
          throw new Error(result.error || '安装失败');
        }

        // 刷新工具列表
        await refreshToolRegistry();
        await refreshAvailableTools();

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
    [refreshToolRegistry, refreshAvailableTools, showToast]
  );

  const uninstallModule = useCallback(
    async (moduleId: string) => {
      // 检查是否为开发工具
      if (isDevTool(moduleId)) {
        showToast({
          message: '开发工具无法卸载,请在开发目录中手动删除',
          type: 'info',
          duration: 3000,
        });
        return;
      }

      const module = installedModules.find(m => m.id === moduleId);

      if (module && isWindowTool(moduleId)) {
        try {
          await window.ipc.invoke('tool:stop', moduleId);
        } catch (error) {
          console.warn(`[ModuleContext] 停止工具失败: ${moduleId}`, error);
        }
        patchModuleRuntime(moduleId, {
          launchState: 'idle',
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

      // 如果是工具,调用工具卸载 IPC 删除文件
      if (isWindowTool(moduleId)) {
        try {
          const result = (await window.ipc.invoke('tool:uninstall', moduleId)) as {
            success: boolean;
            error?: string;
          };
          if (!result.success) {
            console.error(`[ModuleContext] 工具文件删除失败: ${result.error}`);
            showToast({
              message: `卸载失败: ${result.error}`,
              type: 'error',
              duration: 4000,
            });
            return;
          }
        } catch (error) {
          console.error(`[ModuleContext] 工具卸载失败:`, error);
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

      setInstalledModules(current => current.filter(module => module.id !== moduleId));
      setActiveModuleId(current => (current === moduleId ? null : current));
      void refreshToolRegistry();

      showToast({
        message: `${module?.definition.name || moduleId} 已卸载`,
        type: 'success',
        duration: 3000,
      });
    },
    [installedModules, isWindowTool, isDevTool, patchModuleRuntime, refreshToolRegistry, showToast]
  );

  const getModuleById = useCallback(
    (moduleId: string) => installedModules.find(module => module.id === moduleId),
    [installedModules]
  );

  // 收藏功能实现
  const favoriteModules = useMemo(() => {
    const favorites = installedModules
      .filter(module => module.isFavorite === true)
      .sort((a, b) => {
        const orderA = a.favoriteOrder ?? 999;
        const orderB = b.favoriteOrder ?? 999;
        return orderA - orderB;
      });

    return favorites;
  }, [installedModules]);

  const addFavorite = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find(m => m.id === moduleId);
      if (!module) return;

      // 获取当前最大的 order 值
      const maxOrder = Math.max(
        0,
        ...installedModules.filter(m => m.isFavorite).map(m => m.favoriteOrder ?? 0)
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
      setInstalledModules(current =>
        current.map(m =>
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
    },
    [installedModules]
  );

  const removeFavorite = useCallback(
    async (moduleId: string) => {
      const module = installedModules.find(m => m.id === moduleId);
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
        setInstalledModules(current =>
          current.map(m =>
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
    },
    [installedModules]
  );

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
    setInstalledModules(current =>
      current.map(m => {
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

  // 添加本地二进制工具
  const addLocalBinaryTool = useCallback(async () => {
    try {
      // 1. 打开文件选择对话框
      const filePath = (await window.ipc.invoke('dialog:openFile', {
        filters: [
          {
            name: '可执行文件',
            extensions: ['exe', 'app', 'sh', 'bin', ''], // 支持所有平台
          },
        ],
        properties: ['openFile'],
      })) as string | null;

      if (!filePath) {
        return;
      }

      const fileName =
        filePath
          .split(/[\\/]/)
          .pop()
          ?.replace(/\.[^.]*$/, '') || '未命名工具';

      // 2. 调用 IPC 添加工具
      const response = (await window.ipc.invoke('tool:add-local-binary-tool', {
        name: fileName,
        exePath: filePath,
        description: '从本地添加的工具',
      })) as { success: boolean; id?: string; path?: string; error?: string };

      if (response.success && response.id) {
        // 3. 刷新工具列表
        await refreshToolRegistry();

        // 4. 写入 moduleStore（让工具出现在已安装列表）
        await window.moduleStore.add({
          id: response.id,
          installedAt: new Date().toISOString(),
          lastUsedAt: new Date().toISOString(),
          source: 'local',
        });

        showToast({
          message: `已添加工具：${fileName}`,
          type: 'success',
          duration: 3000,
        });

        logger.info(`[ModuleContext] Local binary tool added: ${response.id}`);
      } else {
        throw new Error(response.error || '添加失败');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast({
        message: `添加本地工具失败: ${message}`,
        type: 'error',
        duration: 4000,
      });
      logger.error('[ModuleContext] Failed to add local binary tool:', error);
    }
  }, [refreshToolRegistry, showToast]);

  const contextValue = useMemo<ModuleContextValue>(
    () => ({
      availableModules: toolDefinitions,
      installedModules,
      toolRegistry,
      availableTools,
      moduleStats,
      activeModuleId,
      setActiveModuleId,
      openModule,
      stopModule,
      focusModuleWindow,
      installModule,
      installOnlineTool,
      uninstallModule,
      getModuleById,
      isDevTool,
      refreshAvailableTools,
      addLocalBinaryTool,
      favoriteModules,
      addFavorite,
      removeFavorite,
      updateFavoriteOrder,
      runningToolIds,
    }),
    [
      activeModuleId,
      toolDefinitions,
      focusModuleWindow,
      getModuleById,
      isDevTool,
      installModule,
      installOnlineTool,
      installedModules,
      toolRegistry,
      availableTools,
      openModule,
      stopModule,
      moduleStats,
      uninstallModule,
      refreshAvailableTools,
      addLocalBinaryTool,
      favoriteModules,
      addFavorite,
      removeFavorite,
      updateFavoriteOrder,
      runningToolIds,
    ]
  );

  return <ModuleContext.Provider value={contextValue}>{children}</ModuleContext.Provider>;
}

export function useModulePlatform() {
  const context = useContext(ModuleContext);
  if (!context) {
    throw new Error('useModulePlatform 必须在 ModuleProvider 内使用');
  }
  return context;
}
