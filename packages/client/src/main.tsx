/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import './renderer/lib/setup-renderer-console-logging';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Import styles
import './renderer/globals.css';

// Import the main layout
import RootLayout from './renderer/layout';

// Import the new App Shell
import { AppShell } from './renderer/components/app-shell';
import { QuickPanel } from './renderer/components/quick-panel';

// Import only the contexts we need
import { ModuleProvider } from './renderer/contexts/module-context';
import { SpotlightProvider } from './renderer/contexts/spotlight-context';
import { ToastProvider } from './renderer/contexts/toast-context';
import { UpdateProvider } from './renderer/contexts/update-context';
import { ActivityFeedProvider } from './renderer/contexts/activity-feed-context';
import { CommandPaletteProvider } from './renderer/contexts/command-palette-context';
// import { initErrorTracking } from './renderer/lib/error-tracking'; // 暂时禁用，等待日志系统兼容
import { ErrorBoundary } from './renderer/components/error-boundary';
import { profiler } from './renderer/lib/performance-profiler';
import type { MemoryMonitor, FPSMonitor } from './renderer/lib/performance-profiler';

type PerfWindow = Window & {
  __APP_START_TIME__?: number;
  profiler?: typeof profiler;
  memoryMonitor?: MemoryMonitor;
  fpsMonitor?: FPSMonitor;
  __perf__?: {
    profiler: typeof profiler;
    memoryMonitor: MemoryMonitor;
    fpsMonitor: FPSMonitor;
  };
};

// ========== Phase 1: Performance Monitoring ==========
const scriptStartTime = performance.now();
const perfWindow = window as PerfWindow;

if (!perfWindow.__APP_START_TIME__) {
  perfWindow.__APP_START_TIME__ = scriptStartTime;
}

profiler.mark('app-startup-begin');
// initErrorTracking(); // 暂时禁用
profiler.mark('react-render-begin');

// 检测是否为快捷面板窗口
const isQuickPanel = window.location.hash === '#/quick-panel';

// 渲染
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary name={isQuickPanel ? 'Quick Panel' : 'App Root'} showHomeButton={false}>
      {isQuickPanel ? (
        // 快捷面板：最小化的 Provider 树
        <RootLayout>
          <QuickPanel />
        </RootLayout>
      ) : (
        // 主窗口：完整的 Provider 树
        <BrowserRouter>
          <ToastProvider>
            <SpotlightProvider>
              <ModuleProvider>
                <UpdateProvider>
                  <ActivityFeedProvider>
                    <CommandPaletteProvider>
                      <RootLayout>
                        <AppShell />
                      </RootLayout>
                    </CommandPaletteProvider>
                  </ActivityFeedProvider>
                </UpdateProvider>
              </ModuleProvider>
            </SpotlightProvider>
          </ToastProvider>
        </BrowserRouter>
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);

// 标记 React 渲染完成
profiler.mark('react-render-end');
profiler.measure('React Initial Render', 'react-render-begin', 'react-render-end');

// 等待首屏渲染完成
requestAnimationFrame(async () => {
  profiler.mark('app-startup-end');
  profiler.measure('App Startup Time', 'app-startup-begin', 'app-startup-end');

  console.warn('%c🚀 BoolTox Performance Report (New Architecture)', 'font-size: 16px; font-weight: bold; color: rgb(101, 187, 233);');
  profiler.report('Phase 1: Startup Performance');

  // 开发环境：启动内存和 FPS 监控
  if (import.meta.env.DEV) {
    const { memoryMonitor, fpsMonitor } = await import('./renderer/lib/performance-profiler');

    console.warn('\n🔧 Development Mode: Performance monitoring enabled');
    console.warn('📋 Available commands:');
    console.warn('  - profiler.report()         // 查看启动性能报告');
    console.warn('  - memoryMonitor.start()     // 开始内存监控');
    console.warn('  - memoryMonitor.stop()      // 停止内存监控');
    console.warn('  - memoryMonitor.report()    // 查看内存报告');
    console.warn('  - fpsMonitor.start((fps) => console.log(`FPS: ${fps}`))');
    console.warn('  - fpsMonitor.stop()');
    console.warn('  - fpsMonitor.getFPS()       // 获取当前 FPS\n');

    perfWindow.profiler = profiler;
    perfWindow.memoryMonitor = memoryMonitor;
    perfWindow.fpsMonitor = fpsMonitor;

    perfWindow.__perf__ = {
      profiler,
      memoryMonitor,
      fpsMonitor,
    };
  }
});
