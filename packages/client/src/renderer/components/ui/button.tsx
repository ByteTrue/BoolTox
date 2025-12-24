/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Button 组件包装器
 * 提供与原 GlassButton 兼容的 API
 */

import React from 'react';
import Button, { type ButtonProps as MuiButtonProps } from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  /** 按钮变体 */
  variant?: ButtonVariant;
  /** 按钮大小 */
  size?: ButtonSize;
  /** 左侧图标 */
  icon?: React.ReactNode;
  /** 右侧图标 */
  iconRight?: React.ReactNode;
  /** 完整圆角 */
  fullRounded?: boolean;
  /** 子元素 */
  children?: React.ReactNode;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 点击事件 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 自定义类名 */
  className?: string;
  /** Form 属性 */
  form?: string;
  /** Type 属性 */
  type?: 'button' | 'submit' | 'reset';
  /** 全宽 */
  fullWidth?: boolean;
}

// 变体映射
const variantMap: Record<
  ButtonVariant,
  { muiVariant: MuiButtonProps['variant']; color: MuiButtonProps['color'] }
> = {
  primary: { muiVariant: 'contained', color: 'primary' },
  secondary: { muiVariant: 'outlined', color: 'primary' },
  success: { muiVariant: 'contained', color: 'success' },
  danger: { muiVariant: 'contained', color: 'error' },
  ghost: { muiVariant: 'text', color: 'primary' },
};

// 尺寸映射
const sizeMap: Record<ButtonSize, MuiButtonProps['size']> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

/**
 * 应用按钮组件
 * 基于 MUI Button，提供统一的 API
 *
 * @example
 * ```tsx
 * <AppButton variant="primary" icon={<Star />}>主要按钮</AppButton>
 * <AppButton variant="danger" size="sm">删除</AppButton>
 * <AppButton variant="ghost" loading>加载中</AppButton>
 * ```
 */
export function AppButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullRounded = false,
  className = '',
  disabled = false,
  loading = false,
  children,
  onClick,
  form,
  type = 'button',
  fullWidth = false,
}: AppButtonProps) {
  const { muiVariant, color } = variantMap[variant];
  const muiSize = sizeMap[size];

  return (
    <Button
      variant={muiVariant}
      color={color}
      size={muiSize}
      disabled={disabled || loading}
      onClick={onClick}
      type={type}
      form={form}
      fullWidth={fullWidth}
      startIcon={loading ? <CircularProgress size={16} color="inherit" /> : icon}
      endIcon={iconRight}
      className={className}
      sx={{
        borderRadius: fullRounded ? '9999px' : undefined,
      }}
    >
      {children}
    </Button>
  );
}

/**
 * 图标按钮组件
 */
export interface AppIconButtonProps {
  /** 图标 */
  icon: React.ReactNode;
  /** 按钮大小 */
  size?: ButtonSize;
  /** 按钮颜色 */
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' | 'default';
  /** 是否禁用 */
  disabled?: boolean;
  /** 点击事件 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** 自定义类名 */
  className?: string;
  /** 无障碍标签 */
  'aria-label'?: string;
}

const iconSizeMap: Record<ButtonSize, 'small' | 'medium' | 'large'> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
};

export function AppIconButton({
  icon,
  size = 'md',
  color = 'default',
  disabled = false,
  onClick,
  className = '',
  'aria-label': ariaLabel,
}: AppIconButtonProps) {
  return (
    <IconButton
      size={iconSizeMap[size]}
      color={color}
      disabled={disabled}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {icon}
    </IconButton>
  );
}

// 导出别名，兼容旧代码
export { AppButton as GlassButton };
