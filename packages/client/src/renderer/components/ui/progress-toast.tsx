import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ProgressToastProps {
  message: string;
  progress?: number; // 0-100
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * 进度提示组件 - 增强版 Toast,支持进度显示
 * 用于安装/更新等长时间操作的反馈
 */
export function ProgressToast({
  message,
  progress,
  icon,
  action,
}: ProgressToastProps) {
  const hasProgress = progress !== undefined;
  const progressPercentage = hasProgress ? Math.min(Math.max(progress, 0), 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 500,
        damping: 30,
      }}
      className="relative overflow-hidden rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-[0_20px_40px_rgba(15,35,70,0.2)] backdrop-blur-[28px] min-w-[320px]"
    >
      {/* 进度背景 */}
      {hasProgress && (
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 bg-[var(--accent-soft)] opacity-40"
        />
      )}

      {/* 内容 */}
      <div className="relative z-10 flex items-center gap-3 p-4">
        {/* 图标 */}
        {icon && (
          <div className="flex-shrink-0 text-[var(--accent-strong)]">
            {icon}
          </div>
        )}

        {/* 消息和进度 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
            {message}
          </p>
          {hasProgress && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-[var(--shell-border)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="h-full bg-[var(--accent-strong)] rounded-full"
                />
              </div>
              <span className="text-xs font-semibold text-[var(--text-secondary)] min-w-[3ch]">
                {Math.round(progressPercentage)}%
              </span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="flex-shrink-0 glass-button px-3 py-1.5 text-xs font-semibold"
          >
            {action.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 简单成功/错误提示
 */
export function SimpleToast({
  type = 'info',
  message,
  onDismiss,
}: {
  type?: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onDismiss?: () => void;
}) {
  const icons = {
    success: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const colors = {
    success: 'text-[var(--status-positive-strong)]',
    error: 'text-[var(--status-negative-strong)]',
    warning: 'text-[var(--status-warning-strong)]',
    info: 'text-[var(--accent-strong)]',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="rounded-2xl border border-[var(--shell-border)] bg-[var(--shell-surface)] shadow-[0_20px_40px_rgba(15,35,70,0.2)] backdrop-blur-[28px] p-4"
    >
      <div className="flex items-center gap-3">
        <div className={colors[type]}>
          {icons[type]}
        </div>
        <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">
          {message}
        </p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}
