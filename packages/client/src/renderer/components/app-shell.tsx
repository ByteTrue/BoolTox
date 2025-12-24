/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { TabBar } from './tab-bar';
import { ErrorBoundary } from './error-boundary';
import { UpdateBanner } from './ui/update-banner';
import { ToolTabProvider, useToolTabs } from '../contexts/tool-tab-context';
import { ToolWebView } from './tool-webview';
import { CommandPalette } from './command-palette';
import { PageTransition } from './motion';

// 路由懒加载
const HomePage = lazy(() => import('../pages/home-page').then(m => ({ default: m.HomePage })));
const ToolsPage = lazy(() => import('../pages/tools-page').then(m => ({ default: m.ToolsPage })));
const AddToolSourcePage = lazy(() =>
  import('../pages/add-tool-source-page').then(m => ({ default: m.AddToolSourcePage }))
);
const ToolSourcesPage = lazy(() =>
  import('../pages/tool-sources-page').then(m => ({ default: m.ToolSourcesPage }))
);
const SettingsPage = lazy(() =>
  import('../pages/settings-page').then(m => ({ default: m.SettingsPage }))
);
const DetachedWindowPage = lazy(() =>
  import('../pages/detached-window-page').then(m => ({ default: m.DetachedWindowPage }))
);

/**
 * 页面加载占位
 */
function PageLoading() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CircularProgress />
    </Box>
  );
}

/**
 * AppShell 内部实现（需要在 ToolTabProvider 内）
 */
function AppShellContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toolTabs, activeToolTabId, updateToolTab } = useToolTabs();
  const isDetachedWindowRoute = location.pathname.startsWith('/detached/');

  // 监听快捷面板的导航事件
  useEffect(() => {
    const handleNavigate = (...args: unknown[]) => {
      const route = args[0];
      if (typeof route === 'string') {
        navigate(route);
      }
    };

    window.ipc?.on('navigate-to', handleNavigate);

    return () => {
      window.ipc?.off('navigate-to', handleNavigate);
    };
  }, [navigate]);

  if (isDetachedWindowRoute) {
    return (
      <ErrorBoundary name="DetachedWindow">
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/detached/:windowId" element={<DetachedWindowPage />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* 标签栏 */}
      <TabBar />

      {/* 主内容区 */}
      <Box
        component="main"
        sx={{
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 路由内容区（当没有激活工具标签时显示） */}
        <Box sx={{ height: '100%', display: activeToolTabId ? 'none' : 'block' }}>
          <ErrorBoundary name="MainContent">
            <Suspense fallback={<PageLoading />}>
              <Routes>
                <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
                <Route path="/tools" element={<PageTransition><ToolsPage /></PageTransition>} />
                <Route
                  path="/tools/add-source"
                  element={<PageTransition><AddToolSourcePage /></PageTransition>}
                />
                <Route
                  path="/tools/sources"
                  element={<PageTransition><ToolSourcesPage /></PageTransition>}
                />
                <Route
                  path="/settings/*"
                  element={<PageTransition><SettingsPage /></PageTransition>}
                />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Box>

        {/* 工具 webview 区域（当有激活工具标签时显示） */}
        <Box sx={{ height: '100%', display: activeToolTabId ? 'block' : 'none' }}>
          {toolTabs
            .filter(tab => tab.windowId === 'main')
            .map(tab => (
              <Box
                key={tab.id}
                sx={{ height: '100%', display: tab.id === activeToolTabId ? 'block' : 'none' }}
              >
                <ToolWebView
                  url={tab.url}
                  toolId={tab.toolId}
                  onTitleUpdate={title => updateToolTab(tab.id, { label: title })}
                  onNavigate={(url, canGoBack, canGoForward) =>
                    updateToolTab(tab.id, { url, canGoBack, canGoForward })
                  }
                  onLoadingChange={isLoading => updateToolTab(tab.id, { isLoading })}
                />
              </Box>
            ))}
        </Box>

        {/* 更新横幅（固定在内容区顶部） */}
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
          }}
        >
          <UpdateBanner onNavigate={() => {}} />
        </Box>
      </Box>
    </Box>
  );
}

/**
 * AppShell 组件（包裹 ToolTabProvider）
 */
export function AppShell() {
  return (
    <ToolTabProvider>
      <AppShellContent />
      <CommandPalette />
    </ToolTabProvider>
  );
}
