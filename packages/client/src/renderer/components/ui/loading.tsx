/**
 * LoadingSpinner - 加载动画组件
 * 
 * Apple 风格的加载指示器
 */

import { motion } from 'framer-motion';
import { getSpinnerStyle, getDotsAnimationConfig, getPulseStyle } from '@/utils/detail-polish';
import { useTheme } from '../theme-provider';
import { CSSProperties } from 'react';

export interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: string;
  /** 速度 (秒) */
  speed?: number;
  /** 类名 */
  className?: string;
}

/**
 * LoadingSpinner - 旋转 Spinner
 * 
 * @example
 * <LoadingSpinner size="md" />
 */
export function LoadingSpinner({
  size = 'md',
  color,
  speed = 0.8,
  className = '',
}: LoadingSpinnerProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      className={className}
      style={getSpinnerStyle(theme, { size, color, speed })}
      animate={{ rotate: 360 }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

/**
 * LoadingDots - 三点跳跃动画
 */
export interface LoadingDotsProps {
  /** 尺寸 */
  size?: 'sm' | 'md' | 'lg';
  /** 颜色 */
  color?: string;
  /** 速度 */
  speed?: number;
  /** 类名 */
  className?: string;
}

export function LoadingDots({
  size = 'md',
  color,
  speed = 1.2,
  className = '',
}: LoadingDotsProps) {
  const { theme } = useTheme();

  const sizeMap = {
    sm: 6,
    md: 8,
    lg: 10,
  };

  const dotSize = sizeMap[size];
  const dotColor = color || (theme === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)');

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          animate={{
            y: [-8, 0, -8],
          }}
          transition={{
            duration: speed,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index * (speed / 6),
          }}
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: dotColor,
          }}
        />
      ))}
    </div>
  );
}

/**
 * LoadingPulse - 脉冲动画
 */
export interface LoadingPulseProps {
  /** 尺寸 */
  size?: number;
  /** 颜色 */
  color?: string;
  /** 速度 */
  speed?: number;
  /** 类名 */
  className?: string;
}

export function LoadingPulse({
  size = 40,
  color,
  speed = 1.5,
  className = '',
}: LoadingPulseProps) {
  const { theme } = useTheme();

  return (
    <motion.div
      className={`rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        ...getPulseStyle(theme, { color, speed }),
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1],
      }}
      transition={{
        duration: speed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

/**
 * LoadingProgress - 进度条动画
 */
export interface LoadingProgressProps {
  /** 进度 (0-100) */
  progress?: number;
  /** 是否为不确定状态 */
  indeterminate?: boolean;
  /** 高度 */
  height?: number;
  /** 颜色 */
  color?: string;
  /** 类名 */
  className?: string;
}

export function LoadingProgress({
  progress = 0,
  indeterminate = false,
  height = 4,
  color,
  className = '',
}: LoadingProgressProps) {
  const { theme } = useTheme();

  const bgColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
  const barColor = color || (theme === 'dark' ? 'rgba(101, 187, 233, 0.8)' : 'rgba(0, 122, 255, 0.8)');

  return (
    <div
      className={`w-full rounded-full overflow-hidden ${className}`}
      style={{
        height,
        backgroundColor: bgColor,
      }}
    >
      {indeterminate ? (
        <motion.div
          className="h-full rounded-full"
          style={{
            width: '30%',
            backgroundColor: barColor,
          }}
          animate={{
            x: ['-100%', '400%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ) : (
        <motion.div
          className="h-full rounded-full"
          style={{
            backgroundColor: barColor,
          }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
}

/**
 * LoadingOverlay - 全屏加载遮罩
 */
export interface LoadingOverlayProps {
  /** 是否显示 */
  show: boolean;
  /** 加载文本 */
  text?: string;
  /** 是否模糊背景 */
  blur?: boolean;
  /** 类名 */
  className?: string;
}

export function LoadingOverlay({
  show,
  text = '加载中...',
  blur = true,
  className = '',
}: LoadingOverlayProps) {
  const { theme } = useTheme();

  if (!show) return null;

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center ${className}`}
      style={{
        backgroundColor: theme === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.8)',
        backdropFilter: blur ? 'blur(8px)' : 'none',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className={`flex flex-col items-center gap-4 p-8 rounded-2xl ${
          theme === 'dark' ? 'bg-slate-800/90' : 'bg-white/90'
        }`}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <LoadingSpinner size="lg" />
        {text && (
          <p className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
            {text}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

/**
 * LoadingInline - 内联加载指示器
 */
export interface LoadingInlineProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingInline({
  text = '加载中',
  size = 'sm',
  className = '',
}: LoadingInlineProps) {
  const { theme } = useTheme();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <LoadingSpinner size={size} />
      <span className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
        {text}
      </span>
    </div>
  );
}
