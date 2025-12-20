/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Zap, Grid, Settings, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolRuntime } from '@booltox/shared';

type QuickPanelTool = ToolRuntime & { isFavorite?: boolean };

// 获取系统主题
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// 解析实际主题
function resolveActualTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';

  const stored = window.localStorage.getItem('app-theme-mode');

  if (stored === 'light') return 'light';
  if (stored === 'dark') return 'dark';
  if (stored === 'system') return getSystemTheme();

  // 默认跟随系统
  return getSystemTheme();
}

export function QuickPanel() {
  const [query, setQuery] = useState('');
  const [installedModules, setInstalledModules] = useState<QuickPanelTool[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveActualTheme());

  // 监听主题变化（支持跟随系统）
  useEffect(() => {
    const updateTheme = () => {
      setTheme(resolveActualTheme());
    };

    // 监听 localStorage 变化（主窗口切换主题时同步）
    window.addEventListener('storage', updateTheme);

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', updateTheme);

    return () => {
      window.removeEventListener('storage', updateTheme);
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, []);

  // 自动聚焦搜索框
  useEffect(() => {
    // 延迟聚焦，确保窗口完全显示
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 加载已安装工具（通过 IPC，不依赖 Context）
  useEffect(() => {
    const loadModules = async () => {
      try {
        const modules = await (window.tool as unknown as { getAll?: () => Promise<QuickPanelTool[]> }).getAll?.();
        setInstalledModules(modules ?? []);
      } catch (error) {
        console.error('[QuickPanel] 加载工具列表失败', error);
      }
    };

    loadModules();
  }, []);

  // 收藏的工具（最多 6 个）
  const favorites = useMemo(
    () => installedModules.filter((m) => m.isFavorite).slice(0, 6),
    [installedModules]
  );

  // 搜索过滤
  const filteredModules = useMemo(() => {
    if (!query) return [];
    const lowerQuery = query.toLowerCase();

    return installedModules.filter((module) => {
      const name = module.manifest?.name?.toLowerCase() ?? '';
      const desc = module.manifest?.description?.toLowerCase() ?? '';
      return name.includes(lowerQuery) || desc.includes(lowerQuery);
    });
  }, [query, installedModules]);

  // 快速操作
  const quickActions = [
    { id: 'show-main', label: '显示主窗口', icon: <Home size={16} />, action: () => window.quickPanel?.showMain() },
    { id: 'tools', label: '打开工具商店', icon: <Grid size={16} />, action: () => window.quickPanel?.navigateTo('/tools') },
    { id: 'settings', label: '打开设置', icon: <Settings size={16} />, action: () => window.quickPanel?.navigateTo('/settings') },
  ];

  // ESC 键关闭
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.quickPanel?.hide();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  // 处理工具点击
  const handleToolClick = async (toolId: string) => {
    try {
      await window.tool?.start(toolId);
      window.quickPanel?.hide();
    } catch (error) {
      console.error('启动工具失败', error);
    }
  };

  // 处理快速操作点击
  const handleActionClick = (action: () => void) => {
    action();
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ duration: 0.15 }}
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: theme === 'dark'
            ? 'rgba(17, 24, 39, 0.98)'
            : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          border: theme === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* 搜索框 */}
        <div className={`relative p-6 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
          <Search className={`absolute left-9 top-1/2 -translate-y-1/2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-400'}`} size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索工具或操作..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className={`w-full border rounded-xl pl-12 pr-4 py-3.5 text-lg focus:outline-none transition-colors ${
              theme === 'dark'
                ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-500'
                : 'bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-blue-500'
            }`}
          />
        </div>

        {/* 内容区 */}
        <div className="p-6 max-h-[500px] overflow-y-auto elegant-scroll">
          <AnimatePresence mode="wait">
            {query ? (
              // 搜索结果
              <motion.div
                key="search-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-2"
              >
                {filteredModules.length > 0 ? (
                  filteredModules.map((module) => (
                    <button
                      key={module.id}
                      onClick={() => handleToolClick(module.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left group ${
                        theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                      }`}
                    >
                      <span className="text-3xl">{module.manifest.icon || '🔧'}</span>
                      <div className="flex-1">
                        <p className={`font-medium transition-colors ${
                          theme === 'dark'
                            ? 'text-white group-hover:text-blue-400'
                            : 'text-gray-900 group-hover:text-blue-600'
                        }`}>
                          {module.manifest.name}
                        </p>
                        <p className={`text-sm line-clamp-1 ${
                          theme === 'dark' ? 'text-white/60' : 'text-gray-500'
                        }`}>
                          {module.manifest.description}
                        </p>
                      </div>
                      {module.status === 'running' && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          运行中
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>没有找到匹配的工具</p>
                  </div>
                )}
              </motion.div>
            ) : (
              // 默认视图
              <motion.div
                key="default-view"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* 收藏的工具 */}
                {favorites.length > 0 && (
                  <div>
                    <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2 ${
                      theme === 'dark' ? 'text-white/80' : 'text-gray-600'
                    }`}>
                      ★ 收藏的工具
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {favorites.map((module) => (
                        <button
                          key={module.id}
                          onClick={() => handleToolClick(module.id)}
                          className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors group ${
                            theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-4xl group-hover:scale-110 transition-transform">
                            {module.manifest.icon || '🔧'}
                          </span>
                          <span className={`text-sm text-center line-clamp-1 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-900'
                          }`}>
                            {module.manifest.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 快速操作 */}
                <div>
                  <h3 className={`text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2 ${
                    theme === 'dark' ? 'text-white/80' : 'text-gray-600'
                  }`}>
                    <Zap size={14} />
                    快速操作
                  </h3>
                  <div className="space-y-1">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action.action)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-sm ${
                          theme === 'dark'
                            ? 'hover:bg-white/10 text-white'
                            : 'hover:bg-gray-100 text-gray-900'
                        }`}
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 提示 */}
                <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-200'}`}>
                  <p className={`text-xs text-center ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`}>
                    按 <kbd className={`px-2 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-white/10 text-white/60' : 'bg-gray-200 text-gray-600'
                    }`}>ESC</kbd> 关闭
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
