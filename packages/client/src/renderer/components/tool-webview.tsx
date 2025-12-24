/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <AlertCircle size={48} color="var(--mui-palette-error-main)" />
        <Typography variant="h6">工具页面已崩溃</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            onClick={handleReload}
            variant="contained"
            startIcon={<RefreshCw size={16} />}
          >
            重新加载
          </Button>
          <Button
            onClick={handleOpenInBrowser}
            variant="outlined"
            startIcon={<ExternalLink size={16} />}
          >
            在浏览器中打开
          </Button>
        </Stack>
      </Box>
    );
  }

  // 显示错误提示
  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 2,
          bgcolor: 'background.default',
        }}
      >
        <AlertCircle size={48} color="var(--mui-palette-warning-main)" />
        <Typography variant="h6">{error}</Typography>
        <Button
          onClick={handleReload}
          variant="contained"
          startIcon={<RefreshCw size={16} />}
        >
          重试
        </Button>
      </Box>
    );
  }

  return (
    <webview
      ref={webviewRef as React.RefObject<Electron.WebviewTag>}
      src={url}
      style={{ width: '100%', height: '100%' }}
      // 安全配置：禁用 Node 集成，启用上下文隔离
      // nodeintegration 默认为 false，不需要显式设置
      webpreferences="contextIsolation=true,enableRemoteModule=false"
      // 允许弹出窗口（由 new-window 事件处理）
      // @ts-expect-error webview allowpopups 需要字符串
      allowpopups="true"
    />
  );
}
