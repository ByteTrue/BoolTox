/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { TabBar } from './tab-bar';
import { useTheme } from './theme-provider';
import { GlassLoadingFallback } from './ui/glass-loading-fallback';
import { ErrorBoundary } from './error-boundary';
import { UpdateBanner } from './ui/update-banner';
import { ToolTabProvider, useToolTabs } from '../contexts/tool-tab-context';
import { ToolWebView } from './tool-webview';

// 路由懒加载
const HomePage = lazy(() => import('../pages/home-page').then(m => ({ default: m.HomePage })));
const ToolsPage = lazy(() => import('../pages/tools-page').then(m => ({ default: m.ToolsPage })));
const AddToolSourcePage = lazy(() => import('../pages/add-tool-source-page').then(m => ({ default: m.AddToolSourcePage })));
const ToolSourcesPage = lazy(() => import('../pages/tool-sources-page').then(m => ({ default: m.ToolSourcesPage })));
const SettingsPage = lazy(() => import('../pages/settings-page').then(m => ({ default: m.SettingsPage })));

// 页面切换动画
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
};

/**
 * AppShell 内部实现（需要在 ToolTabProvider 内）
 */
function AppShellContent() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { toolTabs, activeToolTabId, updateToolTab } = useToolTabs();

  // 监听快捷面板的导航事件
  useEffect(() => {
    const handleNavigate = (route: string) => {
      console.log('[AppShell] 收到导航请求:', route);
      navigate(route);
    };

    window.ipc?.on('navigate-to', handleNavigate);

    return () => {
      window.ipc?.off('navigate-to', handleNavigate);
    };
  }, [navigate]);

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
        {/* 路由内容区（当没有激活工具标签时显示） */}
        <div className={activeToolTabId ? 'hidden' : 'h-full'}>
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
                    path="/tools/add-source"
                    element={
                      <motion.div
                        key="add-source"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <AddToolSourcePage />
                      </motion.div>
                    }
                  />
                  <Route
                    path="/tools/sources"
                    element={
                      <motion.div
                        key="tool-sources"
                        variants={pageVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        transition={{ duration: 0.2 }}
                        className="h-full"
                      >
                        <ToolSourcesPage />
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
        </div>

        {/* 工具 webview 区域（当有激活工具标签时显示） */}
        <div className={activeToolTabId ? 'h-full' : 'hidden'}>
          {toolTabs.map(tab => (
            <div
              key={tab.id}
              className={tab.id === activeToolTabId ? 'h-full' : 'hidden'}
            >
              <ToolWebView
                url={tab.url}
                toolId={tab.toolId}
                onTitleUpdate={(title) => updateToolTab(tab.id, { label: title })}
                onNavigate={(url, canGoBack, canGoForward) =>
                  updateToolTab(tab.id, { url, canGoBack, canGoForward })
                }
                onLoadingChange={(isLoading) =>
                  updateToolTab(tab.id, { isLoading })
                }
              />
            </div>
          ))}
        </div>

        {/* 更新横幅（固定在内容区顶部） */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50">
          <UpdateBanner onNavigate={() => {}} />
        </div>
      </main>
    </div>
  );
}

/**
 * AppShell 组件（包裹 ToolTabProvider）
 */
export function AppShell() {
  return (
    <ToolTabProvider>
      <AppShellContent />
    </ToolTabProvider>
  );
}
