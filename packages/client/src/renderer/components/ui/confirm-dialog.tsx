/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useId } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
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
 * 通用确认对话框
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
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      aria-labelledby={dialogTitleId}
      aria-describedby={description ? dialogDescriptionId : undefined}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 },
      }}
    >
      <DialogTitle
        id={dialogTitleId}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pr: 1,
        }}
      >
        {title}
        <IconButton
          size="small"
          onClick={onCancel}
          disabled={loading}
          aria-label="关闭"
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      {description && (
        <DialogContent>
          <DialogContentText id={dialogDescriptionId}>
            {description}
          </DialogContentText>
        </DialogContent>
      )}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onCancel}
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          variant="contained"
          color={tone === 'danger' ? 'error' : 'primary'}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {loading ? '处理中...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
