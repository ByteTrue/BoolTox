/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 自定义主题 Provider
 * 管理用户自定义主色调
 */

import React, { createContext, useContext } from 'react';
import { useCustomTheme, type CustomThemeConfig } from '../hooks/use-custom-theme';

interface CustomThemeContextValue {
  config: CustomThemeConfig;
  updateTheme: (config: Partial<CustomThemeConfig>) => void;
  resetTheme: () => void;
  defaultColors: Record<string, string>;
}

const CustomThemeContext = createContext<CustomThemeContextValue | undefined>(undefined);

export function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  const customTheme = useCustomTheme();

  return (
    <CustomThemeContext.Provider value={customTheme}>
      {children}
    </CustomThemeContext.Provider>
  );
}

export function useCustomThemeContext() {
  const context = useContext(CustomThemeContext);
  if (!context) {
    throw new Error('useCustomThemeContext must be used within CustomThemeProvider');
  }
  return context;
}
