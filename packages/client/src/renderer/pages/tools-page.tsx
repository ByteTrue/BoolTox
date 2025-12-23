/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleCenter } from '../components/module-center';

/**
 * 工具页（全屏网格布局）
 * 直接复用现有的 ModuleCenter 组件
 */
export function ToolsPage() {
  const location = useLocation();
  const { refreshAvailablePlugins } = useModulePlatform();

  // 监听路由变化，从添加工具源页面返回时刷新
  useEffect(() => {
    if (location.pathname === '/tools') {
      refreshAvailablePlugins();
    }
  }, [location.pathname, refreshAvailablePlugins]);

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <ModuleCenter />
    </Box>
  );
}
