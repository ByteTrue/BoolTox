/**
 * 快捷键帮助面板（? 键打开）
 * 展示所有可用的快捷键
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { HotkeyBadge } from '@/components/ui/hotkey-badge';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { modalBackdrop, modalContent } from '@/lib/animation-config';

interface ShortcutItem {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // 全局快捷键
  { keys: 'mod+k', description: '打开命令面板', category: '全局' },
  { keys: '?', description: '显示快捷键帮助', category: '全局' },
  { keys: 'escape', description: '关闭面板/退出', category: '全局' },

  // 导航快捷键
  { keys: 'g h', description: '前往首页', category: '导航' },
  { keys: 'g t', description: '前往工具箱', category: '导航' },
  { keys: 'g m', description: '前往插件市场', category: '导航' },
  { keys: 'g d', description: '前往文档', category: '导航' },

  // 操作快捷键
  { keys: 'mod+r', description: '刷新列表', category: '操作' },
  { keys: 'mod+/', description: '聚焦搜索框', category: '操作' },

  // 可访问性
  { keys: 'tab', description: '切换焦点', category: '可访问性' },
  { keys: 'shift+tab', description: '反向切换焦点', category: '可访问性' },
  { keys: 'enter', description: '激活元素', category: '可访问性' },
];

export function KeyboardShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useFocusTrap({ isActive: isOpen });

  // ? 键打开
  useHotkeys({
    keys: '?',
    callback: () => setIsOpen(true),
    description: '显示快捷键帮助',
    preventDefault: true,
  });

  // ESC 关闭
  useHotkeys({
    keys: 'escape',
    callback: () => setIsOpen(false),
    enabled: isOpen,
  });

  // 分组快捷键
  const groupedShortcuts = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* 面板 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              ref={containerRef}
              variants={modalContent}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full max-w-3xl bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="shortcuts-title"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                    <Keyboard size={24} />
                  </div>
                  <h2 id="shortcuts-title" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                    键盘快捷键
                  </h2>
                </div>
                <motion.button
                  onClick={() => setIsOpen(false)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  aria-label="关闭"
                >
                  <X size={20} className="text-neutral-600 dark:text-neutral-400" />
                </motion.button>
              </div>

              {/* 快捷键列表 */}
              <div className="max-h-[60vh] overflow-y-auto p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 uppercase tracking-wide">
                        {category}
                      </h3>
                      <div className="space-y-2">
                        {shortcuts.map((shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                          >
                            <span className="text-sm text-neutral-700 dark:text-neutral-300">
                              {shortcut.description}
                            </span>
                            <HotkeyBadge keys={shortcut.keys} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                  提示：按 <HotkeyBadge keys="mod+k" /> 打开命令面板，快速执行操作
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
