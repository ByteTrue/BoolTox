/**
 * MUI 主题配置
 * Material Design 风格，基于原有品牌色
 */

import { createTheme, type ThemeOptions } from '@mui/material/styles';

// 品牌色（保留原有配色）
const brandColors = {
  blue: {
    light: '#65BBE9',
    main: '#51A9D5',
    dark: '#3D97C1',
  },
  pink: {
    light: '#FBD7E1',
    main: '#F9C1CF',
    dark: '#F7AAB8',
  },
};

// 通用主题配置
const baseThemeOptions: ThemeOptions = {
  // 圆角
  shape: {
    borderRadius: 8,
  },

  // 字体
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    h1: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem',
    },
    body2: {
      fontSize: '0.75rem',
    },
  },

  // 组件默认配置
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: false,
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: '0.75rem',
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: false,
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiSnackbar: {
      defaultProps: {
        anchorOrigin: {
          vertical: 'bottom',
          horizontal: 'right',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 6,
          fontSize: '0.75rem',
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },
  },
};

// 亮色主题
export const lightTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'light',
    primary: {
      light: brandColors.blue.light,
      main: brandColors.blue.main,
      dark: brandColors.blue.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: brandColors.pink.light,
      main: brandColors.pink.main,
      dark: brandColors.pink.dark,
      contrastText: '#000000',
    },
    success: {
      main: '#34C759',
      light: '#4CD964',
      dark: '#28A745',
    },
    warning: {
      main: '#FF9500',
      light: '#FFAA33',
      dark: '#CC7700',
    },
    error: {
      main: '#FF3B30',
      light: '#FF6B6B',
      dark: '#CC2F26',
    },
    info: {
      main: '#51A9D5',
      light: '#65BBE9',
      dark: '#3D97C1',
    },
    background: {
      default: '#F5F5F7',
      paper: '#FFFFFF',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.85)',
      secondary: 'rgba(0, 0, 0, 0.60)',
      disabled: 'rgba(0, 0, 0, 0.38)',
    },
    divider: 'rgba(0, 0, 0, 0.12)',
    action: {
      active: 'rgba(0, 0, 0, 0.54)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(81, 169, 213, 0.12)',
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
  },
});

// 暗色主题
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      light: '#8ACEF1',
      main: brandColors.blue.light,
      dark: brandColors.blue.main,
      contrastText: '#000000',
    },
    secondary: {
      light: brandColors.pink.light,
      main: brandColors.pink.main,
      dark: brandColors.pink.dark,
      contrastText: '#000000',
    },
    success: {
      main: '#30D158',
      light: '#4ADE80',
      dark: '#22C55E',
    },
    warning: {
      main: '#FF9F0A',
      light: '#FFB340',
      dark: '#F59E0B',
    },
    error: {
      main: '#FF453A',
      light: '#FF6B6B',
      dark: '#EF4444',
    },
    info: {
      main: '#65BBE9',
      light: '#8ACEF1',
      dark: '#51A9D5',
    },
    background: {
      default: '#1C1C1E',
      paper: '#2C2C2E',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.85)',
      secondary: 'rgba(255, 255, 255, 0.60)',
      disabled: 'rgba(255, 255, 255, 0.38)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: 'rgba(255, 255, 255, 0.54)',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(101, 187, 233, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.26)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
  },
});

// 根据主题模式获取主题
export function getTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkTheme : lightTheme;
}
