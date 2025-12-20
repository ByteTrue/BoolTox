/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * ShineButton - 光泽扫过按钮组件
 *
 * 实现 Apple 风格的按钮光泽扫过效果：
 * - Hover 时光泽横扫
 * - 可配置扫过方向和速度
 * - 多种预设样式
 * - 支持禁用和加载状态
 */

import { motion } from 'framer-motion';
import { buttonShinePresets } from '@/utils/fluid-animations';
import { useTheme } from '../theme-provider';
import { CSSProperties, type ReactNode } from 'react';

export interface ShineButtonProps {
  children: ReactNode;
  /** 按钮类型 */
  variant?: 'primary' | 'secondary' | 'ghost';
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 光泽预设 */
  shinePreset?: 'fast' | 'default' | 'slow' | 'diagonal' | 'vertical';
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否加载中 */
  loading?: boolean;
  /** 是否全宽 */
  fullWidth?: boolean;
  /** 类名 */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
  /** 点击事件 */
  onClick?: () => void;
}

/**
 * ShineButton 组件
 *
 * @example
 * <ShineButton variant="primary" shinePreset="fast">
 *   Click Me
 * </ShineButton>
 */
export function ShineButton({
  children,
  variant = 'primary',
  size = 'md',
  shinePreset = 'default',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  style = {},
  onClick,
}: ShineButtonProps) {
  const { theme } = useTheme();

  // 获取光泽动画配置
  const shineConfig = buttonShinePresets[shinePreset];

  // 尺寸样式
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  }[size];

  // 变体样式
  const variantStyles: Record<string, CSSProperties> = {
    primary: {
      background:
        theme === 'dark'
          ? 'linear-gradient(135deg, rgba(101, 187, 233, 0.9) 0%, rgba(81, 169, 213, 0.9) 100%)'
          : 'linear-gradient(135deg, rgba(101, 187, 233, 1) 0%, rgba(81, 169, 213, 1) 100%)',
      color: 'white',
      border: 'none',
      boxShadow:
        theme === 'dark'
          ? '0 4px 12px rgba(101, 187, 233, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)'
          : '0 4px 12px rgba(101, 187, 233, 0.4), 0 2px 4px rgba(0, 0, 0, 0.1)',
    },
    secondary: {
      background: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)',
      border:
        theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
      boxShadow:
        theme === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
    },
    ghost: {
      background: 'transparent',
      color: theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      border: 'none',
      boxShadow: 'none',
    },
  };

  const baseStyle: CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: '12px',
    fontWeight: 600,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled || loading ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    ...variantStyles[variant],
    ...style,
  };

  return (
    <motion.button
      className={`relative inline-flex items-center justify-center ${sizeClasses} ${className}`}
      style={baseStyle}
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
    >
      {/* 光泽层 */}
      {!disabled && !loading && (
        <motion.div
          className="pointer-events-none absolute inset-0"
          style={shineConfig.gradient}
          variants={shineConfig.variants}
          initial="initial"
          whileHover="hover"
        />
      )}

      {/* 内容 */}
      <span className="relative z-10 flex items-center gap-2">
        {loading && (
          <motion.div
            className="h-4 w-4 rounded-full border-2 border-current border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {children}
      </span>
    </motion.button>
  );
}

/**
 * ShineButtonGroup - 按钮组容器
 */
export interface ShineButtonGroupProps {
  children: ReactNode;
  className?: string;
  /** 布局方向 */
  direction?: 'horizontal' | 'vertical';
  /** 间距 */
  gap?: 'sm' | 'md' | 'lg';
}

export function ShineButtonGroup({
  children,
  className = '',
  direction = 'horizontal',
  gap = 'md',
}: ShineButtonGroupProps) {
  const directionClass = direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const gapClass = {
    sm: 'gap-2',
    md: 'gap-3',
    lg: 'gap-4',
  }[gap];

  return <div className={`flex ${directionClass} ${gapClass} ${className}`}>{children}</div>;
}
