/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { TabBar } from '../components/tab-bar';
import { useToolTabs } from '../contexts/tool-tab-context';
import { ToolWebView } from '../components/tool-webview';

/**
 * 分离窗口组件
 * 显示指定 windowId 的标签页
 */
export function DetachedWindowPage() {
  const { windowId } = useParams<{ windowId: string }>();
  const { toolTabs, getActiveToolTabId, activateToolTab, updateToolTab } = useToolTabs();
  const [hasEverHadTabs, setHasEverHadTabs] = useState(false);
  const closeRequestedRef = useRef(false);

  // 过滤出属于当前窗口的标签
  const windowTabs = toolTabs.filter(tab => tab.windowId === windowId);
  const windowActiveToolTabId = windowId ? getActiveToolTabId(windowId) : null;
  const hasActiveTab = windowActiveToolTabId !== null && windowTabs.some(tab => tab.id === windowActiveToolTabId);
  const activeTabId = hasActiveTab ? windowActiveToolTabId : windowTabs[0]?.id ?? null;

  useEffect(() => {
    if (!hasEverHadTabs && windowTabs.length > 0) {
      setHasEverHadTabs(true);
    }
  }, [hasEverHadTabs, windowTabs.length]);

  useEffect(() => {
    if (!windowId || !activeTabId) return;
    if (windowActiveToolTabId !== activeTabId) {
      activateToolTab(activeTabId, windowId);
    }
  }, [activateToolTab, activeTabId, windowActiveToolTabId, windowId]);

  useEffect(() => {
    if (!windowId) return;
    if (windowTabs.length > 0) return;
    if (closeRequestedRef.current) return;

    let isMounted = true;

    // 1) 刚打开窗口时可能还在同步状态，给一点缓冲；2) 一旦窗口曾经有过标签，变空就直接关。
    const delay = hasEverHadTabs ? 0 : 5000;

    const timer = setTimeout(() => {
      if (!isMounted || closeRequestedRef.current) return;
      closeRequestedRef.current = true;
      window.ipc.invoke('window:close-detached', { windowId, reason: 'empty' }).catch((err: Error) => {
        if (isMounted) {
          closeRequestedRef.current = false;
        }
        console.warn('[DetachedWindowPage] 关闭空窗口失败:', err);
      });
    }, delay);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [hasEverHadTabs, windowId, windowTabs.length]);

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
      <TabBar windowId={windowId} />

      {/* 工具 webview 区域 */}
      <Box component="main" sx={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {windowTabs.map(tab => (
          <Box key={tab.id} sx={{ display: tab.id === activeTabId ? 'block' : 'none', height: '100%' }}>
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

        {/* 如果窗口没有标签，显示空状态 */}
        {windowTabs.length === 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography color="text.secondary">
                {hasEverHadTabs ? '窗口已无标签页，即将关闭…' : '正在载入标签页…'}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
