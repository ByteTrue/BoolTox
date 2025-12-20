/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid, Settings, X, Moon, Sun, Monitor } from 'lucide-react';
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

export function TabBar() {
  const [activeTabId, setActiveTabId] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, themeMode, setThemeMode } = useTheme();
  const { toolTabs, activeToolTabId, activateToolTab, closeToolTab } = useToolTabs();

  // 合并路由标签和工具标签
  const allTabs = useMemo(() => {
    const routeTabs: Tab[] = DEFAULT_ROUTE_TABS;

    const toolTabsData: Tab[] = toolTabs.map(tt => ({
      id: tt.id,
      type: 'tool' as const,
      toolId: tt.toolId,
      label: tt.label,
      icon: <Grid size={14} />, // 工具标签使用统一图标
      closable: true,
    }));

    return [...routeTabs, ...toolTabsData];
  }, [toolTabs]);

  // 根据路由或工具标签激活状态同步激活标签
  useEffect(() => {
    const path = location.pathname;

    // 设置页面特殊处理（不创建标签）
    if (path.startsWith('/settings')) {
      setActiveTabId('settings');
      return;
    }

    // 如果有激活的工具标签，使用工具标签的 ID
    if (activeToolTabId) {
      setActiveTabId(activeToolTabId);
    } else {
      // 否则查找匹配的路由标签
      const routeTab = DEFAULT_ROUTE_TABS.find(tab => tab.path === path);
      if (routeTab) {
        setActiveTabId(routeTab.id);
      }
    }
  }, [location.pathname, activeToolTabId]);

  // 点击标签
  const handleTabClick = useCallback(
    (tab: Tab) => {
      if (tab.type === 'route') {
        // 路由标签：导航到对应路径，并取消工具标签激活
        navigate(tab.path!);
        setActiveTabId(tab.id);
        // 取消工具标签激活（如果有的话）
        if (activeToolTabId) {
          activateToolTab(null);
        }
      } else if (tab.type === 'tool') {
        // 工具标签：激活工具标签
        activateToolTab(tab.id);
        setActiveTabId(tab.id);
      }
    },
    [navigate, activateToolTab, activeToolTabId]
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
    >
      {/* 标签页列表 - 整个容器也可拖拽 */}
      <div
        className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none"
        style={{
          WebkitAppRegion: 'drag',
        }}
      >
        <AnimatePresence mode="popLayout">
          {allTabs.map(tab => {
            const isActive = activeTabId === tab.id;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => handleTabClick(tab)}
                onAuxClick={e => handleAuxClick(tab, e)}
                style={{
                  WebkitAppRegion: 'no-drag',
                }}
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
                {tab.closable && (
                  <button
                    onClick={e => handleCloseTab(tab, e)}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10 rounded p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* + 按钮（暂时隐藏，后续用于创建工具标签） */}
        {/* <button
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            theme === 'dark' ? 'hover:bg-white/5 text-white/70' : 'hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Plus size={16} />
        </button> */}
      </div>

      {/* 右侧按钮组 */}
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
          onClick={() => navigate('/settings/developer')}
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

      {/* Windows/Linux 窗口控制 */}
      <WindowControls />
    </div>
  );
}
