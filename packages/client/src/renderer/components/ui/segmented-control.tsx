/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Badge from '@mui/material/Badge';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_MAP = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

/**
 * 分段控制器组件 - 用于多选项切换
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: T | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      size={SIZE_MAP[size]}
      sx={{
        bgcolor: 'action.hover',
        borderRadius: 3,
        p: 0.5,
        '& .MuiToggleButtonGroup-grouped': {
          border: 0,
          borderRadius: 2,
          mx: 0.25,
          '&.Mui-selected': {
            bgcolor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              bgcolor: 'background.paper',
            },
          },
        },
      }}
    >
      {options.map(option => (
        <ToggleButton
          key={option.value}
          value={option.value}
          sx={{
            px: size === 'sm' ? 1.5 : size === 'lg' ? 2.5 : 2,
            py: size === 'sm' ? 0.5 : size === 'lg' ? 1 : 0.75,
            textTransform: 'none',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {option.icon}
            <Typography
              variant={size === 'sm' ? 'caption' : 'body2'}
              fontWeight={600}
            >
              {option.label}
            </Typography>
            {option.badge !== undefined && (
              <Badge
                badgeContent={option.badge}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    position: 'static',
                    transform: 'none',
                    fontSize: '0.7rem',
                    minWidth: 18,
                    height: 18,
                  },
                }}
              />
            )}
          </Box>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
