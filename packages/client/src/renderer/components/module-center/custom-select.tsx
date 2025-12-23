/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  minimal?: boolean;
}

export function CustomSelect({
  value,
  options,
  onChange,
  icon,
  placeholder = '请选择',
  minimal = false,
}: CustomSelectProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const selectedOption = options.find(opt => opt.value === value);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    handleClose();
  };

  return (
    <>
      <Button
        variant={minimal ? 'text' : 'outlined'}
        size="small"
        onClick={handleClick}
        startIcon={icon}
        endIcon={
          <ChevronDown
            size={16}
            style={{
              transition: 'transform 0.2s',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        }
        sx={{
          textTransform: 'none',
          ...(minimal && {
            minWidth: 'auto',
            px: 1,
          }),
        }}
      >
        {selectedOption?.label || placeholder}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            minWidth: 160,
            mt: 0.5,
          },
        }}
      >
        {options.map(option => {
          const isSelected = option.value === value;
          return (
            <MenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              selected={isSelected}
            >
              <ListItemText>{option.label}</ListItemText>
              {isSelected && (
                <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                  <Check size={14} />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
