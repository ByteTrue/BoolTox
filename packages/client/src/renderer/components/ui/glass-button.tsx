/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import React from 'react';
import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';

export type GlassButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps {
  /**
   * 按钮变体
   */
  variant?: GlassButtonVariant;
  /**
   * 按钮大小
   */
  size?: GlassButtonSize;
  /**
   * 左侧图标
   */
  icon?: React.ReactNode;
  /**
   * 右侧图标
   */
  iconRight?: React.ReactNode;
  /**
   * 完整圆角
   */
  fullRounded?: boolean;
  /**
   * 子元素
   */
  children?: React.ReactNode;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 点击事件
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * Form 属性
   */
  form?: string;
  /**
   * Type 属性
   */
  type?: 'button' | 'submit' | 'reset';
}

const SIZE_MAP = {
  sm: 'small' as const,
  md: 'medium' as const,
  lg: 'large' as const,
};

const VARIANT_MAP: Record<GlassButtonVariant, { muiVariant: ButtonProps['variant']; color: ButtonProps['color'] }> = {
  primary: { muiVariant: 'contained', color: 'primary' },
  secondary: { muiVariant: 'outlined', color: 'inherit' },
  success: { muiVariant: 'contained', color: 'success' },
  danger: { muiVariant: 'contained', color: 'error' },
  ghost: { muiVariant: 'text', color: 'inherit' },
};

/**
 * 按钮组件
 */
export function GlassButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullRounded = false,
  className = '',
  disabled,
  children,
  onClick,
  form,
  type = 'button',
}: GlassButtonProps) {
  const { muiVariant, color } = VARIANT_MAP[variant];

  return (
    <Button
      type={type}
      onClick={onClick}
      form={form}
      disabled={disabled}
      variant={muiVariant}
      color={color}
      size={SIZE_MAP[size]}
      className={className}
      startIcon={icon}
      endIcon={iconRight}
      sx={{
        borderRadius: fullRounded ? 50 : 2,
        textTransform: 'none',
        fontWeight: 600,
      }}
    >
      {children}
    </Button>
  );
}
