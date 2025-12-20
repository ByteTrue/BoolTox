/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useRef, useState } from 'react';
import { useTheme } from './theme-provider';
import { AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

interface ToolWebViewProps {
  url: string;
  toolId: string;
  onTitleUpdate?: (title: string) => void;
  onNavigate?: (url: string, canGoBack: boolean, canGoForward: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * 工具 WebView 组件
 * 使用 Electron 的 webview 标签嵌入外部工具前端
 */
export function ToolWebView({
  url,
  toolId,
  onTitleUpdate,
  onNavigate,
  onLoadingChange,
}: ToolWebViewProps) {
  const webviewRef = useRef<Electron.WebviewTag>(null);
  const [crashed, setCrashed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    // 监听标题变化
    const handleTitleUpdate = (e: Event) => {
      const { title } = e as { title?: string };
      onTitleUpdate?.(title ?? '');
    };

    // 监听导航事件
    const handleNavigate = () => {
      const currentUrl = webview.getURL();
      onNavigate?.(currentUrl, webview.canGoBack(), webview.canGoForward());
    };

    // 监听加载状态
    const handleLoadStart = () => {
      onLoadingChange?.(true);
      setError(null);
    };

    const handleLoadStop = () => {
      onLoadingChange?.(false);
    };

    // 监听加载失败
    const handleLoadError = (e: Event) => {
      const { errorDescription } = e as { errorDescription?: string };
      console.error('[ToolWebView] 加载失败:', errorDescription);
      setError(`加载失败: ${errorDescription ?? 'Unknown error'}`);
      onLoadingChange?.(false);
    };

    // 监听崩溃
    const handleCrashed = () => {
      console.error('[ToolWebView] WebView 崩溃:', toolId);
      setCrashed(true);
      onLoadingChange?.(false);
    };

    // 监听新窗口请求（target="_blank" 等）
    const handleNewWindow = (e: Event) => {
      const { url: newUrl } = e as { url?: string };
      if (!newUrl) return;
      window.ipc.invoke('shell:openExternal', newUrl);
    };

    // 绑定事件监听器
    webview.addEventListener('page-title-updated', handleTitleUpdate);
    webview.addEventListener('did-navigate', handleNavigate);
    webview.addEventListener('did-navigate-in-page', handleNavigate);
    webview.addEventListener('did-start-loading', handleLoadStart);
    webview.addEventListener('did-stop-loading', handleLoadStop);
    webview.addEventListener('did-fail-load', handleLoadError);
    webview.addEventListener('crashed', handleCrashed);
    webview.addEventListener('new-window', handleNewWindow);

    return () => {
      webview.removeEventListener('page-title-updated', handleTitleUpdate);
      webview.removeEventListener('did-navigate', handleNavigate);
      webview.removeEventListener('did-navigate-in-page', handleNavigate);
      webview.removeEventListener('did-start-loading', handleLoadStart);
      webview.removeEventListener('did-stop-loading', handleLoadStop);
      webview.removeEventListener('did-fail-load', handleLoadError);
      webview.removeEventListener('crashed', handleCrashed);
      webview.removeEventListener('new-window', handleNewWindow);
    };
  }, [toolId, onTitleUpdate, onNavigate, onLoadingChange]);

  // 重新加载
  const handleReload = () => {
    const webview = webviewRef.current;
    if (webview) {
      setCrashed(false);
      setError(null);
      webview.reload();
    }
  };

  // 在系统浏览器中打开
  const handleOpenInBrowser = () => {
    const webview = webviewRef.current;
    if (webview) {
      const currentUrl = webview.getURL();
      window.ipc.invoke('shell:openExternal', currentUrl);
    }
  };

  // 显示崩溃提示
  if (crashed) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full gap-4 ${
          isDark ? 'bg-slate-900' : 'bg-gray-50'
        }`}
      >
        <AlertCircle size={48} className="text-red-500" />
        <p className={`text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>工具页面已崩溃</p>
        <div className="flex gap-2">
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            重新加载
          </button>
          <button
            onClick={handleOpenInBrowser}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isDark
                ? 'bg-white/10 text-white hover:bg-white/20'
                : 'bg-gray-200 text-slate-700 hover:bg-gray-300'
            }`}
          >
            <ExternalLink size={16} />
            在浏览器中打开
          </button>
        </div>
      </div>
    );
  }

  // 显示错误提示
  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full gap-4 ${
          isDark ? 'bg-slate-900' : 'bg-gray-50'
        }`}
      >
        <AlertCircle size={48} className="text-orange-500" />
        <p className={`text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{error}</p>
        <div className="flex gap-2">
          <button
            onClick={handleReload}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <webview
      ref={webviewRef}
      src={url}
      className="w-full h-full"
      // 安全配置：禁用 Node 集成，启用上下文隔离
      nodeintegration={false}
      webpreferences="contextIsolation=true,enableRemoteModule=false"
      // 允许弹出窗口（由 new-window 事件处理）
      allowpopups={true}
    />
  );
}
