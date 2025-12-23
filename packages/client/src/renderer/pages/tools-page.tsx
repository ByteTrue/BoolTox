/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useModulePlatform } from '@/contexts/module-context';
import { ModuleCenterV3 } from '../components/module-center/index-v3';

/**
 * 工具页 - V3 极简设计
 */
export function ToolsPage() {
  const location = useLocation();
  const { refreshAvailablePlugins } = useModulePlatform();

  useEffect(() => {
    if (location.pathname === '/tools') {
      refreshAvailablePlugins();
    }
  }, [location.pathname, refreshAvailablePlugins]);

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <ModuleCenterV3 />
    </Box>
  );
}
