/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * SettingsPage - 设置页面主容器
 * 使用 Linear/Raycast 风格的侧边栏导航
 */

import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import { useTheme } from '@mui/material/styles';
import { Settings, Info, Code } from 'lucide-react';
import { SettingSidebar, type SettingSection } from '@/components/settings';
import { sidebarBg, contentBg } from '@/theme/animations';
import { GeneralSettings } from './settings/general';
import { DeveloperSettings } from './settings/developer';
import { AboutSettings } from './settings/about';

// 设置菜单项
const SETTINGS_SECTIONS: SettingSection[] = [
  { key: 'general', label: '通用设置', path: '/settings/general', icon: Settings },
  { key: 'about', label: '关于', path: '/settings/about', icon: Info },
  { key: 'developer', label: '开发者模式', path: '/settings/developer', icon: Code },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 当前激活的设置项（默认通用设置）
  const activeSection =
    SETTINGS_SECTIONS.find(section => section.path === location.pathname)?.key || 'general';

  const handleSectionChange = (section: SettingSection) => {
    navigate(section.path);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
        // 侧边栏层（中间层）
        bgcolor: isDark ? sidebarBg.dark : sidebarBg.light,
      }}
    >
      {/* 左侧侧边栏 */}
      <SettingSidebar
        sections={SETTINGS_SECTIONS}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />

      {/* 右侧内容区 - 下沉层（最暗） */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 4,
          // 内容区下沉：比侧边栏更暗
          bgcolor: isDark ? contentBg.dark : contentBg.light,
          // 内阴影增强下沉感
          boxShadow: isDark
            ? 'inset 0 2px 8px rgba(0,0,0,0.4)'
            : 'inset 0 2px 6px rgba(0,0,0,0.06)',
          // 圆角让边缘更柔和
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
        }}
      >
        <Fade in key={activeSection}>
          <Box>
            <Routes>
              <Route path="/developer" element={<DeveloperSettings />} />
              <Route path="/about" element={<AboutSettings />} />
              <Route path="/*" element={<GeneralSettings />} />
            </Routes>
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
