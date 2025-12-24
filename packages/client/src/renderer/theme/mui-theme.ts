/**
 * MUI 主题配置
 * Material Design 3 风格，基于品牌色
 */

import { createTheme, type ThemeOptions, alpha } from '@mui/material/styles';

// 品牌色 - 经典蓝色 (GitHub/Tailwind Blue)
const brandColors = {
  // 浅色模式用深一点的蓝色
  light: {
    lighter: '#DBEAFE', // Blue 100
    light: '#60A5FA',   // Blue 400
    main: '#3B82F6',    // Blue 500
    dark: '#2563EB',    // Blue 600
    darker: '#1D4ED8',  // Blue 700
  },
  // 深色模式用亮一点的蓝色
  dark: {
    lighter: '#93C5FD', // Blue 300
    light: '#60A5FA',   // Blue 400
    main: '#3B82F6',    // Blue 500 (实际会用 light)
    dark: '#2563EB',    // Blue 600
    darker: '#1D4ED8',  // Blue 700
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
      light: brandColors.light.light,
      main: brandColors.light.main,
      dark: brandColors.light.dark,
      contrastText: '#FFFFFF',
    },
    secondary: {
      light: '#94A3B8',  // Slate 400
      main: '#64748B',   // Slate 500
      dark: '#475569',   // Slate 600
      contrastText: '#FFFFFF',
    },
    success: {
      main: '#22C55E',   // Green 500
      light: '#4ADE80',  // Green 400
      dark: '#16A34A',   // Green 600
    },
    warning: {
      main: '#F59E0B',   // Amber 500
      light: '#FBBF24',  // Amber 400
      dark: '#D97706',   // Amber 600
    },
    error: {
      main: '#EF4444',   // Red 500
      light: '#F87171',  // Red 400
      dark: '#DC2626',   // Red 600
    },
    info: {
      main: brandColors.light.main,
      light: brandColors.light.light,
      dark: brandColors.light.dark,
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
      selected: alpha(brandColors.light.main, 0.12),
      disabled: 'rgba(0, 0, 0, 0.26)',
      disabledBackground: 'rgba(0, 0, 0, 0.12)',
    },
    // MD3 扩展颜色
    surfaceContainerLowest: surfaceLayers.light.surfaceContainerLowest,
    surfaceContainerLow: surfaceLayers.light.surfaceContainerLow,
    surfaceContainer: surfaceLayers.light.surfaceContainer,
    surfaceContainerHigh: surfaceLayers.light.surfaceContainerHigh,
    surfaceContainerHighest: surfaceLayers.light.surfaceContainerHighest,
    primaryContainer: alpha(brandColors.light.main, 0.12),
    onPrimaryContainer: brandColors.light.dark,
  } as any,
});

// 暗色主题
export const darkTheme = createTheme({
  ...baseThemeOptions,
  palette: {
    mode: 'dark',
    primary: {
      light: brandColors.dark.lighter,
      main: brandColors.dark.light,    // 深色模式用亮一点的蓝色
      dark: brandColors.dark.main,
      contrastText: '#000000',
    },
    secondary: {
      light: '#CBD5E1',  // Slate 300
      main: '#94A3B8',   // Slate 400
      dark: '#64748B',   // Slate 500
      contrastText: '#000000',
    },
    success: {
      main: '#4ADE80',   // Green 400
      light: '#86EFAC',  // Green 300
      dark: '#22C55E',   // Green 500
    },
    warning: {
      main: '#FBBF24',   // Amber 400
      light: '#FCD34D',  // Amber 300
      dark: '#F59E0B',   // Amber 500
    },
    error: {
      main: '#F87171',   // Red 400
      light: '#FCA5A5',  // Red 300
      dark: '#EF4444',   // Red 500
    },
    info: {
      main: brandColors.dark.light,
      light: brandColors.dark.lighter,
      dark: brandColors.dark.main,
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
      selected: alpha(brandColors.dark.light, 0.16),
      disabled: 'rgba(255, 255, 255, 0.30)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
    // MD3 扩展颜色
    surfaceContainerLowest: surfaceLayers.dark.surfaceContainerLowest,
    surfaceContainerLow: surfaceLayers.dark.surfaceContainerLow,
    surfaceContainer: surfaceLayers.dark.surfaceContainer,
    surfaceContainerHigh: surfaceLayers.dark.surfaceContainerHigh,
    surfaceContainerHighest: surfaceLayers.dark.surfaceContainerHighest,
    primaryContainer: alpha(brandColors.dark.light, 0.16),
    onPrimaryContainer: brandColors.dark.lighter,
  } as any,
});

// 根据主题模式获取主题
export function getTheme(mode: 'light' | 'dark') {
  return mode === 'dark' ? darkTheme : lightTheme;
}
