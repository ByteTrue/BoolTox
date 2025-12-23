/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, type ReactNode, type MouseEvent } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import type { SelectChangeEvent } from '@mui/material/Select';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  selected?: string;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, selected, align = 'left', className = '' }: DropdownProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: DropdownItem) => {
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
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: align === 'right' ? 'right' : 'left',
        }}
        slotProps={{
          paper: {
            sx: {
              minWidth: 200,
              borderRadius: 2,
              mt: 1,
            },
          },
        }}
      >
        {items.map(item => (
          <div key={item.id}>
            <MenuItem
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              sx={{
                color: item.danger ? 'error.main' : 'inherit',
                py: 1.25,
              }}
            >
              {item.icon && <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>}
              <ListItemText>{item.label}</ListItemText>
              {selected === item.id && <Check size={16} color="primary" />}
            </MenuItem>
            {item.divider && <Divider />}
          </div>
        ))}
      </Menu>
    </div>
  );
}

/**
 * Select 下拉选择器
 */
export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function SelectDropdown({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
}: SelectProps) {
  const handleChange = (event: SelectChangeEvent) => {
    onChange(event.target.value);
  };

  return (
    <FormControl size="small" className={className} disabled={disabled}>
      <Select
        value={value || ''}
        onChange={handleChange}
        displayEmpty
        IconComponent={() => <ChevronDown size={16} style={{ marginRight: 8 }} />}
        sx={{
          borderRadius: 2,
          minWidth: 120,
          '& .MuiSelect-select': {
            py: 1,
          },
        }}
      >
        {!value && (
          <MenuItem value="" disabled>
            {placeholder}
          </MenuItem>
        )}
        {options.map(opt => (
          <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

// 保持向后兼容的别名
export { SelectDropdown as Select };
