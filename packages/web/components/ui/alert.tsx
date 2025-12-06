/**
 * Alert 警告提示组件
 * 用于页面内的信息、警告、错误、成功提示
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, XCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertProps {
  type: AlertType;
  title?: string;
  message: string;
  onClose?: () => void;
  closable?: boolean;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const alertConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-primary-50 dark:bg-primary-900/20',
    borderColor: 'border-l-primary-500',
    iconColor: 'text-primary-600 dark:text-primary-400',
    titleColor: 'text-primary-900 dark:text-primary-100',
    textColor: 'text-primary-700 dark:text-primary-300',
    buttonColor: 'text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300',
  },
  success: {
    icon: CheckCircle,
    bgColor: 'bg-success-50 dark:bg-success-900/20',
    borderColor: 'border-l-success-500',
    iconColor: 'text-success-600 dark:text-success-400',
    titleColor: 'text-success-900 dark:text-success-100',
    textColor: 'text-success-700 dark:text-success-300',
    buttonColor: 'text-success-600 dark:text-success-400 hover:text-success-700 dark:hover:text-success-300',
  },
  warning: {
    icon: AlertCircle,
    bgColor: 'bg-warning-50 dark:bg-warning-900/20',
    borderColor: 'border-l-warning-500',
    iconColor: 'text-warning-600 dark:text-warning-400',
    titleColor: 'text-warning-900 dark:text-warning-100',
    textColor: 'text-warning-700 dark:text-warning-300',
    buttonColor: 'text-warning-600 dark:text-warning-400 hover:text-warning-700 dark:hover:text-warning-300',
  },
  error: {
    icon: XCircle,
    bgColor: 'bg-error-50 dark:bg-error-900/20',
    borderColor: 'border-l-error-500',
    iconColor: 'text-error-600 dark:text-error-400',
    titleColor: 'text-error-900 dark:text-error-100',
    textColor: 'text-error-700 dark:text-error-300',
    buttonColor: 'text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300',
  },
};

export function Alert({
  type,
  title,
  message,
  onClose,
  closable = false,
  className = '',
  action,
}: AlertProps) {
  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "rounded-xl border-l-4 p-4",
        config.bgColor,
        config.borderColor,
        className
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        {/* 图标 */}
        <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", config.iconColor)} />

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={cn("font-semibold mb-1", config.titleColor)}>
              {title}
            </h4>
          )}
          <p className={cn("text-sm leading-relaxed", config.textColor)}>
            {message}
          </p>

          {/* 操作按钮 */}
          {action && (
            <motion.button
              onClick={action.onClick}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "mt-3 text-sm font-medium underline transition-colors",
                config.buttonColor
              )}
            >
              {action.label}
            </motion.button>
          )}
        </div>

        {/* 关闭按钮 */}
        {closable && onClose && (
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className={cn(
              "flex-shrink-0 p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors",
              config.iconColor
            )}
            aria-label="关闭"
          >
            <X size={16} />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * 预设的 Alert 变体
 */
export function InfoAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="info" {...props} />;
}

export function SuccessAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="success" {...props} />;
}

export function WarningAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="warning" {...props} />;
}

export function ErrorAlert(props: Omit<AlertProps, 'type'>) {
  return <Alert type="error" {...props} />;
}
