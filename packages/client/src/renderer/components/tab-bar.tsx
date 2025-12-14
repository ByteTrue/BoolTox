/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Grid, Settings, Plus, X, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './theme-provider';
import WindowControls from './window-controls';

interface Tab {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  closable: boolean;
}

const DEFAULT_TABS: Tab[] = [
  { id: 'home', path: '/', label: '首页', icon: <Home size={14} />, closable: false },
  { id: 'tools', path: '/tools', label: '工具', icon: <Grid size={14} />, closable: false },
];

// 平台检测（渲染进程安全）
const userAgent = navigator.userAgent.toLowerCase();
const isMac = userAgent.includes('mac');
const isWin = userAgent.includes('win');
const isLinux = userAgent.includes('linux') && !userAgent.includes('android');

export function TabBar() {
  const [tabs, setTabs] = useState<Tab[]>(DEFAULT_TABS);
  const [activeTabId, setActiveTabId] = useState('home');
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  // 根据路由同步激活标签
  useEffect(() => {
    const path = location.pathname;

    // 设置页面特殊处理（不创建标签）
    if (path.startsWith('/settings')) {
      setActiveTabId('settings');
      return;
    }

    const currentTab = tabs.find(tab => tab.path === path);
    if (currentTab) {
      setActiveTabId(currentTab.id);
    }
  }, [location.pathname, tabs]);

  // 关闭标签
  const closeTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    const index = tabs.findIndex(tab => tab.id === tabId);
    if (index === -1) return;

    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);

    // 如果关闭的是当前标签，切换到最后一个
    if (tabId === activeTabId) {
      const lastTab = newTabs[newTabs.length - 1];
      navigate(lastTab.path);
    }
  }, [tabs, activeTabId, navigate]);

  // 中键点击关闭标签
  const handleAuxClick = useCallback((tab: Tab, e: React.MouseEvent) => {
    if (e.button === 1 && tab.closable) { // 中键
      e.preventDefault();
      closeTab(tab.id);
    }
  }, [closeTab]);

  // 切换主题
  const themeIcon = theme === 'dark' ? <Moon size={16} /> : theme === 'light' ? <Sun size={16} /> : <Monitor size={16} />;

  return (
    <div
      className="flex items-center h-12 gap-2 px-4 border-b transition-colors duration-300"
      style={{
        // @ts-ignore - webkit specific property
        WebkitAppRegion: 'drag',
        paddingLeft: isMac ? 'max(env(titlebar-area-x, 80px), 80px)' : '16px',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        background: theme === 'dark'
          ? 'rgba(28, 30, 35, 0.8)'
          : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* 标签页列表 - 整个容器也可拖拽 */}
      <div
        className="flex gap-1.5 flex-1 overflow-x-auto scrollbar-none"
        style={{
          // @ts-ignore - 保持拖拽，只在按钮上禁用
          WebkitAppRegion: 'drag',
        }}
      >
        <AnimatePresence mode="popLayout">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                onClick={() => navigate(tab.path)}
                onAuxClick={(e) => handleAuxClick(tab, e)}
                style={{
                  // @ts-ignore - 标签按钮禁用拖拽
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
                    onClick={(e) => closeTab(tab.id, e)}
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
          // @ts-ignore
          WebkitAppRegion: 'no-drag',
          paddingRight: isMac ? '12px' : '0',
        }}
      >
        {/* 主题切换 */}
        <button
          onClick={toggleTheme}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/10 text-white/80'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="切换主题"
        >
          {themeIcon}
        </button>

        {/* 设置按钮 */}
        <button
          onClick={() => navigate('/settings')}
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
