/**
 * SettingSidebar - Linear/Raycast 风格设置导航
 * 复用 ModuleSidebar 的视觉语言
 */

import type { ElementType } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { alpha, useTheme } from '@mui/material/styles';
import { transitions, sidebarBg } from '@/theme/animations';

// ============================================================
// NavItem 组件
// ============================================================

interface NavItemProps {
  icon: ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

function NavItem({ icon: Icon, label, active, onClick }: NavItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1,
        mx: 0.5,
        borderRadius: 1.5,
        cursor: 'pointer',
        color: active ? 'text.primary' : 'text.secondary',
        bgcolor: active
          ? isDark
            ? alpha('#fff', 0.06)
            : alpha(theme.palette.primary.main, 0.08)
          : 'transparent',
        transition: transitions.hover,
        '&:hover': {
          bgcolor: isDark ? alpha('#fff', 0.06) : alpha(theme.palette.primary.main, 0.06),
          color: 'text.primary',
        },
        // Linear 风格左侧 accent bar
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: '50%',
          transform: active ? 'translateY(-50%) scaleY(1)' : 'translateY(-50%) scaleY(0)',
          width: 3,
          height: 16,
          borderRadius: 1.5,
          bgcolor: 'primary.main',
          transition: transitions.accent,
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: active ? 'primary.main' : 'inherit',
          transition: transitions.color,
        }}
      >
        <Icon size={18} />
      </Box>
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: active ? 600 : 500,
          fontSize: '0.8125rem',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}

// ============================================================
// SettingSidebar 主组件
// ============================================================

export interface SettingSection {
  key: string;
  label: string;
  icon: ElementType;
  path: string;
}

interface SettingSidebarProps {
  sections: SettingSection[];
  activeSection: string;
  onSectionChange: (section: SettingSection) => void;
}

export function SettingSidebar({ sections, activeSection, onSectionChange }: SettingSidebarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="aside"
      sx={{
        width: 220,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: isDark ? sidebarBg.dark : sidebarBg.light,
        px: 1.5,
        py: 2,
      }}
    >
      {/* 标题 */}
      <Typography
        variant="overline"
        sx={{
          px: 1,
          pb: 1.5,
          display: 'block',
          color: 'text.tertiary',
          fontWeight: 600,
          fontSize: '0.6875rem',
          letterSpacing: '0.05em',
        }}
      >
        设置
      </Typography>

      {/* 导航项 */}
      <Stack spacing={0.25}>
        {sections.map(section => (
          <NavItem
            key={section.key}
            icon={section.icon}
            label={section.label}
            active={activeSection === section.key}
            onClick={() => onSectionChange(section)}
          />
        ))}
      </Stack>
    </Box>
  );
}
