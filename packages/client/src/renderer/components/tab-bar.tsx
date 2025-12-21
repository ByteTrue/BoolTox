/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid, Settings, X, Moon, Sun, Monitor, ExternalLink, ArrowLeftToLine } from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  pointerWithin,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from './theme-provider';
import WindowControls from './window-controls';
import { useToolTabs } from '../contexts/tool-tab-context';

/**
 * 标签类型定义
 */
interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  closable: boolean;
  type: 'route' | 'tool'; // 路由标签 or 工具标签
  path?: string; // 路由标签的路径
  toolId?: string; // 工具标签的工具 ID
}

/**
 * 默认路由标签（首页、工具）
 */
const DEFAULT_ROUTE_TABS: Tab[] = [
  {
    id: 'home',
    type: 'route',
    path: '/',
    label: '首页',
    icon: <Home size={14} />,
    closable: false,
  },
  {
    id: 'tools',
    type: 'route',
    path: '/tools',
    label: '工具',
    icon: <Grid size={14} />,
    closable: false,
  },
];

// 平台检测（渲染进程安全）
const userAgent = navigator.userAgent.toLowerCase();
const isMac = userAgent.includes('mac');

/**
 * SortableTab 组件 - 可拖拽的标签
 */
interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
  theme: string;
  windowId: string;
  onTabClick: (tab: Tab) => void;
  onCloseTab: (tab: Tab, e: React.MouseEvent) => void;
  onAuxClick: (tab: Tab, e: React.MouseEvent) => void;
  onPopOut: (tab: Tab, e: React.MouseEvent) => void;
  onDockToMain: (tab: Tab, e?: React.MouseEvent) => void;
}

