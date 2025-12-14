/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useMemo } from 'react';
import { Search, Zap, Grid, Settings, Home } from 'lucide-react';
import { useModulePlatform } from '../contexts/module-context';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickPanel() {
  const [query, setQuery] = useState('');
  const { installedModules, openModule } = useModulePlatform();

  // 收藏的工具（最多 6 个）
  const favorites = useMemo(
    () => installedModules.filter((m) => m.isFavorite).slice(0, 6),
    [installedModules]
  );

  // 搜索过滤
  const filteredModules = useMemo(() => {
    if (!query) return [];
    return installedModules.filter((module) =>
      module.definition.name.toLowerCase().includes(query.toLowerCase()) ||
      module.definition.description?.toLowerCase().includes(query.toLowerCase())
    );
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
  const handleToolClick = (toolId: string) => {
    openModule(toolId);
    window.quickPanel?.hide();
  };

  // 处理快速操作点击
  const handleActionClick = (action: () => void) => {
    action();
    window.quickPanel?.hide();
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
          background: 'rgba(17, 24, 39, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 搜索框 */}
        <div className="relative p-6 border-b border-white/10">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-white/60" size={20} />
          <input
            type="text"
            placeholder="搜索工具或操作..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3.5 text-white text-lg placeholder:text-white/50 focus:outline-none focus:border-blue-500 transition-colors"
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
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
                    >
                      <span className="text-3xl">{module.definition.icon}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                          {module.definition.name}
                        </p>
                        <p className="text-white/60 text-sm line-clamp-1">
                          {module.definition.description}
                        </p>
                      </div>
                      {module.runtime.launchState === 'running' && (
                        <span className="flex items-center gap-1 text-xs text-green-400">
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          运行中
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <p className="text-white/60">没有找到匹配的工具</p>
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
                    <h3 className="text-white/80 text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                      ★ 收藏的工具
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {favorites.map((module) => (
                        <button
                          key={module.id}
                          onClick={() => handleToolClick(module.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-4xl group-hover:scale-110 transition-transform">
                            {module.definition.icon}
                          </span>
                          <span className="text-white text-sm text-center line-clamp-1">
                            {module.definition.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 快速操作 */}
                <div>
                  <h3 className="text-white/80 text-xs font-semibold mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Zap size={14} />
                    快速操作
                  </h3>
                  <div className="space-y-1">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action.action)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-white text-sm"
                      >
                        {action.icon}
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 提示 */}
                <div className="pt-4 border-t border-white/10">
                  <p className="text-white/40 text-xs text-center">
                    按 <kbd className="px-2 py-0.5 rounded bg-white/10 text-white/60">ESC</kbd> 关闭
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
