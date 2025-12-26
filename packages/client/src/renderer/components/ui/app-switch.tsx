/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Switch 组件包装器
 */

import React from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import { durations, easings } from '@/theme/animations';

export interface AppSwitchProps {
  /** 是否选中 */
  checked: boolean;
  /** 状态变化回调 */
  onChange: (checked: boolean) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 标签文本 */
  label?: string;
  /** 大小 */
  size?: 'sm' | 'md';
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  /** 自定义类名 */
  className?: string;
  /** 名称 */
  name?: string;
}

const sizeMap: Record<'sm' | 'md', 'small' | 'medium'> = {
  sm: 'small',
  md: 'medium',
};

/**
 * 应用开关组件
 * 基于 MUI Switch
 *
 * @example
 * ```tsx
 * <AppSwitch checked={enabled} onChange={setEnabled} label="启用功能" />
 * ```
 */
export function AppSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
  color = 'primary',
  className = '',
  name,
}: AppSwitchProps) {
  const handleChange = (_event: React.ChangeEvent<HTMLInputElement>, newChecked: boolean) => {
    onChange(newChecked);
  };

  const switchComponent = (
    <Switch
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      size={sizeMap[size]}
      color={color}
      name={name}
      sx={{
        // Spring 动画效果：thumb 移动时的弹性感
        '& .MuiSwitch-thumb': {
          transition: `transform ${durations.spring}s ${easings.spring}`,
        },
        // Track 的渐变动画
        '& .MuiSwitch-track': {
          transition: `background-color ${durations.standard}s ${easings.standard}, border-color ${durations.standard}s ${easings.standard}`,
        },
      }}
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={switchComponent}
        label={label}
        disabled={disabled}
        className={className}
      />
    );
  }

  return <span className={className}>{switchComponent}</span>;
}

// 导出别名，兼容旧代码
export { AppSwitch as Toggle };