function SortableTab({
  tab,
  isActive,
  theme,
  windowId,
  onTabClick,
  onCloseTab,
  onAuxClick,
  onPopOut,
  onDockToMain,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    disabled: tab.type === 'route', // 路由标签不可拖拽
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    WebkitAppRegion: 'no-drag' as const,
  };

  return (
    <motion.button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      onClick={() => onTabClick(tab)}
      onAuxClick={e => onAuxClick(tab, e)}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 min-w-[90px] relative ${
        isActive
          ? theme === 'dark'
            ? 'bg-white/10 text-white'
            : 'bg-gray-200 text-gray-900'
          : theme === 'dark'
            ? 'text-white/70 hover:bg-white/5 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {tab.icon}
      <span className="flex-1">{tab.label}</span>
      {/* Pop Out 按钮（仅主窗口的工具标签显示） */}
      {windowId === 'main' && tab.type === 'tool' && (
        <button
          onClick={e => onPopOut(tab, e)}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5"
          title="在新窗口中打开"
        >
          <ExternalLink size={12} />
        </button>
      )}
      {/* Dock 按钮（仅分离窗口的工具标签显示） */}
      {windowId !== 'main' && tab.type === 'tool' && (
        <button
          onClick={e => onDockToMain(tab, e)}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5"
          title="移回主窗口"
        >
          <ArrowLeftToLine size={12} />
        </button>
      )}
      {tab.closable && (
        <button
          onClick={e => onCloseTab(tab, e)}
          className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5"
          title="关闭"
        >
          <X size={12} />
        </button>
      )}
    </motion.button>
  );
}

/**
 * TabBar Props
 */
interface TabBarProps {
  windowId?: string; // 窗口 ID（'main' 或 detached window UUID）
}

const DETACH_THRESHOLD_PX = 32;
type WindowBounds = { x: number; y: number; width: number; height: number };
type CursorScreenPoint = { x: number; y: number };
type WindowBoundsInfo = { windowId: string; bounds: WindowBounds };

export function TabBar({ windowId = 'main' }: TabBarProps = {}) {
  const [activeTabId, setActiveTabId] = useState('home');
  const [activeId, setActiveId] = useState<string | null>(null); // 拖拽中的标签 ID
  const activeIdRef = useRef<string | null>(null);
  const tabBarRef = useRef<HTMLDivElement | null>(null);
  const dragStartPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const shouldDetachRef = useRef(false);
  const mainWindowBoundsRef = useRef<WindowBounds | null>(null);
  const allWindowsBoundsRef = useRef<WindowBoundsInfo[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const {
    toolTabs,
    activeToolTabId,
    getActiveToolTabId,
    exportState,
    activateToolTab,
    closeToolTab,
    updateToolTab,
    reorderToolTabs,
  } = useToolTabs();
  const windowActiveToolTabId = windowId === 'main' ? activeToolTabId : getActiveToolTabId(windowId);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖动 8px 才触发拖拽
      },
    })
  );

  const getMainWindowBounds = useCallback(async (): Promise<WindowBounds | null> => {
    try {
      const result = (await window.ipc.invoke('window:get-main-window-bounds')) as unknown;
      if (!result || typeof result !== 'object') return null;
      const bounds = result as Partial<WindowBounds>;
      if (
        typeof bounds.x !== 'number' ||
        typeof bounds.y !== 'number' ||
        typeof bounds.width !== 'number' ||
        typeof bounds.height !== 'number'
      ) {
        return null;
      }
      mainWindowBoundsRef.current = { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
      return mainWindowBoundsRef.current;
    } catch (error) {
      console.warn('[TabBar] 获取主窗口 bounds 失败:', error);
      return null;
    }
  }, []);

  const getCursorScreenPoint = useCallback(async (): Promise<CursorScreenPoint | null> => {
    try {
      const result = (await window.ipc.invoke('window:get-cursor-screen-point')) as unknown;
      if (!result || typeof result !== 'object') return null;
      const point = result as Partial<CursorScreenPoint>;
      if (typeof point.x !== 'number' || typeof point.y !== 'number') return null;
      return { x: point.x, y: point.y };
    } catch (error) {
      console.warn('[TabBar] 获取鼠标坐标失败:', error);
      return null;
    }
  }, []);

  const isPointInBounds = useCallback((point: CursorScreenPoint, bounds: WindowBounds) => {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.width &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.height
    );
  }, []);

  // 获取所有窗口边界（用于跨窗口拖拽检测）
  const getAllWindowsBounds = useCallback(async (): Promise<WindowBoundsInfo[]> => {
    try {
      const result = (await window.ipc.invoke('window:get-all-windows-bounds')) as unknown;
      if (!Array.isArray(result)) return [];
      allWindowsBoundsRef.current = result as WindowBoundsInfo[];
      return allWindowsBoundsRef.current;
    } catch (error) {
      console.warn('[TabBar] 获取所有窗口 bounds 失败:', error);
      return [];
    }
  }, []);

  // 找到释放点所在的窗口（排除当前窗口）
  const findTargetWindow = useCallback(
    (point: CursorScreenPoint, excludeWindowId: string): WindowBoundsInfo | null => {
      for (const info of allWindowsBoundsRef.current) {
        if (info.windowId === excludeWindowId) continue;
        if (isPointInBounds(point, info.bounds)) {
          return info;
        }
      }
      return null;
    },
    [isPointInBounds]
  );

  // 移动标签到指定窗口
  const moveTabToWindow = useCallback(
    (tabId: string, targetWindowId: string) => {
      updateToolTab(tabId, { windowId: targetWindowId });
      activateToolTab(tabId, targetWindowId);
      // 聚焦目标窗口
      window.ipc.invoke('window:focus-window', targetWindowId).catch((err: Error) => {
        console.warn('[TabBar] 聚焦窗口失败:', err);
      });
    },
    [activateToolTab, updateToolTab]
  );

  // 合并路由标签和工具标签
  const allTabs = useMemo(() => {
    // 只有主窗口显示路由标签
    const routeTabs: Tab[] = windowId === 'main' ? DEFAULT_ROUTE_TABS : [];

    // 过滤出属于当前窗口的工具标签
    const toolTabsData: Tab[] = toolTabs
      .filter(tt => tt.windowId === windowId)
      .map(tt => ({
        id: tt.id,
        type: 'tool' as const,
        toolId: tt.toolId,
        label: tt.label,
        icon: <Grid size={14} />, // 工具标签使用统一图标
        closable: true,
      }));

    return [...routeTabs, ...toolTabsData];
  }, [toolTabs, windowId]);

  // 根据路由或工具标签激活状态同步激活标签
  useEffect(() => {
    if (windowId !== 'main') {
      if (windowActiveToolTabId) {
        setActiveTabId(windowActiveToolTabId);
      } else if (allTabs.length > 0) {
        setActiveTabId(allTabs[0].id);
      }
      return;
    }

    // 如果有激活的工具标签，优先使用工具标签的 ID（优先级最高）
    if (windowActiveToolTabId) {
      setActiveTabId(windowActiveToolTabId);
      return;
    }

    const path = location.pathname;

    // 设置页面特殊处理（不创建标签）
    if (path.startsWith('/settings')) {
      setActiveTabId('settings');
      return;
    }

    // 查找匹配的路由标签
    const routeTab = DEFAULT_ROUTE_TABS.find(tab => tab.path === path);
    if (routeTab) {
      setActiveTabId(routeTab.id);
    }
  }, [allTabs, location.pathname, windowActiveToolTabId, windowId]);

  // 点击标签
  const handleTabClick = useCallback(
    (tab: Tab) => {
      if (tab.type === 'route') {
        // 路由标签：导航到对应路径，并取消工具标签激活
        navigate(tab.path!);
        setActiveTabId(tab.id);
        // 取消工具标签激活（如果有的话）
        if (windowActiveToolTabId) {
          activateToolTab(null, windowId);
        }
      } else if (tab.type === 'tool') {
        // 工具标签：激活工具标签
        activateToolTab(tab.id, windowId);
        setActiveTabId(tab.id);
      }
    },
    [activateToolTab, navigate, windowActiveToolTabId, windowId]
  );

  const handleDockToMain = useCallback(
    (tab: Tab, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      if (tab.type !== 'tool') return;

      updateToolTab(tab.id, { windowId: 'main' });
      activateToolTab(tab.id, 'main');
      window.ipc.invoke('quick-panel:show-main').catch((err: Error) => {
        console.warn('[TabBar] 聚焦主窗口失败:', err);
      });
    },
    [activateToolTab, updateToolTab]
  );

  const detachToolTabToNewWindow = useCallback(
    async (tabId: string) => {
      const newWindowId = `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const bounds = {
        x: window.screenX + 100,
        y: window.screenY + 100,
        width: 1200,
        height: 800,
      };

      try {
        // 直接从 ref 读取状态并计算新状态，避免 flushSync 强制同步渲染
        const currentState = exportState();
        const bootState = {
          toolTabs: currentState.toolTabs.map(t =>
            t.id === tabId ? { ...t, windowId: newWindowId } : t
          ),
          activeToolTabIds: {
            ...currentState.activeToolTabIds,
            [newWindowId]: tabId,
          },
        };

        await window.ipc.invoke('window:create-detached', {
          windowId: newWindowId,
          tabId,
          bounds,
          bootState,
        });

        // 异步更新 React 状态
        updateToolTab(tabId, { windowId: newWindowId });
        activateToolTab(tabId, newWindowId);
      } catch (error) {
        console.error('[TabBar] Failed to create detached window:', error);
      }
    },
    [activateToolTab, exportState, updateToolTab]
  );

  // 关闭标签
  const handleCloseTab = useCallback(
    (tab: Tab, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }

      if (tab.type === 'tool') {
        // 关闭工具标签
        closeToolTab(tab.id);
      }
      // 路由标签不可关闭，不处理
    },
    [closeToolTab]
  );

  // 中键点击关闭标签
  const handleAuxClick = useCallback(
    (tab: Tab, e: React.MouseEvent) => {
      if (e.button === 1 && tab.closable) {
        // 中键
        e.preventDefault();
        handleCloseTab(tab);
      }
    },
    [handleCloseTab]
  );

  // 弹出到新窗口
  const handlePopOut = useCallback(
    async (tab: Tab, e: React.MouseEvent) => {
      e.stopPropagation();

      // 只有工具标签可以弹出
      if (tab.type !== 'tool') return;

      // 生成新窗口 ID
      const newWindowId = `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // 计算新窗口位置（在当前窗口右侧偏移）
      const bounds = {
        x: window.screenX + 50,
        y: window.screenY + 50,
        width: 1200,
        height: 800,
      };

      try {
        // 直接从 ref 读取状态并计算新状态，避免 flushSync 强制同步渲染
        const currentState = exportState();
        const bootState = {
          toolTabs: currentState.toolTabs.map(t =>
            t.id === tab.id ? { ...t, windowId: newWindowId } : t
          ),
          activeToolTabIds: {
            ...currentState.activeToolTabIds,
            [newWindowId]: tab.id,
          },
        };

        // 创建分离窗口
        await window.ipc.invoke('window:create-detached', {
          windowId: newWindowId,
          tabId: tab.id,
          bounds,
          bootState,
        });

        // 异步更新 React 状态
        updateToolTab(tab.id, { windowId: newWindowId });
        activateToolTab(tab.id, newWindowId);
      } catch (error) {
        console.error('[TabBar] Failed to pop out tab:', error);
      }
    },
    [activateToolTab, exportState, updateToolTab]
  );

  // 拖拽开始
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const id = event.active.id as string;
    setActiveId(id);
    activeIdRef.current = id;

    const activatorEvent = event.activatorEvent as MouseEvent | PointerEvent | TouchEvent;
    if ('clientX' in activatorEvent && 'clientY' in activatorEvent) {
      dragStartPointerRef.current = {
        clientX: (activatorEvent as { clientX: number; clientY: number }).clientX,
        clientY: (activatorEvent as { clientX: number; clientY: number }).clientY,
      };
    } else {
      dragStartPointerRef.current = null;
    }
    shouldDetachRef.current = false;

    // 获取所有窗口边界（用于跨窗口拖拽检测）
    void getAllWindowsBounds();
  }, [getAllWindowsBounds]);

  // 拖拽移动：检测是否离开标签栏区域
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!dragStartPointerRef.current || !tabBarRef.current) return;

    const currentX = dragStartPointerRef.current.clientX + event.delta.x;
    const currentY = dragStartPointerRef.current.clientY + event.delta.y;
    const rect = tabBarRef.current.getBoundingClientRect();

    const outOfBounds =
      currentX < rect.left - DETACH_THRESHOLD_PX ||
      currentX > rect.right + DETACH_THRESHOLD_PX ||
      currentY < rect.top - DETACH_THRESHOLD_PX ||
      currentY > rect.bottom + DETACH_THRESHOLD_PX;

    shouldDetachRef.current = outOfBounds;
  }, []);

  // 拖拽取消
  const handleDragCancel = useCallback(async () => {
    const draggedTabId = activeIdRef.current;
    const detachRequested = shouldDetachRef.current;

    setActiveId(null);
    activeIdRef.current = null;
    shouldDetachRef.current = false;
    dragStartPointerRef.current = null;

    if (!detachRequested || !draggedTabId) return;

    const draggedTab = allTabs.find(t => t.id === draggedTabId);
    if (!draggedTab || draggedTab.type !== 'tool') return;

    // 检测释放点是否在其他窗口内
    const dropPoint = await getCursorScreenPoint();
    if (dropPoint) {
      const targetWindow = findTargetWindow(dropPoint, windowId);
      if (targetWindow) {
        // 移动到目标窗口
        moveTabToWindow(draggedTabId, targetWindow.windowId);
        return;
      }
    }

    // 不在任何其他窗口内：创建新窗口
    await detachToolTabToNewWindow(draggedTabId);
  }, [
    allTabs,
    detachToolTabToNewWindow,
    findTargetWindow,
    getCursorScreenPoint,
    moveTabToWindow,
    windowId,
  ]);

  // 拖拽结束
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      activeIdRef.current = null;
      const detachRequested = shouldDetachRef.current || !over;

      setActiveId(null);
      shouldDetachRef.current = false;
      dragStartPointerRef.current = null;

      if (detachRequested) {
        const draggedTab = allTabs.find(t => t.id === active.id);

        // 只有工具标签可以拖出窗口
        if (draggedTab && draggedTab.type === 'tool') {
          // 检测释放点是否在其他窗口内
          const dropPoint = await getCursorScreenPoint();
          if (dropPoint) {
            const targetWindow = findTargetWindow(dropPoint, windowId);
            if (targetWindow) {
              // 移动到目标窗口
              moveTabToWindow(active.id as string, targetWindow.windowId);
              return;
            }
          }

          // 不在任何其他窗口内：创建新窗口
          await detachToolTabToNewWindow(active.id as string);
        }
        return;
      }

      if (active.id !== over.id) {
        // 获取当前窗口的标签 ID 列表
        const windowTabIds = allTabs.map(t => t.id);
        const oldIndex = windowTabIds.indexOf(active.id as string);
        const newIndex = windowTabIds.indexOf(over.id as string);

        // 重新排序
        const newOrder = arrayMove(windowTabIds, oldIndex, newIndex);

        // 更新全局标签顺序
        reorderToolTabs(newOrder);

      }
    },
    [
      allTabs,
      detachToolTabToNewWindow,
      findTargetWindow,
      getCursorScreenPoint,
      moveTabToWindow,
      reorderToolTabs,
      windowId,
    ]
  );

  // 循环切换主题：light → dark → system → light
  const handleToggleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  // 主题图标
  const themeIcon =
    themeMode === 'dark' ? (
      <Moon size={16} />
    ) : themeMode === 'light' ? (
      <Sun size={16} />
    ) : (
      <Monitor size={16} />
    );

  return (
    <div
      className="flex items-center h-12 gap-2 px-4 border-b transition-colors duration-300"
      style={{
        WebkitAppRegion: 'drag',
        paddingLeft: isMac ? 'max(env(titlebar-area-x, 80px), 80px)' : '16px',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        background: theme === 'dark' ? 'rgba(28, 30, 35, 0.8)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
      ref={tabBarRef}
    >
      {/* 标签页列表 - 整个容器也可拖拽 */}
      <div
        className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none"
        style={{
          WebkitAppRegion: 'drag',
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          onDragCancel={handleDragCancel}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allTabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
            <AnimatePresence mode="popLayout">
              {allTabs.map(tab => {
                const isActive = activeTabId === tab.id;
                return (
                  <SortableTab
                    key={tab.id}
                    tab={tab}
                    isActive={isActive}
                    theme={theme}
                    windowId={windowId}
                    onTabClick={handleTabClick}
                    onCloseTab={handleCloseTab}
                    onAuxClick={handleAuxClick}
                    onPopOut={handlePopOut}
                    onDockToMain={handleDockToMain}
                  />
                );
              })}
            </AnimatePresence>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium min-w-[90px] ${
                  theme === 'dark' ? 'bg-white/20 text-white' : 'bg-gray-300 text-gray-900'
                }`}
              >
                {allTabs.find(t => t.id === activeId)?.icon}
                <span>{allTabs.find(t => t.id === activeId)?.label}</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* + 按钮（暂时隐藏，后续用于创建工具标签） */}
        {/* <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            theme === 'dark' ? 'hover:bg-white/5 text-white/70' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Plus size={16} />
        </button> */}
      </div>

      {/* 右侧按钮组（仅主窗口显示） */}
      {windowId === 'main' && (
        <div
          className="flex items-center gap-1.5 flex-shrink-0"
          style={{
            WebkitAppRegion: 'no-drag',
            paddingRight: isMac ? '12px' : '0',
          }}
        >
          {/* 主题切换 */}
          <button
            onClick={handleToggleTheme}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-white/10 text-white/80' : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="切换主题"
          >
            {themeIcon}
          </button>

          {/* 设置按钮 */}
          <button
            onClick={() => {
              navigate('/settings/general');
              // 取消工具标签激活，确保设置页面正确显示
              if (windowActiveToolTabId) {
                activateToolTab(null, windowId);
              }
            }}
            className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
              activeTabId === 'settings'
                ? theme === 'dark'
                  ? 'bg-white/10 text-white'
                  : 'bg-gray-200 text-gray-900'
                : theme === 'dark'
                  ? 'hover:bg-white/10 text-white/80'
                  : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="设置"
          >
            <Settings size={16} />
          </button>
        </div>
      )}

      {/* Windows/Linux 窗口控制 */}
      <WindowControls />
    </div>
  );
}
