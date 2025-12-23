/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  recommendations?: ReactNode;
}

/**
 * 空状态组件 - 用于引导用户操作
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  recommendations,
}: EmptyStateProps) {
  return (
    <Fade in timeout={500}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 8,
          px: 3,
          textAlign: 'center',
        }}
      >
        {/* 图标 */}
        {icon && (
          <Box sx={{ mb: 3, color: 'text.disabled' }}>
            {icon}
          </Box>
        )}

        {/* 标题 */}
        <Typography variant="h6" fontWeight={600} gutterBottom>
          {title}
        </Typography>

        {/* 描述 */}
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400, mb: 4 }}
          >
            {description}
          </Typography>
        )}

        {/* 操作按钮 */}
        {actions && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}>
            {actions}
          </Box>
        )}

        {/* 推荐内容 */}
        {recommendations && (
          <Box sx={{ mt: 6, width: '100%', maxWidth: 900 }}>
            {recommendations}
          </Box>
        )}
      </Box>
    </Fade>
  );
}
