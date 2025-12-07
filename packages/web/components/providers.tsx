'use client';

import dynamic from 'next/dynamic';
import { ThemeProvider } from 'next-themes';
import { ToastProvider } from '@/components/toast';

const CommandPalette = dynamic(
  () => import('@/components/ui/command-palette').then((mod) => mod.CommandPalette),
  { ssr: false }
);
const KeyboardShortcutsPanel = dynamic(
  () => import('@/components/ui/keyboard-shortcuts-panel').then((mod) => mod.KeyboardShortcutsPanel),
  { ssr: false }
);

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ToastProvider>
        {children}
        {/* 全局功能组件 */}
        <CommandPalette />
        <KeyboardShortcutsPanel />
      </ToastProvider>
    </ThemeProvider>
  );
}
