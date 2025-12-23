/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import Slide from '@mui/material/Slide';

interface BatchAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

interface BatchActionBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClear?: () => void;
}

/**
 * 批量操作栏组件 - 选中多项时显示
 * 从底部滑入,提供批量操作快捷方式
 */
export function BatchActionBar({ selectedCount, actions, onClear }: BatchActionBarProps) {
  const isVisible = selectedCount > 0;

  return (
    <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 50,
          borderRadius: 3,
          minWidth: 400,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, px: 3, py: 2 }}>
          {/* 选中数量 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={selectedCount}
              size="small"
              color="primary"
              sx={{ fontWeight: 600 }}
            />
            <Typography variant="body2" color="text.secondary">
              已选中
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem />

          {/* 操作按钮组 */}
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            {actions.map((action, index) => {
              const colorMap = {
                default: 'inherit' as const,
                primary: 'primary' as const,
                danger: 'error' as const,
              };

              return (
                <Button
                  key={index}
                  size="small"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  color={colorMap[action.variant || 'default']}
                  variant={action.variant === 'primary' ? 'contained' : 'outlined'}
                  startIcon={action.icon}
                >
                  {action.label}
                </Button>
              );
            })}
          </Box>

          {/* 清除选择按钮 */}
          {onClear && (
            <>
              <Divider orientation="vertical" flexItem />
              <Button
                size="small"
                onClick={onClear}
                color="inherit"
                sx={{ color: 'text.secondary' }}
              >
                清除
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Slide>
  );
}
