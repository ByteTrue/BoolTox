/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode, RefObject } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement>;
}

/**
 * 页面头部组件
 */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        px: 4,
        pt: 4,
        pb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 3 }}>
        {/* 左侧: 标题区 */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" fontWeight={600}>
            {title}
          </Typography>

          {subtitle && (
            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        {/* 右侧: 操作区 */}
        {actions && <Box sx={{ flexShrink: 0 }}>{actions}</Box>}
      </Box>
    </Box>
  );
}

/**
 * 工具栏 - 滚动后显示小标题
 */
interface ToolbarProps {
  title?: string;
  show: boolean;
  children?: ReactNode;
}

export function Toolbar({ title, show, children }: ToolbarProps) {
  return (
    <Fade in={show}>
      <Box
        sx={{
          height: 48,
          px: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        {title && (
          <Typography variant="body2" fontWeight={600}>
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Fade>
  );
}
