'use client';

import React from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type'], duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const showToast = React.useCallback((
    message: string,
    type: Toast['type'] = 'info',
    duration = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: Toast = { id, type, message, duration };

    setToasts(prev => [...prev, toast]);

    // 自动移除
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: AlertCircle,
  };

  const colors = {
    success: 'bg-success-50 dark:bg-success-900/30 border-success-200 dark:border-success-800/50 text-success-700 dark:text-success-400',
    error: 'bg-error-50 dark:bg-error-900/30 border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400',
    warning: 'bg-warning-50 dark:bg-warning-900/30 border-warning-200 dark:border-warning-800/50 text-warning-700 dark:text-warning-400',
    info: 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800/50 text-primary-700 dark:text-primary-400',
  };

  const progressColors = {
    success: 'bg-success-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
    info: 'bg-primary-500',
  };

  const Icon = icons[toast.type];

  const [isVisible, setIsVisible] = React.useState(false);
  const [shrinkProgress, setShrinkProgress] = React.useState(false);

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => {
      setIsVisible(true);
      if (toast.duration && toast.duration > 0) {
        setShrinkProgress(true);
      }
    });

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (toast.duration && toast.duration > 0) {
      timer = setTimeout(() => onClose(toast.id), toast.duration);
    }

    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
  }, [toast.duration, toast.id, onClose]);

  return (
    <div
      className={`relative pointer-events-auto transition-all duration-200 ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95'
      }`}
    >
      <div className={`flex items-center gap-3 min-w-[320px] max-w-md p-4 rounded-xl border-2 shadow-soft-lg ${colors[toast.type]}`}>
        <Icon size={20} className="flex-shrink-0" />
        <p className="flex-1 text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors active:scale-95"
          aria-label="关闭"
        >
          <X size={16} />
        </button>
      </div>

      {/* 进度条（倒计时） */}
      {toast.duration && toast.duration > 0 && (
        <div
          className={`absolute bottom-0 left-0 h-1 rounded-b-xl transition-[width] ease-linear ${progressColors[toast.type]}`}
          style={{
            width: shrinkProgress ? '0%' : '100%',
            transitionDuration: `${toast.duration}ms`,
          }}
        />
      )}
    </div>
  );
}
