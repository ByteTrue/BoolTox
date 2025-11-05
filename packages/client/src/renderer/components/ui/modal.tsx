/**
 * Modal/Dialog 组件
 * 
 * Apple 风格的模态对话框，支持：
 * - 背景模糊动画（backdrop-filter: blur）
 * - 缩放进入动画
 * - 玻璃态设计
 * - 多种尺寸
 * - 可选页脚按钮
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalVariants, modalBackdropVariants } from '../../utils/micro-interactions';
import { getGlassStyle, GLASS_BORDERS } from '../../utils/glass-layers';
import { getModalBackdropBlur } from '../../utils/blur-effects';
import { useTheme } from '../theme-provider';
import { GlassButton } from './glass-button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  footer?: React.ReactNode;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  footer,
  className = '',
}: ModalProps) {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);

  // ESC 键关闭
  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, closeOnEsc, onClose]);

  // 阻止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {open && (
        <>
          {/* 背景遮罩 + 模糊 */}
          <motion.div
            variants={modalBackdropVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            style={getModalBackdropBlur(theme, 'medium')}
          >
            {/* Modal 内容 */}
            <motion.div
              ref={modalRef}
              variants={modalVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              className={`relative w-full ${SIZE_CLASSES[size]} rounded-2xl border shadow-2xl ${className}`}
              style={getGlassStyle('MODAL', theme)}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  className="flex items-center justify-between px-6 py-4 border-b"
                  style={{ borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT }}
                >
                  {title && (
                    <h2
                      className={`text-lg font-semibold ${
                        theme === 'dark' ? 'text-white' : 'text-slate-800'
                      }`}
                    >
                      {title}
                    </h2>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={`p-1.5 rounded-lg transition-colors ${
                        theme === 'dark'
                          ? 'hover:bg-white/10 text-white/60 hover:text-white'
                          : 'hover:bg-black/5 text-slate-400 hover:text-slate-600'
                      }`}
                      aria-label="关闭"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className="px-6 py-4 border-t"
                  style={{ borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * 确认对话框
 * 预设样式的快速确认弹窗
 */
export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
}: ConfirmDialogProps) {
  const { theme } = useTheme();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex justify-end gap-3">
          <GlassButton variant="secondary" onClick={onClose}>
            {cancelText}
          </GlassButton>
          <GlassButton variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </GlassButton>
        </div>
      }
    >
      <div>
        <h3
          className={`text-lg font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
        >
          {title}
        </h3>
        {description && (
          <p
            className={`text-sm leading-relaxed ${
              theme === 'dark' ? 'text-white/70' : 'text-slate-600'
            }`}
          >
            {description}
          </p>
        )}
      </div>
    </Modal>
  );
}
