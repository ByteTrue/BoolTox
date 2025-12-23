/**
 * MUI 主题配置
 * Material Design 3 风格，基于品牌色
 */

import { createTheme, type ThemeOptions, alpha } from '@mui/material/styles';

// 品牌色
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

// MD3 Surface 层次系统
const surfaceLayers = {
  light: {
    surfaceContainerLowest: '#FFFFFF',
    surfaceContainerLow: '#F7F7F9',
    surfaceContainer: '#F2F2F4',
    surfaceContainerHigh: '#ECECEE',
    surfaceContainerHighest: '#E6E6E8',
  },
  dark: {
    surfaceContainerLowest: '#0D0D0E',
    surfaceContainerLow: '#1A1A1C',
    surfaceContainer: '#1E1E20',
    surfaceContainerHigh: '#282A2C',
    surfaceContainerHighest: '#333537',
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
      default: surfaceLayers.light.surfaceContainerLow,
      paper: surfaceLayers.light.surfaceContainerLowest,
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.60)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      tertiary: 'rgba(0, 0, 0, 0.45)',
    },
    divider: 'rgba(0, 0, 0, 0.08)',
    action: {
      active: 'rgba(0, 0, 0, 0.56)',
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: alpha(brandColors.blue.main, 0.12),
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
    // MD3 扩展颜色
    surfaceContainerLowest: surfaceLayers.light.surfaceContainerLowest,
    surfaceContainerLow: surfaceLayers.light.surfaceContainerLow,
    surfaceContainer: surfaceLayers.light.surfaceContainer,
    surfaceContainerHigh: surfaceLayers.light.surfaceContainerHigh,
    surfaceContainerHighest: surfaceLayers.light.surfaceContainerHighest,
    primaryContainer: alpha(brandColors.blue.main, 0.12),
    onPrimaryContainer: brandColors.blue.dark,
  } as any,
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
      default: surfaceLayers.dark.surfaceContainerLow,
      paper: surfaceLayers.dark.surfaceContainer,
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.92)',
      secondary: 'rgba(255, 255, 255, 0.68)',
      disabled: 'rgba(255, 255, 255, 0.38)',
      tertiary: 'rgba(255, 255, 255, 0.45)',
    },
    divider: 'rgba(255, 255, 255, 0.08)',
    action: {
      active: 'rgba(255, 255, 255, 0.72)',
      hover: 'rgba(255, 255, 255, 0.06)',
      selected: alpha(brandColors.blue.light, 0.16),
      disabled: 'rgba(255, 255, 255, 0.30)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    // MD3 扩展颜色
    surfaceContainerLowest: surfaceLayers.dark.surfaceContainerLowest,
    surfaceContainerLow: surfaceLayers.dark.surfaceContainerLow,
    surfaceContainer: surfaceLayers.dark.surfaceContainer,
    surfaceContainerHigh: surfaceLayers.dark.surfaceContainerHigh,
    surfaceContainerHighest: surfaceLayers.dark.surfaceContainerHighest,
    primaryContainer: alpha(brandColors.blue.light, 0.16),
    onPrimaryContainer: '#8ACEF1',
  } as any,
});

// 根据主题模式获取主题
export function getTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkTheme : lightTheme;
}
