/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI ToggleButtonGroup (SegmentedControl) 组件包装器
 */

import React, { type ReactNode } from 'react';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Box from '@mui/material/Box';

export interface AppSegmentOption<T extends string = string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface AppSegmentedControlProps<T extends string = string> {
  /** 选项 */
  options: AppSegmentOption<T>[];
  /** 当前值 */
  value: T;
  /** 变更回调 */
  onChange: (value: T) => void;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 是否独占一行 */
  exclusive?: boolean;
}

const sizeMap: Record<'sm' | 'md' | 'lg', 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

/**
 * 分段控制器组件
 * 基于 MUI ToggleButtonGroup
 *
 * @example
 * ```tsx
 * <AppSegmentedControl
 *   value={view}
 *   onChange={setView}
 *   options={[
 *     { value: 'grid', label: '网格', icon: <Grid /> },
 *     { value: 'list', label: '列表', icon: <List /> },
 *   ]}
 * />
 * ```
 */
export function AppSegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  color = 'primary',
  fullWidth = false,
  className = '',
  exclusive = true,
}: AppSegmentedControlProps<T>) {
  const handleChange = (_event: React.MouseEvent<HTMLElement>, newValue: T | null) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive={exclusive}
      onChange={handleChange}
      size={sizeMap[size]}
      color={color}
      fullWidth={fullWidth}
      className={className}
      sx={{
        '& .MuiToggleButton-root': {
          textTransform: 'none',
          fontWeight: 600,
          gap: 1,
        },
      }}
    >
      {options.map(option => (
        <ToggleButton
          key={option.value}
          value={option.value}
          disabled={option.disabled}
          sx={{
            // 确保内容不会溢出
            overflow: 'hidden',
          }}
        >
          {option.icon}
          {option.label}
          {option.badge !== undefined && (
            <Box
              component="span"
              sx={{
                ml: 0.5,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                fontSize: '0.6875rem',
                fontWeight: 700,
                lineHeight: 1,
                minWidth: 18,
                textAlign: 'center',
              }}
            >
              {option.badge}
            </Box>
          )}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

// 导出别名
export { AppSegmentedControl as SegmentedControl };
export { AppSegmentedControl as Tabs };
