/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface BatchAction {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
}

interface BatchActionBarProps {
  selectedCount: number;
  actions: BatchAction[];
  onClear?: () => void;
}

/**
 * 批量操作栏组件 - 选中多项时显示
 * 从底部滑入,提供批量操作快捷方式
 */
export function BatchActionBar({ selectedCount, actions, onClear }: BatchActionBarProps) {
  const isVisible = selectedCount > 0;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="glass-panel flex items-center gap-4 px-6 py-4 min-w-[400px]">
            {/* 选中数量 */}
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent-soft)]"
              >
                <span className="text-sm font-semibold text-[var(--accent-strong)]">
                  {selectedCount}
                </span>
              </motion.div>
              <span className="text-sm font-medium text-[var(--text-secondary)]">已选中</span>
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-[var(--shell-border)]" />

            {/* 操作按钮组 */}
            <div className="flex-1 flex items-center gap-2">
              {actions.map((action, index) => (
                <BatchActionButton key={index} action={action} />
              ))}
            </div>

            {/* 清除选择按钮 */}
            {onClear && (
              <>
                <div className="h-6 w-px bg-[var(--shell-border)]" />
                <button
                  type="button"
                  onClick={onClear}
                  className="text-sm font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  清除
                </button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function BatchActionButton({ action }: { action: BatchAction }) {
  const variantClasses = {
    default: 'glass-button text-[var(--text-primary)]',
    primary: 'glass-button bg-[var(--accent-strong)] text-white hover:bg-[var(--accent-contrast)]',
    danger:
      'glass-button text-[var(--status-negative-strong)] hover:bg-[var(--status-negative-soft)]',
  };

  return (
    <motion.button
      type="button"
      onClick={action.onClick}
      disabled={action.disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        flex items-center gap-2 px-4 py-2 text-sm font-semibold
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[action.variant || 'default']}
      `}
    >
      {action.icon}
      {action.label}
    </motion.button>
  );
}
