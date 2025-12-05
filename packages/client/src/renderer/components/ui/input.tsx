/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Apple 风格输入框组件
 * 
 * 特性：
 * - Focus 光晕动画
 * - 玻璃拟态背景
 * - 字符计数器
 * - 错误状态提示
 * 
 * @version 2.0.0
 */

import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { getGlassStyle, GLASS_BORDERS } from '@/utils/glass-layers';
import { inputFocusVariants } from '@/utils/micro-interactions';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 错误信息
   */
  error?: string;
  /**
   * 成功状态
   */
  success?: boolean;
  /**
   * 帮助文本
   */
  helpText?: string;
  /**
   * 最大长度（显示字符计数）
   */
  maxLength?: number;
  /**
   * 是否显示字符计数
   */
  showCount?: boolean;
  /**
   * 输入框大小
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 左侧图标
   */
  leftIcon?: ReactNode;
  /**
   * 右侧图标
   */
  rightIcon?: ReactNode;
}

/**
 * Apple 风格输入框
 * 
 * @example
 * ```tsx
 * <Input
 *   label="用户名"
 *   placeholder="请输入用户名"
 *   maxLength={20}
 *   showCount
 * />
 * ```
 */
export function Input({
  label,
  error,
  success,
  helpText,
  maxLength,
  showCount = false,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  value,
  onChange,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const currentLength = typeof value === 'string' ? value.length : 0;

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  };

  const hasError = Boolean(error);
  const hasSuccess = success && !hasError;

  return (
    <div className={`w-full ${className}`}>
      {/* Label */}
      {label && (
        <label
          className={`block mb-2 text-sm font-medium ${
            hasError
              ? 'text-error-light dark:text-error-dark'
              : hasSuccess
              ? 'text-success-light dark:text-success-dark'
              : theme === 'dark'
              ? 'text-white'
              : 'text-slate-700'
          }`}
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <motion.div
        className="relative"
        variants={inputFocusVariants}
        initial="blur"
        animate={isFocused ? 'focus' : 'blur'}
      >
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className={`text-sm ${
              theme === 'dark' ? 'text-white/60' : 'text-slate-500'
            }`}>
              {leftIcon}
            </div>
          </div>
        )}

        {/* Input Element */}
        <input
          {...props}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={`
            w-full ${sizeClasses[size]} rounded-xl border
            font-medium outline-none
            transition-all duration-250
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || hasError || hasSuccess ? 'pr-10' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${
              hasError
                ? 'border-error-light dark:border-error-dark'
                : hasSuccess
                ? 'border-success-light dark:border-success-dark'
                : isFocused
                ? 'border-brand-blue-400 dark:border-brand-blue-400'
                : ''
            }
            ${
              theme === 'dark'
                ? 'bg-white/5 text-white placeholder:text-white/40'
                : 'bg-white/80 text-slate-800 placeholder:text-slate-400'
            }
            ${
              isFocused && !hasError
                ? 'shadow-[0_0_0_3px_rgba(101,187,233,0.1)] dark:shadow-[0_0_0_3px_rgba(101,187,233,0.15)]'
                : ''
            }
          `}
          style={{
            ...getGlassStyle('CARD', theme, {
              withBorderGlow: isFocused && !hasError,
              withInnerShadow: true,
            }),
            ...(!hasError && !hasSuccess && !isFocused && {
              borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
            })
          }}
        />

        {/* Right Icon / Status Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {hasError ? (
            <AlertCircle size={18} className="text-error-light dark:text-error-dark" />
          ) : hasSuccess ? (
            <CheckCircle2 size={18} className="text-success-light dark:text-success-dark" />
          ) : rightIcon ? (
            <div className={theme === 'dark' ? 'text-white/60' : 'text-slate-500'}>
              {rightIcon}
            </div>
          ) : null}
        </div>

        {/* Focus Ring Glow */}
        <AnimatePresence>
          {isFocused && !hasError && (
            <motion.div
              className="absolute inset-0 rounded-xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                boxShadow: '0 0 0 3px rgba(101, 187, 233, 0.1)',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      {/* Help Text / Error / Character Count */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className="text-xs text-error-light dark:text-error-dark"
            >
              {error}
            </motion.p>
          ) : helpText ? (
            <motion.p
              key="help"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
              className={`text-xs ${
                theme === 'dark' ? 'text-white/60' : 'text-slate-500'
              }`}
            >
              {helpText}
            </motion.p>
          ) : (
            <div key="empty" />
          )}
        </AnimatePresence>

        {/* Character Count */}
        {showCount && maxLength && (
          <motion.span
            className={`text-xs font-medium ${
              currentLength > maxLength * 0.9
                ? 'text-warning-light dark:text-warning-dark'
                : theme === 'dark'
                ? 'text-white/40'
                : 'text-slate-400'
            }`}
            animate={
              currentLength === maxLength
                ? { scale: [1, 1.1, 1], color: ['currentColor', '#FF3B30', 'currentColor'] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3 }}
          >
            {currentLength} / {maxLength}
          </motion.span>
        )}
      </div>
    </div>
  );
}
