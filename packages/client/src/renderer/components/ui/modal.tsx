/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { type ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { X } from 'lucide-react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  footer?: ReactNode;
  className?: string;
}

const SIZE_MAP = {
  sm: 'xs',
  md: 'sm',
  lg: 'md',
  xl: 'lg',
  full: 'xl',
} as const;

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
}: ModalProps) {
  return (
    <Dialog
      open={open}
      onClose={closeOnBackdrop ? onClose : undefined}
      maxWidth={SIZE_MAP[size]}
      fullWidth
      disableEscapeKeyDown={!closeOnEsc}
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      {(title || showCloseButton) && (
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {title && (
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          )}
          {showCloseButton && (
            <IconButton onClick={onClose} size="small" sx={{ ml: 'auto' }}>
              <X size={20} />
            </IconButton>
          )}
        </DialogTitle>
      )}

      <DialogContent sx={{ maxHeight: '70vh' }}>{children}</DialogContent>

      {footer && <DialogActions sx={{ px: 3, pb: 2 }}>{footer}</DialogActions>}
    </Dialog>
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
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button variant="outlined" onClick={onClose}>
            {cancelText}
          </Button>
          <Button
            variant="contained"
            color={confirmVariant === 'danger' ? 'error' : 'primary'}
            onClick={handleConfirm}
          >
            {confirmText}
          </Button>
        </Box>
      }
    >
      <Box>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
      </Box>
    </Modal>
  );
}
