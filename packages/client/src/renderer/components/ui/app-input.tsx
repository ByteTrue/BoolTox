/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI TextField 组件包装器
 */

import React from 'react';
import TextField, { type TextFieldProps } from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

export interface AppInputProps {
  /** 标签 */
  label?: string;
  /** 占位符 */
  placeholder?: string;
  /** 值 */
  value?: string;
  /** 默认值 */
  defaultValue?: string;
  /** 变更回调 */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 输入类型 */
  type?: 'text' | 'password' | 'email' | 'number' | 'search' | 'tel' | 'url';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否只读 */
  readOnly?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 帮助文本 */
  helperText?: string;
  /** 左侧图标 */
  startIcon?: React.ReactNode;
  /** 右侧图标 */
  endIcon?: React.ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 全宽 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 自动聚焦 */
  autoFocus?: boolean;
  /** 多行 */
  multiline?: boolean;
  /** 行数 */
  rows?: number;
  /** 最大行数 */
  maxRows?: number;
  /** 名称 */
  name?: string;
  /** 自动完成 */
  autoComplete?: string;
  /** 键盘按下事件 */
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  /** 失焦事件 */
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
  /** 聚焦事件 */
  onFocus?: (event: React.FocusEvent<HTMLInputElement>) => void;
}

const sizeMap: Record<'sm' | 'md', TextFieldProps['size']> = {
  sm: 'small',
  md: 'medium',
};

/**
 * 应用输入框组件
 * 基于 MUI TextField
 *
 * @example
 * ```tsx
 * <AppInput label="用户名" placeholder="请输入用户名" />
 * <AppInput type="password" label="密码" />
 * <AppInput error helperText="输入有误" />
 * ```
 */
export function AppInput({
  label,
  placeholder,
  value,
  defaultValue,
  onChange,
  type = 'text',
  disabled = false,
  readOnly = false,
  required = false,
  error = false,
  helperText,
  startIcon,
  endIcon,
  size = 'md',
  fullWidth = true,
  className = '',
  autoFocus = false,
  multiline = false,
  rows,
  maxRows,
  name,
  autoComplete,
  onKeyDown,
  onBlur,
  onFocus,
}: AppInputProps) {
  return (
    <TextField
      label={label}
      placeholder={placeholder}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      type={type}
      disabled={disabled}
      required={required}
      error={error}
      helperText={helperText}
      size={sizeMap[size]}
      fullWidth={fullWidth}
      className={className}
      autoFocus={autoFocus}
      multiline={multiline}
      rows={rows}
      maxRows={maxRows}
      name={name}
      autoComplete={autoComplete}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onFocus={onFocus}
      slotProps={{
        input: {
          readOnly,
          startAdornment: startIcon ? (
            <InputAdornment position="start">{startIcon}</InputAdornment>
          ) : undefined,
          endAdornment: endIcon ? (
            <InputAdornment position="end">{endIcon}</InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}

// 导出别名
export { AppInput as Input };
