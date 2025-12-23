/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Fade from '@mui/material/Fade';
import { SettingsPanel } from '../components/settings-panel';
import { DeveloperSettings } from './settings/developer';
import { AboutSettings } from './settings/about';

// 设置菜单项
const SETTINGS_SECTIONS = [
  { key: 'general', label: '通用设置', path: '/settings/general' },
  { key: 'about', label: '关于', path: '/settings/about' },
  { key: 'developer', label: '开发者模式', path: '/settings/developer' },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 当前激活的设置项（默认通用设置）
  const activeSection =
    SETTINGS_SECTIONS.find(section => section.path === location.pathname)?.key || 'general';

  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      {/* 左侧侧边栏 */}
      <Box
        component="aside"
        sx={{
          width: 224,
          borderRight: 1,
          borderColor: 'divider',
          p: 2,
          overflow: 'auto',
          bgcolor: 'background.paper',
        }}
      >
        <List disablePadding>
          {SETTINGS_SECTIONS.map(section => {
            const isActive = activeSection === section.key;
            return (
              <ListItemButton
                key={section.key}
                onClick={() => navigate(section.path)}
                selected={isActive}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&.Mui-selected': {
                    bgcolor: 'action.selected',
                  },
                }}
              >
                <ListItemText
                  primary={section.label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 400,
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Box>

      {/* 右侧内容区 */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 4 }}>
        <Fade in key={activeSection}>
          <Box>
            <Routes>
              <Route path="/developer" element={<DeveloperSettings />} />
              <Route path="/about" element={<AboutSettings />} />
              <Route path="/*" element={<SettingsPanel />} />
            </Routes>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
