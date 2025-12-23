/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * MUI Snackbar/Toast 组件包装器
 */

import React, { useState, createContext, useContext, useCallback } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert, { type AlertColor } from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import LinearProgress from '@mui/material/LinearProgress';
import IconButton from '@mui/material/IconButton';
import { X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface AppToastProps {
  /** 是否打开 */
  open: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 类型 */
  type?: ToastType;
  /** 标题 */
  title?: string;
  /** 消息内容 */
  message: string;
  /** 自动隐藏时间（毫秒），0 表示不自动隐藏 */
  duration?: number;
  /** 位置 */
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  /** 是否显示进度条 */
  showProgress?: boolean;
  /** 进度值（0-100） */
  progress?: number;
}

const typeToSeverity: Record<ToastType, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

/**
 * 应用 Toast 组件
 * 基于 MUI Snackbar + Alert
 *
 * @example
 * ```tsx
 * <AppToast
 *   open={showToast}
 *   onClose={() => setShowToast(false)}
 *   type="success"
 *   message="操作成功"
 * />
 * ```
 */
export function AppToast({
  open,
  onClose,
  type = 'info',
  title,
  message,
  duration = 5000,
  position = { vertical: 'bottom', horizontal: 'right' },
  showProgress = false,
  progress,
}: AppToastProps) {
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    onClose();
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={duration || null}
      onClose={handleClose}
      anchorOrigin={position}
    >
      <Alert
        severity={typeToSeverity[type]}
        onClose={onClose}
        sx={{ minWidth: 280 }}
        action={
          <IconButton size="small" aria-label="关闭" color="inherit" onClick={onClose}>
            <X size={16} />
          </IconButton>
        }
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
        {showProgress && progress !== undefined && (
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mt: 1 }}
          />
        )}
      </Alert>
    </Snackbar>
  );
}

/**
 * Toast 上下文和 Hook
 */
interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  show: (options: Omit<ToastItem, 'id'>) => string;
  info: (message: string, title?: string, duration?: number) => string;
  success: (message: string, title?: string, duration?: number) => string;
  warning: (message: string, title?: string, duration?: number) => string;
  error: (message: string, title?: string, duration?: number) => string;
  remove: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((options: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...options, id }]);
    return id;
  }, []);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const info = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'info', message, title, duration }),
    [show]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'success', message, title, duration }),
    [show]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'warning', message, title, duration }),
    [show]
  );

  const error = useCallback(
    (message: string, title?: string, duration?: number) =>
      show({ type: 'error', message, title, duration }),
    [show]
  );

  const value: ToastContextValue = {
    show,
    info,
    success,
    warning,
    error,
    remove,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toasts.map(toast => (
        <AppToast
          key={toast.id}
          open={true}
          onClose={() => remove(toast.id)}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
        />
      ))}
    </ToastContext.Provider>
  );
}

/**
 * Toast Hook
 */
export function useAppToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useAppToast must be used within AppToastProvider');
  }
  return context;
}

// 导出别名
export { AppToast as Toast };
export { AppToastProvider as ToastProvider };
export { useAppToast as useToast };
