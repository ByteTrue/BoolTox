/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Toast 通知组件
 * 
 * Apple 风格的 Toast 通知，支持：
 * - 从右侧滑入动画
 * - 4 种类型：info/success/warning/error
 * - 自动消失（可配置延迟）
 * - 玻璃态背景
 * - 进度条指示器
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toastVariants } from '../../utils/micro-interactions';
import { getGlassStyle } from '../../utils/glass-layers';
import { getBlurStyle } from '../../utils/blur-effects';
import { useTheme } from '../theme-provider';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  description?: string;
  duration?: number; // 自动消失延迟（毫秒），0 表示不自动消失
  onClose?: () => void;
}

const ICON_MAP = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const COLOR_MAP = {
  info: {
    light: 'rgb(101, 187, 233)', // brand-blue-400
    dark: 'rgb(101, 187, 233)',
  },
  success: {
    light: 'rgb(52, 211, 153)', // brand-green-400
    dark: 'rgb(52, 211, 153)',
  },
  warning: {
    light: 'rgb(251, 191, 36)', // brand-yellow-400
    dark: 'rgb(251, 191, 36)',
  },
  error: {
    light: 'rgb(248, 113, 113)', // brand-red-400
    dark: 'rgb(248, 113, 113)',
  },
};

export function Toast({
  id,
  type = 'info',
  title,
  description,
  duration = 5000,
  onClose,
}: ToastProps) {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration === 0) return;

    const startTime = Date.now();
    const endTime = startTime + duration;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / duration) * 100;
      
      setProgress(newProgress);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        onClose?.();
      }
    };

    requestAnimationFrame(updateProgress);
  }, [duration, onClose]);

  const Icon = ICON_MAP[type];
  const iconColor = COLOR_MAP[type][theme];

  return (
    <motion.div
      key={id}
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="relative w-80 overflow-hidden rounded-2xl border shadow-xl"
      style={{
        ...getGlassStyle('MODAL', theme),
        ...getBlurStyle('tooltip', theme, 'strong'),
      }}
    >
      {/* 进度条 */}
      {duration > 0 && (
        <motion.div
          className="absolute top-0 left-0 h-1 rounded-full"
          style={{
            width: `${progress}%`,
            backgroundColor: iconColor,
          }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: duration / 1000, ease: 'linear' }}
        />
      )}

      {/* 内容区 */}
      <div className="flex items-start gap-3 p-4 pt-5">
        {/* 图标 */}
        <div
          className="flex-shrink-0 mt-0.5"
          style={{ color: iconColor }}
        >
          <Icon size={20} />
        </div>

        {/* 文本内容 */}
        <div className="flex-1 min-w-0">
          <h4
            className={`font-semibold text-sm mb-0.5 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {title}
          </h4>
          {description && (
            <p
              className={`text-xs leading-relaxed ${
                theme === 'dark' ? 'text-white/60' : 'text-slate-600'
              }`}
            >
              {description}
            </p>
          )}
        </div>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-lg transition-colors ${
            theme === 'dark'
              ? 'hover:bg-white/10 text-white/60 hover:text-white'
              : 'hover:bg-black/5 text-slate-400 hover:text-slate-600'
          }`}
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  );
}

/**
 * Toast 容器组件
 * 用于管理多个 Toast 通知
 */
export interface ToastContainerProps {
  toasts: ToastProps[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const POSITION_CLASSES = {
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4',
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
};

export function ToastContainer({
  toasts,
  onRemove,
  position = 'top-right',
}: ToastContainerProps) {
  return (
    <div
      className={`fixed ${POSITION_CLASSES[position]} z-[9999] flex flex-col gap-3 pointer-events-none`}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast {...toast} onClose={() => onRemove(toast.id)} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Toast Hook
 * 便捷的 Toast 调用接口
 */
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const show = (options: Omit<ToastProps, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...options, id }]);
    return id;
  };

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
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
