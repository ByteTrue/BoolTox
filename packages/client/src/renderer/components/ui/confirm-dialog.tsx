import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'default' | 'danger';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * 通用确认对话框，遵循应用玻璃态风格
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  tone = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[color:rgba(12,18,28,0.45)] backdrop-blur-md"
            onClick={() => {
              if (!loading) {
                onCancel();
              }
            }}
          />

          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
              aria-describedby={description ? dialogDescriptionId : undefined}
              className="w-full max-w-sm rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-surface)]/95 p-6 shadow-unified-2xl dark:shadow-unified-2xl-dark backdrop-blur-xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 id={dialogTitleId} className="text-lg font-semibold text-[var(--text-primary)]">
                    {title}
                  </h2>
                  {description && (
                    <p
                      id={dialogDescriptionId}
                      className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]"
                    >
                      {description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!loading) {
                      onCancel();
                    }
                  }}
                  className="rounded-full p-1 text-[var(--text-tertiary)] transition-colors hover:text-[var(--text-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
                  aria-label="关闭"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onCancel}
                  className="rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-strong)]"
                  disabled={loading}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  onClick={onConfirm}
                  className={`rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--shell-surface)] ${
                    tone === 'danger'
                      ? 'bg-[var(--status-negative-strong)] hover:bg-[var(--status-negative-border)] focus-visible:ring-[var(--status-negative-strong)]'
                      : 'bg-[var(--accent-strong)] hover:bg-[var(--accent-contrast)] focus-visible:ring-[var(--accent-strong)]'
                  } ${loading ? 'opacity-70' : ''}`}
                  disabled={loading}
                >
                  {loading ? '处理中...' : confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
