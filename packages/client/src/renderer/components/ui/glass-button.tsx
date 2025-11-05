/**
 * 玻璃拟态按钮组件
 * 从 glassmorphism-demo 提取的可复用按钮样式
 * 
 * v2.0: 增强微交互动画，符合 Apple 设计规范
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { getGlassStyle } from '../../utils/glass-layers';
import { buttonMicroInteraction, primaryButtonInteraction } from '../../utils/micro-interactions';

export type GlassButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type GlassButtonSize = 'sm' | 'md' | 'lg';

export interface GlassButtonProps {
  /**
   * 按钮变体
   */
  variant?: GlassButtonVariant;
  /**
   * 按钮大小
   */
  size?: GlassButtonSize;
  /**
   * 左侧图标
   */
  icon?: React.ReactNode;
  /**
   * 右侧图标
   */
  iconRight?: React.ReactNode;
  /**
   * 完整圆角
   */
  fullRounded?: boolean;
  /**
   * 子元素
   */
  children?: React.ReactNode;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 点击事件
   */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /**
   * 自定义类名
   */
  className?: string;
  /**
   * Form 属性
   */
  form?: string;
  /**
   * Type 属性
   */
  type?: 'button' | 'submit' | 'reset';
}

/**
 * 玻璃拟态按钮
 * 
 * @example
 * ```tsx
 * <GlassButton variant="primary" icon={<Star />}>主要按钮</GlassButton>
 * <GlassButton variant="danger" size="sm">删除</GlassButton>
 * <GlassButton variant="ghost" fullRounded>圆角按钮</GlassButton>
 * ```
 */
export function GlassButton({
  variant = 'primary',
  size = 'md',
  icon,
  iconRight,
  fullRounded = false,
  className = '',
  disabled,
  children,
  onClick,
  form,
  type = 'button',
}: GlassButtonProps) {
  const { theme } = useTheme();
  
  // 尺寸映射
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // 变体样式
  const getVariantStyles = () => {
    const baseStyle = getGlassStyle('BUTTON', theme, { withBorderGlow: true, withInnerShadow: true });
    
    switch (variant) {
      case 'primary':
        return {
          className: 'text-brand-blue-400 dark:text-brand-blue-400 hover:bg-brand-blue-400/20 shadow-unified-md dark:shadow-unified-md-dark hover:shadow-unified-lg dark:hover:shadow-unified-lg-dark',
          style: baseStyle,  // 使用统一的玻璃边框
        };
      
      case 'secondary':
        return {
          className: theme === 'dark'
            ? 'text-white/80 hover:bg-white/10 shadow-unified-sm-dark hover:shadow-unified-md-dark'
            : 'text-slate-700 hover:bg-slate-200/60 shadow-unified-sm hover:shadow-unified-md',
          style: baseStyle,
        };
      
      case 'success':
        return {
          className: theme === 'dark'
            ? 'text-green-400 hover:bg-green-500/20 shadow-unified-md-dark hover:shadow-unified-lg-dark'
            : 'text-green-600 hover:bg-green-500/20 shadow-unified-md hover:shadow-unified-lg',
          style: {
            ...baseStyle,
            borderColor: theme === 'dark' ? 'rgba(34, 197, 94, 0.4)' : 'rgba(22, 163, 74, 0.4)',
          },
        };
      
      case 'danger':
        return {
          className: theme === 'dark'
            ? 'text-red-400 hover:bg-red-500/20 shadow-unified-md-dark hover:shadow-unified-lg-dark'
            : 'text-red-600 hover:bg-red-500/20 shadow-unified-md hover:shadow-unified-lg',
          style: {
            ...baseStyle,
            borderColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.4)',
          },
        };
      
      case 'ghost':
        return {
          className: theme === 'dark'
            ? 'text-white/60 hover:text-white/80 hover:bg-white/5 shadow-unified-sm-dark hover:shadow-unified-md-dark'
            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100/60 shadow-unified-sm hover:shadow-unified-md',
          style: baseStyle,
        };
      
      default:
        return {
          className: '',
          style: baseStyle,
        };
    }
  };

  const variantStyles = getVariantStyles();
  
  // 根据变体选择不同的交互动画
  const interactionAnimation = variant === 'primary' ? primaryButtonInteraction : buttonMicroInteraction;

  return (
    <motion.button
      {...interactionAnimation}
      type={type}
      onClick={onClick}
      form={form}
      className={`
        group inline-flex items-center justify-center gap-2 border font-semibold 
        transition-[background-color,border-color,color,transform] duration-250 ease-swift
        disabled:opacity-50 disabled:cursor-not-allowed
        button-tap-optimized
        ${fullRounded ? 'rounded-full' : 'rounded-lg'}
        ${sizeClasses[size]}
        ${variantStyles.className}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
      style={variantStyles.style}
      disabled={disabled}
    >
      {icon && (
        <span className={`inline-flex transition-transform group-hover:rotate-12 gpu-accelerated ${iconSizeClasses[size]}`}>
          {icon}
        </span>
      )}
      {children && <span>{children}</span>}
      {iconRight && (
        <span className={`inline-flex ${iconSizeClasses[size]}`}>
          {iconRight}
        </span>
      )}
    </motion.button>
  );
}
