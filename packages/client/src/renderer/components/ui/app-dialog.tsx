/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Dialog 组件包装器
 */

import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';
import { AppButton } from './button';

export interface AppDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 标题 */
  title?: string;
  /** 内容 */
  children: React.ReactNode;
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean;
  /** 点击背景关闭 */
  closeOnBackdrop?: boolean;
  /** ESC 关闭 */
  closeOnEsc?: boolean;
  /** 底部内容 */
  footer?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
  full: 'xl',
};

/**
 * 应用对话框组件
 * 基于 MUI Dialog
 *
 * @example
 * ```tsx
 * <AppDialog open={isOpen} onClose={handleClose} title="确认">
 *   <p>确定要删除吗？</p>
 * </AppDialog>
 * ```
 */
export function AppDialog({
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
}: AppDialogProps) {
  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (reason === 'backdropClick' && !closeOnBackdrop) return;
    if (reason === 'escapeKeyDown' && !closeOnEsc) return;
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={sizeMap[size]}
      fullWidth
      className={className}
    >
      {(title || showCloseButton) && (
        <DialogTitle
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
        >
          {title}
          {showCloseButton && (
            <IconButton aria-label="关闭" onClick={onClose} size="small" sx={{ ml: 2 }}>
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
      )}
      <DialogContent>{children}</DialogContent>
      {footer && <DialogActions>{footer}</DialogActions>}
    </Dialog>
  );
}

/**
 * 确认对话框组件
 */
export interface AppConfirmDialogProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 确认回调 */
  onConfirm: () => void;
  /** 标题 */
  title: string;
  /** 描述 */
  description?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮变体 */
  confirmVariant?: 'primary' | 'danger';
  /** 加载状态 */
  loading?: boolean;
}

export function AppConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  confirmVariant = 'primary',
  loading = false,
}: AppConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    if (!loading) onClose();
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <AppButton variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </AppButton>
          <AppButton variant={confirmVariant} onClick={handleConfirm} loading={loading}>
            {confirmText}
          </AppButton>
        </>
      }
    >
      {description && <p>{description}</p>}
    </AppDialog>
  );
}

// 导出别名
export { AppDialog as Modal };
export { AppConfirmDialog as ConfirmDialog };
