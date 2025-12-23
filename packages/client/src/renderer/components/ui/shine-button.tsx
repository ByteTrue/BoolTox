/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { CSSProperties, ReactNode } from 'react';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export interface ShineButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  shinePreset?: 'fast' | 'default' | 'slow' | 'diagonal' | 'vertical';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
} as const;

const VARIANT_MAP = {
  primary: { muiVariant: 'contained', color: 'primary' } as const,
  secondary: { muiVariant: 'outlined', color: 'inherit' } as const,
  ghost: { muiVariant: 'text', color: 'inherit' } as const,
};

/**
 * ShineButton 组件 - 使用 MUI Button
 */
export function ShineButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  style = {},
  onClick,
}: ShineButtonProps) {
  const { muiVariant, color } = VARIANT_MAP[variant];

  return (
    <Button
      variant={muiVariant}
      color={color}
      size={SIZE_MAP[size]}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      onClick={onClick}
      className={className}
      sx={{
        borderRadius: 2,
        fontWeight: 600,
        ...style,
      }}
    >
      {loading && (
        <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
      )}
      {children}
    </Button>
  );
}

/**
 * ShineButtonGroup - 按钮组容器
 */
export interface ShineButtonGroupProps {
  children: ReactNode;
  className?: string;
  direction?: 'horizontal' | 'vertical';
  gap?: 'sm' | 'md' | 'lg';
}

export function ShineButtonGroup({
  children,
  className = '',
  direction = 'horizontal',
  gap = 'md',
}: ShineButtonGroupProps) {
  const gapMap = { sm: 1, md: 1.5, lg: 2 };

  return (
    <Box
      className={className}
      sx={{
        display: 'flex',
        flexDirection: direction === 'horizontal' ? 'row' : 'column',
        gap: gapMap[gap],
      }}
    >
      {children}
    </Box>
  );
}
