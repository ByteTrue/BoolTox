/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 快捷面板独立入口
 * 不加载完整的 Context Providers，只包含必要的
 */

import './lib/setup-renderer-console-logging';
import React from 'react';
import ReactDOM from 'react-dom/client';

import './renderer/globals.css';
import RootLayout from './renderer/layout';
import { QuickPanel } from './renderer/components/quick-panel';
import { ErrorBoundary } from './renderer/components/error-boundary';

// 快捷面板只需要基础 Provider
import { ToastProvider } from './renderer/contexts/toast-context';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary name="Quick Panel" showHomeButton={false}>
      <ToastProvider>
        <RootLayout>
          <QuickPanel />
        </RootLayout>
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
