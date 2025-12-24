/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  useRef,
} from 'react';

// ==================== 常量定义 ====================
/** BroadcastChannel 状态同步重试间隔（毫秒） */
const STATE_SYNC_RETRY_DELAY_MS = 200;
/** BroadcastChannel 状态同步最大重试次数 */
const STATE_SYNC_MAX_RETRIES = 20;
/** 窗口关闭清理延迟（毫秒），用于避免跨窗口同步竞态 */
const WINDOW_CLOSING_CLEANUP_DELAY_MS = 800;

/**
 * 工具标签页数据结构
 */
export interface ToolTab {
  id: string; // 唯一标识（UUID）
  toolId: string; // 工具 ID
  label: string; // 标签标题
  url: string; // webview URL
  canGoBack: boolean; // 是否可后退
  canGoForward: boolean; // 是否可前进
  isLoading: boolean; // 是否加载中
  windowId: string; // 所属窗口 ID（'main' 或 detached window UUID）
}

/**
 * 工具标签页 Context 值
 */
interface ToolTabContextValue {
  toolTabs: ToolTab[];
  activeToolTabId: string | null;
  getActiveToolTabId: (windowId: string) => string | null;
  exportState: () => { toolTabs: ToolTab[]; activeToolTabIds: Record<string, string | null> };

  // 创建工具标签（返回标签 ID）
  createToolTab: (toolId: string, label: string, url: string, windowId?: string) => string;

  // 关闭工具标签
  closeToolTab: (tabId: string) => void;

  // 激活工具标签
  activateToolTab: (tabId: string | null, windowId?: string) => void;

  // 更新标签状态
  updateToolTab: (tabId: string, updates: Partial<Omit<ToolTab, 'id' | 'toolId'>>) => void;

  // 重新排序标签
  reorderToolTabs: (tabIds: string[]) => void;

  // 检查工具是否已有标签
  hasToolTab: (toolId: string) => boolean;

  // 根据工具 ID 获取标签
  getToolTabByToolId: (toolId: string) => ToolTab | undefined;
}

const ToolTabContext = createContext<ToolTabContextValue | null>(null);

