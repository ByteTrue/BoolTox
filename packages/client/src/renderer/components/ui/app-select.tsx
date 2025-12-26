/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Select/Menu 组件包装器
 */

import React, { useState, type ReactNode } from 'react';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import { Check } from 'lucide-react';

/**
 * Select 组件
 */
export interface AppSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AppSelectProps {
  /** 当前值 */
  value?: string;
  /** 变更回调 */
  onChange: (value: string) => void;
  /** 选项 */
  options: AppSelectOption[];
  /** 标签 */
  label?: string;
  /** 占位符 */
  placeholder?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否必填 */
  required?: boolean;
  /** 错误状态 */
  error?: boolean;
  /** 帮助文本 */
  helperText?: string;
  /** 尺寸 */
  size?: 'sm' | 'md';
  /** 全宽 */
  fullWidth?: boolean;
  /** 自定义类名 */
  className?: string;
}

const selectSizeMap: Record<'sm' | 'md', 'small' | 'medium'> = {
  sm: 'small',
  md: 'medium',
};

/**
 * 应用选择器组件
 * 基于 MUI Select
 *
 * @example
 * ```tsx
 * <AppSelect
 *   value={selected}
 *   onChange={setSelected}
 *   options={[
 *     { value: 'a', label: '选项 A' },
 *     { value: 'b', label: '选项 B' },
 *   ]}
 * />
 * ```
 */
export function AppSelect({
  value,
  onChange,
  options,
  label,
  placeholder = '请选择',
  disabled = false,
  required = false,
  error = false,
  helperText,
  size = 'md',
  fullWidth = true,
  className = '',
}: AppSelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl
      fullWidth={fullWidth}
      size={selectSizeMap[size]}
      disabled={disabled}
      required={required}
      error={error}
      className={className}
    >
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        value={value || ''}
        onChange={handleChange}
        label={label}
        displayEmpty={!label}
        renderValue={selected => {
          if (!selected) {
            return <span style={{ color: 'inherit', opacity: 0.5 }}>{placeholder}</span>;
          }
          return options.find(opt => opt.value === selected)?.label || selected;
        }}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {helperText && (
        <span
          style={{
            fontSize: '0.75rem',
            color: error ? 'error.main' : 'text.secondary',
            marginTop: 4,
            marginLeft: 14,
          }}
        >
          {helperText}
        </span>
      )}
    </FormControl>
  );
}

/**
 * Dropdown Menu 组件
 */
export interface AppDropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface AppDropdownProps {
  /** 触发器元素 */
  trigger: ReactNode;
  /** 菜单项 */
  items: AppDropdownItem[];
  /** 当前选中项 */
  selected?: string;
  /** 自定义类名 */
  className?: string;
}

/**
 * 下拉菜单组件
 * 基于 MUI Menu
 *
 * @example
 * ```tsx
 * <AppDropdown
 *   trigger={<Button>更多操作</Button>}
 *   items={[
 *     { id: 'edit', label: '编辑', icon: <Edit /> },
 *     { id: 'delete', label: '删除', danger: true },
 *   ]}
 * />
 * ```
 */
export function AppDropdown({ trigger, items, selected, className = '' }: AppDropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: AppDropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    handleClose();
  };

  return (
    <div className={className}>
      <div onClick={handleClick} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id}>
            <MenuItem
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              sx={{
                color: item.danger ? 'error.main' : undefined,
              }}
            >
              {item.icon && <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
              {selected === item.id && (
                <Check
                  size={16}
                  style={{ marginLeft: 8, color: 'var(--mui-palette-primary-main)' }}
                />
              )}
            </MenuItem>
            {item.divider && index < items.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Menu>
    </div>
  );
}

// 导出别名
export { AppSelect as Select };
export { AppDropdown as Dropdown };
