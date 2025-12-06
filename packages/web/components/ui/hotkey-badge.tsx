/**
 * 快捷键徽章组件
 */

'use client';

import { formatHotkey } from '@/hooks/use-hotkeys';

export function HotkeyBadge({ keys }: { keys: string }) {
  return (
    <kbd className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-medium text-neutral-700 dark:text-neutral-300 font-mono">
      {formatHotkey(keys)}
    </kbd>
  );
}
