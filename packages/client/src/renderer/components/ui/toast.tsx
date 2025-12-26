/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useState } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Slide from '@mui/material/Slide';
import type { SlideProps } from '@mui/material/Slide';
import { X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number;
  onClose?: () => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="left" />;
}

export function Toast({
  id,
  type = 'info',
  title,
  description,
  duration = 5000,
  onClose,
}: ToastProps) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (duration === 0) return;
    const timer = setTimeout(() => {
      setOpen(false);
      onClose?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  return (
    <Snackbar
      key={id}
      open={open}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        severity={type}
        variant="filled"
        onClose={handleClose}
        sx={{
          width: 320,
          borderRadius: 2,
          boxShadow: 4,
        }}
        action={
          <IconButton size="small" color="inherit" onClick={handleClose}>
            <X size={16} />
          </IconButton>
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
        {description && <Box sx={{ fontSize: '0.8125rem' }}>{description}</Box>}
      </Alert>
    </Snackbar>
  );
}

/**
 * Toast 容器组件
 */
export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export function ToastContainer({ toasts, onRemove, position = 'top-right' }: ToastContainerProps) {
  return (
    <Box
      sx={{
        position: 'fixed',
        zIndex: 9999,
        top: position.startsWith('top') ? 16 : 'auto',
        bottom: position.startsWith('bottom') ? 16 : 'auto',
        right: position.endsWith('right') ? 16 : 'auto',
        left: position.endsWith('left') ? 16 : 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(toast => (
        <Box key={toast.id} sx={{ pointerEvents: 'auto' }}>
          <Toast {...toast} onClose={() => onRemove(toast.id)} />
        </Box>
      ))}
    </Box>
  );
}

/**
 * Toast Hook
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const show = (options: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...options, id }]);
    return id;
  };

  const remove = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const info = (title: string, description?: string, duration?: number) =>
    show({ type: 'info', title, description, duration });

  const success = (title: string, description?: string, duration?: number) =>
    show({ type: 'success', title, description, duration });

  const warning = (title: string, description?: string, duration?: number) =>
    show({ type: 'warning', title, description, duration });

  const error = (title: string, description?: string, duration?: number) =>
    show({ type: 'error', title, description, duration });

  return {
    toasts,
    show,
    remove,
    info,
    success,
    warning,
    error,
  };
}
