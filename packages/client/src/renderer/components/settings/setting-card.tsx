/**
 * SettingCard - 设置卡片
 * 悬停升起 + 边框变化 + 阴影光晕
 */

import { useState } from 'react';
import type { ElementType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { transitions, elevations } from '@/theme/animations';

interface SettingCardProps {
  /** 卡片标题 */
  title: string;
  /** 标题图标 */
  icon?: ElementType;
  /** 子内容 */
  children: ReactNode;
  /** 是否禁用悬停动画 */
  disableHover?: boolean;
}

export function SettingCard({
  title,
  icon: Icon,
  children,
  disableHover = false,
}: SettingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const showHover = !disableHover && isHovered;

  return (
    <Paper
      elevation={0}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        p: 3,
        borderRadius: 3,
        // 卡片背景：在下沉的内容区上浮起
        bgcolor: isDark ? alpha('#fff', 0.03) : '#ffffff',
        border: '1px solid',
        borderColor: showHover
          ? isDark
            ? alpha('#fff', 0.12)
            : alpha(theme.palette.primary.main, 0.2)
          : isDark
            ? alpha('#fff', 0.06)
            : alpha('#000', 0.08),
        // 悬停升起
        transform: showHover ? 'translateY(-2px)' : 'translateY(0)',
        // 光晕效果
        boxShadow: showHover
          ? isDark
            ? elevations.card.hover.dark
            : elevations.card.hover.light
          : isDark
            ? elevations.card.idle.dark
            : '0 1px 4px rgba(0,0,0,0.06)',
        transition: transitions.hover,
      }}
    >
      {/* 标题栏 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2.5,
        }}
      >
        {Icon && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'primary.main',
            }}
          >
            <Icon size={18} />
          </Box>
        )}
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
      </Box>

      {/* 内容区 */}
      <Box>{children}</Box>
    </Paper>
  );
}
