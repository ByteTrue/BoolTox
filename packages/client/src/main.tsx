import React from 'react';
import ReactDOM from 'react-dom/client';

// Import styles
import './renderer/globals.css';

// Import the main layout and page
import RootLayout from './renderer/layout';
import Page from './renderer/page';

// Import only the contexts we need
import { ModuleProvider } from './renderer/contexts/module-context';
import { SpotlightProvider } from './renderer/contexts/spotlight-context';
import { ToastProvider } from './renderer/contexts/toast-context';
import { UpdateProvider } from './renderer/contexts/update-context';
import { ActivityFeedProvider } from './renderer/contexts/activity-feed-context';
import { initErrorTracking } from './renderer/lib/error-tracking';
import { ErrorBoundary } from './renderer/components/error-boundary';
import { profiler } from './renderer/lib/performance-profiler';

// ========== Phase 1: Performance Monitoring ==========
// 记录脚本开始执行时间
const scriptStartTime = performance.now();

// 标记应用启动开始（如果 HTML 中有全局标记，使用它；否则使用脚本开始时间）
if (!(window as any).__APP_START_TIME__) {
  (window as any).__APP_START_TIME__ = scriptStartTime;
}

profiler.mark('app-startup-begin');

initErrorTracking();

// 标记 React 渲染开始
profiler.mark('react-render-begin');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary name="App Root" showHomeButton={false}>
      <ToastProvider>
        <SpotlightProvider>
          <ModuleProvider>
            <UpdateProvider>
              <ActivityFeedProvider>
                <RootLayout>
                  <Page />
                </RootLayout>
              </ActivityFeedProvider>
            </UpdateProvider>
          </ModuleProvider>
        </SpotlightProvider>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

// 标记 React 渲染完成
profiler.mark('react-render-end');
profiler.measure('React Initial Render', 'react-render-begin', 'react-render-end');

// 等待首屏渲染完成
requestAnimationFrame(async () => {
  profiler.mark('app-startup-end');
  const startupTime = profiler.measure('App Startup Time', 'app-startup-begin', 'app-startup-end');
  
  // 输出性能报告（使用品牌蓝色）
  console.log('%c🚀 BoolTox Performance Report', 'font-size: 16px; font-weight: bold; color: rgb(101, 187, 233);');
  profiler.report('Phase 1: Startup Performance');
  
  // 开发环境：启动内存和 FPS 监控
  if (import.meta.env.DEV) {
    const { memoryMonitor, fpsMonitor } = await import('./renderer/lib/performance-profiler');
    
    console.log('\n🔧 Development Mode: Performance monitoring enabled');
    console.log('📋 Available commands:');
    console.log('  - profiler.report()         // 查看启动性能报告');
    console.log('  - memoryMonitor.start()     // 开始内存监控');
    console.log('  - memoryMonitor.stop()      // 停止内存监控');
    console.log('  - memoryMonitor.report()    // 查看内存报告');
    console.log('  - fpsMonitor.start((fps) => console.log(`FPS: ${fps}`))');
    console.log('  - fpsMonitor.stop()');
    console.log('  - fpsMonitor.getFPS()       // 获取当前 FPS\n');
    
    // 暴露到全局（方便调试）
    (window as any).profiler = profiler;
    (window as any).memoryMonitor = memoryMonitor;
    (window as any).fpsMonitor = fpsMonitor;
    
    // 保留完整对象引用
    (window as any).__perf__ = {
      profiler,
      memoryMonitor,
      fpsMonitor,
    };
  }
});
