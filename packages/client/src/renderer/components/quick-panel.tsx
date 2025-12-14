/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Zap, Grid, Settings, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function QuickPanel() {
  const [query, setQuery] = useState('');
  const [installedModules, setInstalledModules] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

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
        console.log('[QuickPanel] 开始加载工具列表...');
        const modules = await window.tool?.getAll();
        console.log('[QuickPanel] 工具列表加载完成:', modules?.length, modules);
        setInstalledModules(modules || []);
      } catch (error) {
        console.error('[QuickPanel] 加载工具列表失败', error);
      }
    };

    loadModules();
  }, []);

  // 收藏的工具（最多 6 个）
  const favorites = useMemo(
    () => installedModules.filter((m: any) => m.isFavorite).slice(0, 6),
    [installedModules]
  );

  // 搜索过滤
  const filteredModules = useMemo(() => {
    console.log('[QuickPanel] 搜索词:', query, '工具总数:', installedModules.length);
    if (!query) return [];

    const filtered = installedModules.filter((module: any) => {
      const name = module.manifest?.name?.toLowerCase() || '';
      const desc = module.manifest?.description?.toLowerCase() || '';
      const matches = name.includes(query.toLowerCase()) || desc.includes(query.toLowerCase());

      if (matches) {
        console.log('[QuickPanel] 匹配到工具:', module.manifest?.name);
      }

      return matches;
    });

    console.log('[QuickPanel] 搜索结果数量:', filtered.length);
    return filtered;
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
          background: 'rgba(17, 24, 39, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* 搜索框 */}
        <div className="relative p-6 border-b border-white/10">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 text-white/60" size={20} />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索工具或操作..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
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
                  filteredModules.map((module: any) => (
                    <button
                      key={module.id}
                      onClick={() => handleToolClick(module.id)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition-colors text-left group"
                    >
                      <span className="text-3xl">{module.manifest.icon || '🔧'}</span>
                      <div className="flex-1">
                        <p className="text-white font-medium group-hover:text-blue-400 transition-colors">
                          {module.manifest.name}
                        </p>
                        <p className="text-white/60 text-sm line-clamp-1">
                          {module.manifest.description}
                        </p>
                      </div>
                      {module.status === 'running' && (
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
                      {favorites.map((module: any) => (
                        <button
                          key={module.id}
                          onClick={() => handleToolClick(module.id)}
                          className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-white/10 transition-colors group"
                        >
                          <span className="text-4xl group-hover:scale-110 transition-transform">
                            {module.manifest.icon || '🔧'}
                          </span>
                          <span className="text-white text-sm text-center line-clamp-1">
                            {module.manifest.name}
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
