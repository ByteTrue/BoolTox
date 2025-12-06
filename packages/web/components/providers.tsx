'use client';

import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/toast';
import { CommandPalette } from '@/components/ui/command-palette';
import { KeyboardShortcutsPanel } from '@/components/ui/keyboard-shortcuts-panel';
import { ThemeCustomizer } from '@/components/ui/theme-customizer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        {children}
        {/* 全局功能组件 */}
        <CommandPalette />
        <KeyboardShortcutsPanel />
        <ThemeCustomizer />
      </ToastProvider>
    </ThemeProvider>
  );
}