function getRendererWindowId(): string {
  const hash = window.location.hash;
  const detachedHashPrefix = '#/detached/';
  if (hash.startsWith(detachedHashPrefix)) {
    const rest = hash.slice(detachedHashPrefix.length);
    const windowId = rest.split(/[/?#]/)[0];
    if (windowId) return windowId;
  }

  const detachedPathPrefix = '/detached/';
  const path = window.location.pathname;
  const index = path.indexOf(detachedPathPrefix);
  if (index >= 0) {
    const rest = path.slice(index + detachedPathPrefix.length);
    const windowId = rest.split(/[/?#]/)[0];
    if (windowId) return windowId;
  }

  return 'main';
}

/**
 * 工具标签页 Provider
 */
export function ToolTabProvider({ children }: { children: ReactNode }) {
  const rendererWindowIdRef = useRef<string>(getRendererWindowId());
  const isMainRenderer = rendererWindowIdRef.current === 'main';

  const [toolTabs, setToolTabs] = useState<ToolTab[]>([]);
  const [activeToolTabIds, setActiveToolTabIds] = useState<Record<string, string | null>>({
    main: null,
  });
  const activeToolTabId = activeToolTabIds.main ?? null;
  const getActiveToolTabId = useCallback(
    (windowId: string) => {
      return activeToolTabIds[windowId] ?? null;
    },
    [activeToolTabIds]
  );
  const syncChannelRef = useRef<BroadcastChannel | null>(null);
  const isApplyingRemoteStateRef = useRef(false);
  const toolTabsRef = useRef<ToolTab[]>(toolTabs);
  const activeToolTabIdsRef = useRef<Record<string, string | null>>(activeToolTabIds);
  const hasReceivedStateSyncRef = useRef(false);
  const closingWindowIdsRef = useRef<Set<string>>(new Set());
  const closingWindowCleanupTimersRef = useRef<Map<string, number>>(new Map());

  const requestCloseDetachedWindow = useCallback((windowId: string) => {
    if (windowId === 'main') return;
    if (closingWindowIdsRef.current.has(windowId)) return;
    closingWindowIdsRef.current.add(windowId);

    window.ipc
      .invoke('window:close-detached', { windowId, reason: 'empty' })
      .catch((err: Error) => {
        closingWindowIdsRef.current.delete(windowId);
        console.warn('[ToolTabContext] 关闭窗口失败:', err);
      });
  }, []);

  const setToolTabsWithRef = useCallback(
    (updater: ToolTab[] | ((prev: ToolTab[]) => ToolTab[])) => {
      setToolTabs(prev => {
        const next =
          typeof updater === 'function'
            ? (updater as (value: ToolTab[]) => ToolTab[])(prev)
            : updater;
        toolTabsRef.current = next;
        return next;
      });
    },
    []
  );

  const setActiveToolTabIdsWithRef = useCallback(
    (
      updater:
        | Record<string, string | null>
        | ((prev: Record<string, string | null>) => Record<string, string | null>)
    ) => {
      setActiveToolTabIds(prev => {
        const next =
          typeof updater === 'function'
            ? (updater as (value: Record<string, string | null>) => Record<string, string | null>)(
                prev
              )
            : updater;
        activeToolTabIdsRef.current = next;
        return next;
      });
    },
    []
  );

  /**
   * 跨窗口同步标签状态
   */
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;

    const channel = new BroadcastChannel('booltox-tool-tabs');
    syncChannelRef.current = channel;
    hasReceivedStateSyncRef.current = false;

    const requestState = () => {
      channel.postMessage({ type: 'request-state' });
    };

    // 运行时类型验证，防止恶意或损坏的消息
    const isValidStateSync = (
      data: unknown
    ): data is {
      type: 'state-sync';
      toolTabs: ToolTab[];
      activeToolTabIds: Record<string, string | null>;
    } => {
      if (!data || typeof data !== 'object') return false;
      const obj = data as Record<string, unknown>;
      return (
        obj.type === 'state-sync' &&
        Array.isArray(obj.toolTabs) &&
        typeof obj.activeToolTabIds === 'object' &&
        obj.activeToolTabIds !== null
      );
    };

    const handleMessage = (event: MessageEvent) => {
      const data = event.data as unknown;

      // 验证 state-sync 消息
      if (isValidStateSync(data)) {
        const windowId = rendererWindowIdRef.current;
        const myTabs = data.toolTabs.filter(t => t.windowId === windowId);

        // 分离窗口：如果收到的状态不包含本窗口的标签，跳过应用（等待 bootState）
        if (windowId !== 'main' && myTabs.length === 0) {
          return;
        }

        hasReceivedStateSyncRef.current = true;
        isApplyingRemoteStateRef.current = true;
        setToolTabsWithRef(data.toolTabs);
        setActiveToolTabIdsWithRef(data.activeToolTabIds);
        return;
      }

      // 验证 request-state 消息
      if (
        data &&
        typeof data === 'object' &&
        (data as Record<string, unknown>).type === 'request-state'
      ) {
        channel.postMessage({
          type: 'state-sync',
          toolTabs: toolTabsRef.current,
          activeToolTabIds: activeToolTabIdsRef.current,
        });
      }
    };

    channel.addEventListener('message', handleMessage);
    requestState();

    let cancelled = false;

    // 分离窗口启动时，重试请求状态，避免竞态导致拿到旧状态从而被误判为空窗口
    if (rendererWindowIdRef.current !== 'main') {
      let attempts = 0;

      const retry = () => {
        if (cancelled) return;
        if (hasReceivedStateSyncRef.current) return;
        if (attempts >= STATE_SYNC_MAX_RETRIES) {
          console.warn('[ToolTabContext] state-sync 超时，分离窗口仍未收到同步数据', {
            rendererWindowId: rendererWindowIdRef.current,
            maxAttempts: STATE_SYNC_MAX_RETRIES,
            retryDelayMs: STATE_SYNC_RETRY_DELAY_MS,
          });
          return;
        }
        attempts += 1;
        requestState();
        window.setTimeout(retry, STATE_SYNC_RETRY_DELAY_MS);
      };

      window.setTimeout(retry, STATE_SYNC_RETRY_DELAY_MS);
    }

    return () => {
      cancelled = true;
      channel.removeEventListener('message', handleMessage);
      channel.close();
      syncChannelRef.current = null;
    };
  }, [setActiveToolTabIdsWithRef, setToolTabsWithRef]);

  /**
   * 新建分离窗口的启动状态（由主进程定向下发，避免新窗口短暂空白导致误判"空窗口"）
   */
  useEffect(() => {
    const handler = (...args: unknown[]) => {
      const payload = args[0] as unknown;

      if (!payload || typeof payload !== 'object') return;

      const state = payload as { toolTabs?: unknown; activeToolTabIds?: unknown };
      if (
        !Array.isArray(state.toolTabs) ||
        !state.activeToolTabIds ||
        typeof state.activeToolTabIds !== 'object'
      ) {
        return;
      }

      // 标记已接收到初始状态，防止 BroadcastChannel 覆盖
      hasReceivedStateSyncRef.current = true;
      isApplyingRemoteStateRef.current = true;
      setToolTabsWithRef(state.toolTabs as ToolTab[]);
      setActiveToolTabIdsWithRef(state.activeToolTabIds as Record<string, string | null>);
    };

    window.ipc.on('window:boot-state', handler);
    return () => window.ipc.off('window:boot-state', handler);
  }, [setActiveToolTabIdsWithRef, setToolTabsWithRef]);

  /**
   * 分离窗口：发送握手信号并拉取 bootState
   */
  useEffect(() => {
    const windowId = rendererWindowIdRef.current;
    if (windowId === 'main') return;

    // 发送握手信号，通知主进程渲染进程已准备就绪
    window.ipc
      .invoke('window:renderer-ready', windowId)
      .then((result: unknown) => {
        const res = result as { success?: boolean; hasBootState?: boolean } | null;
        if (res?.hasBootState) {
          // 主进程会通过 window:boot-state 事件发送状态
          // 这里不需要额外处理
          return;
        }

        // 如果主进程没有 bootState，尝试从备份通道拉取
        if (hasReceivedStateSyncRef.current) return;

        return window.ipc.invoke('window:get-detached-boot-state', windowId);
      })
      .then((payload: unknown) => {
        if (!payload || typeof payload !== 'object') return;
        if (hasReceivedStateSyncRef.current) return;

        const state = payload as { toolTabs?: unknown; activeToolTabIds?: unknown };
        if (
          !Array.isArray(state.toolTabs) ||
          !state.activeToolTabIds ||
          typeof state.activeToolTabIds !== 'object'
        ) {
          return;
        }

        isApplyingRemoteStateRef.current = true;
        hasReceivedStateSyncRef.current = true;
        setToolTabsWithRef(state.toolTabs as ToolTab[]);
        setActiveToolTabIdsWithRef(state.activeToolTabIds as Record<string, string | null>);
      })
      .catch((err: Error) => {
        console.warn('[ToolTabContext] 握手或获取 bootState 失败:', err);
      });
  }, [setActiveToolTabIdsWithRef, setToolTabsWithRef]);

  /**
   * 广播本地状态变更（避免远端状态重复广播）
   */
  useEffect(() => {
    if (isApplyingRemoteStateRef.current) {
      isApplyingRemoteStateRef.current = false;
      return;
    }

    const channel = syncChannelRef.current;
    if (!channel) return;

    channel.postMessage({
      type: 'state-sync',
      toolTabs,
      activeToolTabIds,
    });
  }, [toolTabs, activeToolTabIds]);

  const exportState = useCallback(() => {
    return {
      toolTabs: toolTabsRef.current,
      activeToolTabIds: activeToolTabIdsRef.current,
    };
  }, []);

  /**
   * 创建工具标签
   */
  const createToolTab = useCallback(
    (
      toolId: string,
      label: string,
      url: string,
      windowId = rendererWindowIdRef.current
    ): string => {
      let tabId = '';

      setToolTabsWithRef(prev => {
        // 使用 setToolTabs 回调函数来获取最新的 toolTabs 值，避免闭包陷阱
        const existingTab = prev.find(tab => tab.toolId === toolId && tab.windowId === windowId);
        if (existingTab) {
          // 已存在，激活该标签
          tabId = existingTab.id;
          setActiveToolTabIdsWithRef(activePrev =>
            (activePrev[windowId] ?? null) === existingTab.id
              ? activePrev
              : { ...activePrev, [windowId]: existingTab.id }
          );
          return prev; // 不修改标签列表
        }

        // 生成唯一 ID
        tabId = `tool-tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const newTab: ToolTab = {
          id: tabId,
          toolId,
          label,
          url,
          canGoBack: false,
          canGoForward: false,
          isLoading: true,
          windowId, // 新增：设置窗口 ID
        };

        setActiveToolTabIdsWithRef(activePrev => ({ ...activePrev, [windowId]: tabId }));

        return [...prev, newTab];
      });

      return tabId;
    },
    [setActiveToolTabIdsWithRef, setToolTabsWithRef]
  ); // 移除 toolTabs 依赖，通过 setToolTabs 回调函数获取最新值

  /**
   * 关闭工具标签（支持静默模式，避免循环调用）
   */
  const closeToolTab = useCallback(
    (tabId: string, silent = false) => {
      setToolTabsWithRef(prev => {
        const tab = prev.find(t => t.id === tabId);
        if (!tab) return prev;

        const filtered = prev.filter(t => t.id !== tabId);
        const windowId = tab.windowId;
        const remainingTabsInWindow = filtered.filter(t => t.windowId === windowId);

        // 如果关闭的是 http-service 工具的标签，通知后端停止工具
        // silent=true 时跳过（表示后端已经停止，前端只需关闭标签页）
        if (tab && !silent) {
          // 通过 IPC 通知后端停止工具进程（使用 invoke 而不是 send）
          window.ipc.invoke('tool:stop', tab.toolId).catch((err: Error) => {
            console.warn('[ToolTabContext] 停止工具失败:', err);
          });
        }

        // 如果关闭的是当前窗口激活的标签，切换到该窗口的最后一个标签
        setActiveToolTabIdsWithRef(activePrev => {
          const currentActive = activePrev[windowId] ?? null;
          if (currentActive !== tabId) return activePrev;

          const nextActive =
            remainingTabsInWindow.length > 0
              ? remainingTabsInWindow[remainingTabsInWindow.length - 1].id
              : null;
          return currentActive === nextActive
            ? activePrev
            : { ...activePrev, [windowId]: nextActive };
        });

        // 新增：如果是 detached 窗口的最后一个标签，关闭该窗口
        if (tab && tab.windowId !== 'main') {
          if (remainingTabsInWindow.length === 0) {
            requestCloseDetachedWindow(tab.windowId);
          }
        }

        return filtered;
      });
    },
    [requestCloseDetachedWindow, setActiveToolTabIdsWithRef, setToolTabsWithRef]
  );

  /**
   * 激活工具标签（传入 null 表示取消激活）
   */
  const activateToolTab = useCallback(
    (tabId: string | null, windowId = rendererWindowIdRef.current) => {
      setActiveToolTabIdsWithRef(activePrev => {
        const currentActive = activePrev[windowId] ?? null;
        if (currentActive === tabId) return activePrev;
        return { ...activePrev, [windowId]: tabId };
      });
    },
    [setActiveToolTabIdsWithRef]
  );

  /**
   * 更新标签状态
   */
  const updateToolTab = useCallback(
    (tabId: string, updates: Partial<Omit<ToolTab, 'id' | 'toolId'>>) => {
      setToolTabsWithRef(prev => {
        const existingTab = prev.find(tab => tab.id === tabId);
        if (!existingTab) return prev;

        const nextTabs = prev.map(tab => (tab.id === tabId ? { ...tab, ...updates } : tab));

        const targetWindowId = updates.windowId;
        if (targetWindowId && targetWindowId !== existingTab.windowId) {
          const sourceWindowId = existingTab.windowId;
          const remainingInSource = nextTabs.filter(tab => tab.windowId === sourceWindowId);

          setActiveToolTabIdsWithRef(activePrev => {
            const nextActive: Record<string, string | null> = {
              ...activePrev,
              [targetWindowId]: tabId,
            };
            if ((activePrev[sourceWindowId] ?? null) === tabId) {
              nextActive[sourceWindowId] =
                remainingInSource.length > 0
                  ? remainingInSource[remainingInSource.length - 1].id
                  : null;
            }
            return nextActive;
          });

          if (sourceWindowId !== 'main' && remainingInSource.length === 0) {
            requestCloseDetachedWindow(sourceWindowId);
          }
        }

        return nextTabs;
      });
    },
    [requestCloseDetachedWindow, setActiveToolTabIdsWithRef, setToolTabsWithRef]
  );

  /**
   * 重新排序标签
   */
  const reorderToolTabs = useCallback(
    (tabIds: string[]) => {
      setToolTabsWithRef(prev => {
        // 创建 ID 到索引的映射
        const orderMap = new Map(tabIds.map((id, index) => [id, index]));

        // 按照新顺序排序
        return [...prev].sort((a, b) => {
          const indexA = orderMap.get(a.id) ?? prev.indexOf(a);
          const indexB = orderMap.get(b.id) ?? prev.indexOf(b);
          return indexA - indexB;
        });
      });
    },
    [setToolTabsWithRef]
  );

  /**
   * 检查工具是否已有标签
   */
  const hasToolTab = useCallback(
    (toolId: string): boolean => {
      return toolTabs.some(tab => tab.toolId === toolId);
    },
    [toolTabs]
  );

  /**
   * 根据工具 ID 获取标签
   */
  const getToolTabByToolId = useCallback(
    (toolId: string): ToolTab | undefined => {
      return toolTabs.find(tab => tab.toolId === toolId);
    },
    [toolTabs]
  );

  /**
   * 监听工具状态变化，工具停止时自动关闭标签
   */
  useEffect(() => {
    const handler = (...args: unknown[]) => {
      const payload = args[0] as { toolId: string; status: string };
      if (payload?.toolId && (payload.status === 'stopped' || payload.status === 'error')) {
        // 查找该工具的标签并关闭
        const tab = toolTabs.find(t => t.toolId === payload.toolId);
        if (tab) {
          closeToolTab(tab.id, true); // silent=true，避免重复调用 tool:stop
        }
      }
    };

    window.ipc.on('tool:state', handler);
    return () => window.ipc.off('tool:state', handler);
  }, [toolTabs, closeToolTab]);

  /**
   * 监听工具启动事件，创建工具标签
   */
  useEffect(() => {
    const handler = (...args: unknown[]) => {
      const payload = args[0] as { toolId: string; url: string; label: string };
      if (payload?.toolId && payload?.url && payload?.label) {
        const targetWindowId = rendererWindowIdRef.current;
        const tabId = createToolTab(payload.toolId, payload.label, payload.url, targetWindowId);
        activateToolTab(tabId, targetWindowId); // 自动激活新创建的标签
      }
    };

    window.ipc.on('tool:open-in-tab', handler);
    return () => window.ipc.off('tool:open-in-tab', handler);
  }, [createToolTab, activateToolTab]);

  /**
   * 监听窗口关闭事件，关闭窗口中的所有标签
   */
  useEffect(() => {
    const cleanupTimers = closingWindowCleanupTimersRef.current;

    const handler = (...args: unknown[]) => {
      if (!isMainRenderer) return;

      const payload = args[0] as { windowId: string; reason?: string };
      const windowId = payload?.windowId;
      if (windowId) {
        const closeWasRequested =
          payload.reason === 'empty' || closingWindowIdsRef.current.has(windowId);
        closingWindowIdsRef.current.add(windowId);

        const cleanup = () => {
          const windowTabIds = toolTabsRef.current
            .filter(tab => tab.windowId === windowId)
            .map(tab => tab.id);
          windowTabIds.forEach(tabId => {
            closeToolTab(tabId);
          });
        };

        // 自己请求关闭（通常是"窗口已空"触发）的场景：延迟清理，避免与跨窗口同步产生竞态导致误关已 dock 的标签
        if (closeWasRequested) {
          // 清理可能存在的旧定时器，避免内存泄漏
          const existingTimer = closingWindowCleanupTimersRef.current.get(windowId);
          if (existingTimer) {
            window.clearTimeout(existingTimer);
          }
          const timer = window.setTimeout(() => {
            closingWindowCleanupTimersRef.current.delete(windowId);
            cleanup();
          }, WINDOW_CLOSING_CLEANUP_DELAY_MS);
          closingWindowCleanupTimersRef.current.set(windowId, timer);
          return;
        }

        // 关闭该窗口的所有标签 = 关闭工具标签（需要触发 tool:stop，避免工具无标签但仍在跑）
        cleanup();
      }
    };

    window.ipc.on('window:closing', handler);
    return () => {
      window.ipc.off('window:closing', handler);
      cleanupTimers.forEach(timer => window.clearTimeout(timer));
      cleanupTimers.clear();
    };
  }, [closeToolTab, isMainRenderer]);

  const value: ToolTabContextValue = {
    toolTabs,
    activeToolTabId,
    getActiveToolTabId,
    exportState,
    createToolTab,
    closeToolTab,
    activateToolTab,
    updateToolTab,
    reorderToolTabs,
    hasToolTab,
    getToolTabByToolId,
  };

  return <ToolTabContext.Provider value={value}>{children}</ToolTabContext.Provider>;
}

/**
 * 使用工具标签页 Hook
 */
export function useToolTabs(): ToolTabContextValue {
  const context = useContext(ToolTabContext);
  if (!context) {
    throw new Error('useToolTabs must be used within ToolTabProvider');
  }
  return context;
}
