/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Box from '@mui/material/Box';

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'small',
  md: 'medium',
  lg: 'medium',
} as const;

/**
 * Toggle 开关组件
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
  className = '',
}: ToggleProps) {
  const handleChange = (_: React.ChangeEvent<HTMLInputElement>, newChecked: boolean) => {
    onChange(newChecked);
  };

  const switchElement = (
    <Switch
      checked={checked}
      onChange={handleChange}
      disabled={disabled}
      size={SIZE_MAP[size]}
      color="primary"
    />
  );

  if (label) {
    return (
      <FormControlLabel
        control={switchElement}
        label={label}
        disabled={disabled}
        className={className}
        sx={{
          '& .MuiFormControlLabel-label': {
            fontSize: size === 'sm' ? '0.875rem' : '1rem',
          },
        }}
      />
    );
  }

  return (
    <Box className={className} sx={{ display: 'inline-flex' }}>
      {switchElement}
    </Box>
  );
}
