/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

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
}

/**
 * 工具标签页 Context 值
 */
interface ToolTabContextValue {
  toolTabs: ToolTab[];
  activeToolTabId: string | null;

  // 创建工具标签（返回标签 ID）
  createToolTab: (toolId: string, label: string, url: string) => string;

  // 关闭工具标签
  closeToolTab: (tabId: string) => void;

  // 激活工具标签
  activateToolTab: (tabId: string | null) => void;

  // 更新标签状态
  updateToolTab: (tabId: string, updates: Partial<Omit<ToolTab, 'id' | 'toolId'>>) => void;

  // 检查工具是否已有标签
  hasToolTab: (toolId: string) => boolean;

  // 根据工具 ID 获取标签
  getToolTabByToolId: (toolId: string) => ToolTab | undefined;
}

const ToolTabContext = createContext<ToolTabContextValue | null>(null);

/**
 * 工具标签页 Provider
 */
export function ToolTabProvider({ children }: { children: ReactNode }) {
  const [toolTabs, setToolTabs] = useState<ToolTab[]>([]);
  const [activeToolTabId, setActiveToolTabId] = useState<string | null>(null);

  /**
   * 创建工具标签
   */
  const createToolTab = useCallback((toolId: string, label: string, url: string): string => {
    // 检查是否已存在该工具的标签
    const existingTab = toolTabs.find(tab => tab.toolId === toolId);
    if (existingTab) {
      // 已存在，激活该标签
      setActiveToolTabId(existingTab.id);
      return existingTab.id;
    }

    // 生成唯一 ID
    const tabId = `tool-tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const newTab: ToolTab = {
      id: tabId,
      toolId,
      label,
      url,
      canGoBack: false,
      canGoForward: false,
      isLoading: true,
    };

    setToolTabs(prev => [...prev, newTab]);
    setActiveToolTabId(tabId);

    console.log('[ToolTabContext] 创建工具标签:', { tabId, toolId, url });

    return tabId;
  }, [toolTabs]);

  /**
   * 关闭工具标签
   */
  const closeToolTab = useCallback((tabId: string) => {
    setToolTabs(prev => {
      const filtered = prev.filter(tab => tab.id !== tabId);

      // 如果关闭的是当前激活的标签，切换到最后一个标签
      if (activeToolTabId === tabId) {
        if (filtered.length > 0) {
          setActiveToolTabId(filtered[filtered.length - 1].id);
        } else {
          setActiveToolTabId(null);
        }
      }

      console.log('[ToolTabContext] 关闭工具标签:', tabId);
      return filtered;
    });
  }, [activeToolTabId]);

  /**
   * 激活工具标签（传入 null 表示取消激活）
   */
  const activateToolTab = useCallback((tabId: string | null) => {
    setActiveToolTabId(tabId);
    console.log('[ToolTabContext] 激活工具标签:', tabId);
  }, []);

  /**
   * 更新标签状态
   */
  const updateToolTab = useCallback((tabId: string, updates: Partial<Omit<ToolTab, 'id' | 'toolId'>>) => {
    setToolTabs(prev =>
      prev.map(tab =>
        tab.id === tabId
          ? { ...tab, ...updates }
          : tab
      )
    );
  }, []);

  /**
   * 检查工具是否已有标签
   */
  const hasToolTab = useCallback((toolId: string): boolean => {
    return toolTabs.some(tab => tab.toolId === toolId);
  }, [toolTabs]);

  /**
   * 根据工具 ID 获取标签
   */
  const getToolTabByToolId = useCallback((toolId: string): ToolTab | undefined => {
    return toolTabs.find(tab => tab.toolId === toolId);
  }, [toolTabs]);

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
          console.log('[ToolTabContext] 工具停止，关闭标签:', tab.id);
          closeToolTab(tab.id);
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
        console.log('[ToolTabContext] 收到工具标签创建请求:', payload);
        const tabId = createToolTab(payload.toolId, payload.label, payload.url);
        activateToolTab(tabId); // 自动激活新创建的标签
      }
    };

    window.ipc.on('tool:open-in-tab', handler);
    return () => window.ipc.off('tool:open-in-tab', handler);
  }, [createToolTab, activateToolTab]);

  const value: ToolTabContextValue = {
    toolTabs,
    activeToolTabId,
    createToolTab,
    closeToolTab,
    activateToolTab,
    updateToolTab,
    hasToolTab,
    getToolTabByToolId,
  };

  return (
    <ToolTabContext.Provider value={value}>
      {children}
    </ToolTabContext.Provider>
  );
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
