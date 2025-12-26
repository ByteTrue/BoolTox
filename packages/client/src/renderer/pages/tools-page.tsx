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
 * 工具页 - 极简设计
 */
export function ToolsPage() {
  const location = useLocation();
  const { refreshAvailableTools } = useModulePlatform();

  useEffect(() => {
    if (location.pathname === '/tools') {
      refreshAvailableTools();
    }
  }, [location.pathname, refreshAvailableTools]);

  return (
    <Box sx={{ height: '100%', width: '100%', overflow: 'hidden' }}>
      <ModuleCenter />
    </Box>
  );
}
