"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, useRef, type ReactNode } from 'react';
import { createLogger } from '@/lib/logger';

// --- 1. 定义 Toast 的数据结构和类型 ---

export interface Toast {
  id: string;
  message: string;
  type?: 'default' | 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (options: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

// --- 2. 创建 Toast 的 React Context ---

const ToastContext = createContext<ToastContextValue | null>(null);

const logger = createLogger('ToastContext');

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdCounterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((options: Omit<Toast, 'id'>) => {
    toastIdCounterRef.current += 1;
    const id = `toast-${Date.now()}-${toastIdCounterRef.current}`;
    const newToast: Toast = { ...options, id };

    setToasts(currentToasts => [...currentToasts, newToast]);

    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        removeToast(id);
      }, options.duration ?? 3000);
    } else {
      setTimeout(() => {
        removeToast(id);
      }, options.duration ?? 3000);
    }
  }, [removeToast]);;;;;;

  const value = useMemo<ToastContextValue>(() => ({
    toasts,
    showToast,
    removeToast,
  }), [toasts, showToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
}

// --- 3. 创建一个自定义 Hook 以方便使用 ---

export function useToast() {
  const context = useContext(ToastContext);
  if (context === null) {
    // 在开发模式下，我们返回一个模拟的 API，避免在 HostApiProvider 中崩溃
    if (process.env.NODE_ENV === 'development') {
      logger.warn('useToast called outside provider, returning mock API');
      return {
        toasts: [],
        showToast: (options: { message: string }) => logger.info('Mock toast', { message: options.message }),
        removeToast: (id: string) => logger.info('Mock remove toast', { id }),
      };
    }
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
