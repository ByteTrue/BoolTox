/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
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
  type: 'route' | 'tool';
  path?: string;
  toolId?: string;
}

/**
 * 默认路由标签
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

// 平台检测
const userAgent = navigator.userAgent.toLowerCase();
const isMac = userAgent.includes('mac');

/**
 * SortableTab 组件
 */
interface SortableTabProps {
  tab: Tab;
  isActive: boolean;
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
  windowId,
  onTabClick,
  onCloseTab,
  onAuxClick,
  onPopOut,
  onDockToMain,
}: SortableTabProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tab.id,
    disabled: tab.type === 'route',
  });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? 'all 0.15s',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      component="button"
      {...attributes}
      {...listeners}
      onClick={() => onTabClick(tab)}
      onAuxClick={e => onAuxClick(tab, e)}
      sx={{
        WebkitAppRegion: 'no-drag',
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        fontSize: '0.875rem',
        fontWeight: 500,
        minWidth: 90,
        border: 'none',
        cursor: 'pointer',
        bgcolor: isActive ? 'action.selected' : 'transparent',
        color: isActive ? 'text.primary' : 'text.secondary',
        '&:hover': {
          bgcolor: isActive ? 'action.selected' : 'action.hover',
          color: 'text.primary',
        },
        '& .tab-action': {
          opacity: 0,
          transition: 'opacity 0.15s',
        },
        '&:hover .tab-action': {
          opacity: 1,
        },
        ...dragStyle,
      }}
    >
      {tab.icon}
      <Box component="span" sx={{ flex: 1 }}>{tab.label}</Box>

      {/* Pop Out 按钮 */}
      {windowId === 'main' && tab.type === 'tool' && (
        <Box
          component="button"
          className="tab-action"
          onClick={e => onPopOut(tab, e)}
          title="在新窗口中打开"
          sx={{
            ml: 0.5,
            p: 0.25,
            borderRadius: 0.5,
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ExternalLink size={12} />
        </Box>
      )}

      {/* Dock 按钮 */}
      {windowId !== 'main' && tab.type === 'tool' && (
        <Box
          component="button"
          className="tab-action"
          onClick={e => onDockToMain(tab, e)}
          title="移回主窗口"
          sx={{
            ml: 0.5,
            p: 0.25,
            borderRadius: 0.5,
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ArrowLeftToLine size={12} />
        </Box>
      )}

      {/* 关闭按钮 */}
      {tab.closable && (
        <Box
          component="button"
          className="tab-action"
          onClick={e => onCloseTab(tab, e)}
          title="关闭"
          sx={{
            ml: 0.5,
            p: 0.25,
            borderRadius: 0.5,
            border: 'none',
            bgcolor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <X size={12} />
        </Box>
      )}
    </Box>
  );
}

/**
 * TabBar Props
 */
interface TabBarProps {
  windowId?: string;
}

const DETACH_THRESHOLD_PX = 32;
type WindowBounds = { x: number; y: number; width: number; height: number };
type CursorScreenPoint = { x: number; y: number };
type WindowBoundsInfo = { windowId: string; bounds: WindowBounds };

export function TabBar({ windowId = 'main' }: TabBarProps = {}) {
  const [activeTabId, setActiveTabId] = useState('home');
  const [activeId, setActiveId] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
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

  const moveTabToWindow = useCallback(
    (tabId: string, targetWindowId: string) => {
      updateToolTab(tabId, { windowId: targetWindowId });
      activateToolTab(tabId, targetWindowId);
      window.ipc.invoke('window:focus-window', targetWindowId).catch((err: Error) => {
        console.warn('[TabBar] 聚焦窗口失败:', err);
      });
    },
    [activateToolTab, updateToolTab]
  );

  const allTabs = useMemo(() => {
    const routeTabs: Tab[] = windowId === 'main' ? DEFAULT_ROUTE_TABS : [];
    const toolTabsData: Tab[] = toolTabs
      .filter(tt => tt.windowId === windowId)
      .map(tt => ({
        id: tt.id,
        type: 'tool' as const,
        toolId: tt.toolId,
        label: tt.label,
        icon: <Grid size={14} />,
        closable: true,
      }));
    return [...routeTabs, ...toolTabsData];
  }, [toolTabs, windowId]);

  useEffect(() => {
    if (windowId !== 'main') {
      if (windowActiveToolTabId) {
        setActiveTabId(windowActiveToolTabId);
      } else if (allTabs.length > 0) {
        setActiveTabId(allTabs[0].id);
      }
      return;
    }

    if (windowActiveToolTabId) {
      setActiveTabId(windowActiveToolTabId);
      return;
    }

    const path = location.pathname;
    if (path.startsWith('/settings')) {
      setActiveTabId('settings');
      return;
    }

    const routeTab = DEFAULT_ROUTE_TABS.find(tab => tab.path === path);
    if (routeTab) {
      setActiveTabId(routeTab.id);
    }
  }, [allTabs, location.pathname, windowActiveToolTabId, windowId]);

  const handleTabClick = useCallback(
    (tab: Tab) => {
      if (tab.type === 'route') {
        navigate(tab.path!);
        setActiveTabId(tab.id);
        if (windowActiveToolTabId) {
          activateToolTab(null, windowId);
        }
      } else if (tab.type === 'tool') {
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

        updateToolTab(tabId, { windowId: newWindowId });
        activateToolTab(tabId, newWindowId);
      } catch (error) {
        console.error('[TabBar] Failed to create detached window:', error);
      }
    },
    [activateToolTab, exportState, updateToolTab]
  );

  const handleCloseTab = useCallback(
    (tab: Tab, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
      }
      if (tab.type === 'tool') {
        closeToolTab(tab.id);
      }
    },
    [closeToolTab]
  );

  const handleAuxClick = useCallback(
    (tab: Tab, e: React.MouseEvent) => {
      if (e.button === 1 && tab.closable) {
        e.preventDefault();
        handleCloseTab(tab);
      }
    },
    [handleCloseTab]
  );

  const handlePopOut = useCallback(
    async (tab: Tab, e: React.MouseEvent) => {
      e.stopPropagation();
      if (tab.type !== 'tool') return;

      const newWindowId = `window-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const bounds = {
        x: window.screenX + 50,
        y: window.screenY + 50,
        width: 1200,
        height: 800,
      };

      try {
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

        await window.ipc.invoke('window:create-detached', {
          windowId: newWindowId,
          tabId: tab.id,
          bounds,
          bootState,
        });

        updateToolTab(tab.id, { windowId: newWindowId });
        activateToolTab(tab.id, newWindowId);
      } catch (error) {
        console.error('[TabBar] Failed to pop out tab:', error);
      }
    },
    [activateToolTab, exportState, updateToolTab]
  );

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
    void getAllWindowsBounds();
  }, [getAllWindowsBounds]);

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

    const dropPoint = await getCursorScreenPoint();
    if (dropPoint) {
      const targetWindow = findTargetWindow(dropPoint, windowId);
      if (targetWindow) {
        moveTabToWindow(draggedTabId, targetWindow.windowId);
        return;
      }
    }

    await detachToolTabToNewWindow(draggedTabId);
  }, [
    allTabs,
    detachToolTabToNewWindow,
    findTargetWindow,
    getCursorScreenPoint,
    moveTabToWindow,
    windowId,
  ]);

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
        if (draggedTab && draggedTab.type === 'tool') {
          const dropPoint = await getCursorScreenPoint();
          if (dropPoint) {
            const targetWindow = findTargetWindow(dropPoint, windowId);
            if (targetWindow) {
              moveTabToWindow(active.id as string, targetWindow.windowId);
              return;
            }
          }
          await detachToolTabToNewWindow(active.id as string);
        }
        return;
      }

      if (active.id !== over.id) {
        const windowTabIds = allTabs.map(t => t.id);
        const oldIndex = windowTabIds.indexOf(active.id as string);
        const newIndex = windowTabIds.indexOf(over.id as string);
        const newOrder = arrayMove(windowTabIds, oldIndex, newIndex);
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

  const handleToggleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const themeIcon =
    themeMode === 'dark' ? (
      <Moon size={16} />
    ) : themeMode === 'light' ? (
      <Sun size={16} />
    ) : (
      <Monitor size={16} />
    );

  return (
    <Box
      ref={tabBarRef}
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        gap: 1,
        px: 2,
        borderBottom: 1,
        borderColor: 'divider',
        bgcolor: 'background.paper',
        WebkitAppRegion: 'drag',
        pl: isMac ? 'max(env(titlebar-area-x, 80px), 80px)' : 2,
      }}
    >
      {/* 标签页列表 */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          flex: 1,
          overflowX: 'auto',
          WebkitAppRegion: 'drag',
          '&::-webkit-scrollbar': { display: 'none' },
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
            {allTabs.map(tab => (
              <SortableTab
                key={tab.id}
                tab={tab}
                isActive={activeTabId === tab.id}
                windowId={windowId}
                onTabClick={handleTabClick}
                onCloseTab={handleCloseTab}
                onAuxClick={handleAuxClick}
                onPopOut={handlePopOut}
                onDockToMain={handleDockToMain}
              />
            ))}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.5,
                  py: 0.75,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  minWidth: 90,
                  bgcolor: 'action.selected',
                  color: 'text.primary',
                }}
              >
                {allTabs.find(t => t.id === activeId)?.icon}
                <span>{allTabs.find(t => t.id === activeId)?.label}</span>
              </Box>
            ) : null}
          </DragOverlay>
        </DndContext>
      </Box>

      {/* 右侧按钮组（仅主窗口显示） */}
      {windowId === 'main' && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            flexShrink: 0,
            WebkitAppRegion: 'no-drag',
            pr: isMac ? 1.5 : 0,
          }}
        >
          {/* 主题切换 */}
          <IconButton
            onClick={handleToggleTheme}
            size="small"
            title="切换主题"
            sx={{ color: 'text.secondary' }}
          >
            {themeIcon}
          </IconButton>

          {/* 设置按钮 */}
          <IconButton
            onClick={() => {
              navigate('/settings/general');
              if (windowActiveToolTabId) {
                activateToolTab(null, windowId);
              }
            }}
            size="small"
            title="设置"
            sx={{
              color: activeTabId === 'settings' ? 'primary.main' : 'text.secondary',
              bgcolor: activeTabId === 'settings' ? 'action.selected' : 'transparent',
            }}
          >
            <Settings size={16} />
          </IconButton>
        </Box>
      )}

      {/* Windows/Linux 窗口控制 */}
      <WindowControls />
    </Box>
  );
}
