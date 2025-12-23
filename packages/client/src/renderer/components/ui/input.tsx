/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { type InputHTMLAttributes, type ReactNode, type ChangeEvent } from 'react';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /**
   * 值变更回调
   */
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 错误信息
   */
  error?: string;
  /**
   * 成功状态
   */
  success?: boolean;
  /**
   * 帮助文本
   */
  helpText?: string;
  /**
   * 最大长度（显示字符计数）
   */
  maxLength?: number;
  /**
   * 是否显示字符计数
   */
  showCount?: boolean;
  /**
   * 输入框大小
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 左侧图标
   */
  leftIcon?: ReactNode;
  /**
   * 右侧图标
   */
  rightIcon?: ReactNode;
}

/**
 * 输入框组件
 */
export function Input({
  label,
  error,
  success,
  helpText,
  maxLength,
  showCount = false,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  value,
  onChange,
  ...props
}: InputProps) {
  const currentLength = typeof value === 'string' ? value.length : 0;
  const hasError = Boolean(error);
  const hasSuccess = success && !hasError;

  const sizeMap = {
    sm: 'small' as const,
    md: 'medium' as const,
    lg: 'medium' as const,
  };

  return (
    <Box className={className}>
      <TextField
        {...props}
        label={label}
        value={value}
        onChange={onChange}
        disabled={disabled}
        size={sizeMap[size]}
        fullWidth
        error={hasError}
        color={hasSuccess ? 'success' : undefined}
        helperText={
          <Box
            component="span"
            sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}
          >
            <span>{error || helpText || ' '}</span>
            {showCount && maxLength && (
              <Typography
                component="span"
                variant="caption"
                color={currentLength > maxLength * 0.9 ? 'warning.main' : 'text.secondary'}
              >
                {currentLength} / {maxLength}
              </Typography>
            )}
          </Box>
        }
        slotProps={{
          htmlInput: {
            maxLength,
          },
          input: {
            startAdornment: leftIcon ? (
              <InputAdornment position="start">{leftIcon}</InputAdornment>
            ) : undefined,
            endAdornment:
              hasError || hasSuccess || rightIcon ? (
                <InputAdornment position="end">
                  {hasError ? (
                    <AlertCircle size={18} color="error" />
                  ) : hasSuccess ? (
                    <CheckCircle2 size={18} color="success" />
                  ) : (
                    rightIcon
                  )}
                </InputAdornment>
              ) : undefined,
          },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            ...(size === 'lg' && {
              '& input': {
                py: 1.5,
                fontSize: '1.1rem',
              },
            }),
          },
        }}
      />
    </Box>
  );
}
