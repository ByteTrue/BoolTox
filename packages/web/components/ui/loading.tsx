/**
 * Loading 加载组件库
 * 提供多种加载指示器，满足不同场景需求
 */

import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 旋转 Spinner（默认）
 */
export function Spinner({ size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={`${sizeClasses[size]} border-4 border-neutral-200 dark:border-neutral-700 border-t-primary-500 rounded-full ${className}`}
      aria-label="加载中"
    />
  );
}

/**
 * 图标旋转 Spinner（使用 Lucide 图标）
 */
export function IconSpinner({ size = 'md', className = '' }: LoadingProps) {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <Loader2
      size={sizeMap[size]}
      className={`animate-spin text-primary-500 ${className}`}
      aria-label="加载中"
    />
  );
}

/**
 * 三点跳跃动画
 */
export function LoadingDots({ size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotVariants = {
    animate: (i: number) => ({
      y: [-8, 0, -8],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        delay: i * 0.1,
        ease: 'easeInOut' as const,
      },
    }),
  };

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="加载中">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          custom={i}
          variants={dotVariants}
          animate="animate"
          className={`${sizeClasses[size]} rounded-full bg-primary-500`}
        />
      ))}
    </div>
  );
}

/**
 * 脉冲加载（柔和）
 */
export function LoadingPulse({ size = 'md', className = '' }: LoadingProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={`${sizeClasses[size]} rounded-full bg-primary-500 ${className}`}
      aria-label="加载中"
    />
  );
}

/**
 * 进度条（不确定模式）
 */
export function LoadingBar({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-1 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden ${className}`}>
      <motion.div
        animate={{
          x: ['-100%', '400%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="h-full w-1/3 bg-primary-500 rounded-full"
        aria-label="加载中"
      />
    </div>
  );
}

/**
 * 内联加载（文本+图标）
 */
interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function InlineLoading({ text = '加载中...', size = 'md' }: InlineLoadingProps) {
  return (
    <div className="flex items-center gap-2">
      <IconSpinner size={size} />
      <span className="text-neutral-600 dark:text-neutral-400">{text}</span>
    </div>
  );
}

/**
 * 全屏加载遮罩
 */
export function LoadingOverlay({ text = '加载中...' }: { text?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 dark:bg-neutral-950/80 backdrop-blur-sm"
    >
      <Spinner size="lg" className="mb-4" />
      <p className="text-neutral-700 dark:text-neutral-300 font-medium">{text}</p>
    </motion.div>
  );
}

/**
 * 卡片内加载（用于卡片刷新时）
 */
export function CardLoading() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Spinner size="md" className="mb-3" />
      <p className="text-sm text-neutral-600 dark:text-neutral-400">加载中...</p>
    </div>
  );
}

/**
 * 页面加载（用于整个页面加载时）
 */
export function PageLoading({ text = '加载中...' }: { text?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Spinner size="lg" className="mb-4" />
      <p className="text-neutral-700 dark:text-neutral-300 font-medium">{text}</p>
    </div>
  );
}

/**
 * 按钮内加载（替换按钮内容）
 */
export function ButtonLoading({ text = '处理中...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
      />
      <span>{text}</span>
    </div>
  );
}
