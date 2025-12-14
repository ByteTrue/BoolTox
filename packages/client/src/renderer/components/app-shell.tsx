/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Suspense, lazy, useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TabBar } from './tab-bar';
import { QuickPanel } from './quick-panel';
import { useTheme } from './theme-provider';
import { GlassLoadingFallback } from './ui/glass-loading-fallback';
import { ErrorBoundary } from './error-boundary';
import { UpdateBanner } from './ui/update-banner';

// 路由懒加载
const HomePage = lazy(() => import('../pages/home-page').then(m => ({ default: m.HomePage })));
const ToolsPage = lazy(() => import('../pages/tools-page').then(m => ({ default: m.ToolsPage })));
const SettingsPage = lazy(() => import('../pages/settings-page').then(m => ({ default: m.SettingsPage })));

// 页面切换动画
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

export function AppShell() {
  const { theme } = useTheme();
  const [isQuickPanel, setIsQuickPanel] = useState(false);

  // 检测是否为快捷面板路由
  useEffect(() => {
    const checkHash = () => {
      setIsQuickPanel(window.location.hash === '#/quick-panel');
    };

    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => {
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

  // 快捷面板路由（单独渲染）
  if (isQuickPanel) {
    return <QuickPanel />;
  }

  // 正常应用路由
  return (
    <div
      className="flex flex-col h-dvh overflow-hidden transition-colors duration-300"
      style={{
        background:
          theme === 'dark'
            ? 'linear-gradient(135deg, rgb(15, 23, 42) 0%, rgb(30, 41, 59) 100%)'
            : 'linear-gradient(135deg, rgb(241, 245, 249) 0%, rgb(226, 232, 240) 100%)',
      }}
    >
      {/* 标签栏（替代原有的标题栏 + 侧边栏） */}
      <TabBar />

      {/* 主内容区 */}
      <main className="flex-1 overflow-hidden relative">
        <ErrorBoundary name="MainContent">
          <Suspense fallback={<GlassLoadingFallback />}>
            <AnimatePresence mode="wait">
              <Routes>
                <Route
                  path="/"
                  element={
                    <motion.div
                      key="home"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <HomePage />
                    </motion.div>
                  }
                />
                <Route
                  path="/tools"
                  element={
                    <motion.div
                      key="tools"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <ToolsPage />
                    </motion.div>
                  }
                />
                <Route
                  path="/settings/*"
                  element={
                    <motion.div
                      key="settings"
                      variants={pageVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      <SettingsPage />
                    </motion.div>
                  }
                />
              </Routes>
            </AnimatePresence>
          </Suspense>
        </ErrorBoundary>

        {/* 更新横幅（固定在内容区顶部） */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <UpdateBanner onNavigate={() => {}} />
        </div>
      </main>
    </div>
  );
}
