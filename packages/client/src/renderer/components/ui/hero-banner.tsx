/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { buttonInteraction } from '@/utils/animation-presets';
import type { ReactNode } from 'react';

interface HeroBannerProps {
  label?: string;
  title: string;
  description: string;
  gradient: string;
  pattern?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

/**
 * Apple-style Hero Banner
 * 参考 App Store Today 页面的精选横幅设计
 */
export function HeroBanner({
  label = '编辑推荐',
  title,
  description,
  gradient,
  pattern,
  action,
  icon,
}: HeroBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-[400px] rounded-[28px] overflow-hidden shadow-2xl"
    >
      {/* 渐变背景 */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />

      {/* 装饰图案 (可选) */}
      {pattern && (
        <div className="absolute inset-0 opacity-20">
          <img 
            src={pattern} 
            alt="" 
            className="w-full h-full object-cover mix-blend-overlay" 
          />
        </div>
      )}

      {/* 图案装饰 - 几何形状 */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
          <circle cx="350" cy="50" r="80" fill="white" />
          <circle cx="50" cy="350" r="100" fill="white" />
          <rect x="200" y="200" width="150" height="150" fill="white" transform="rotate(45 275 275)" />
        </svg>
      </div>

      {/* 内容层 */}
      <div className="relative z-10 h-full flex flex-col justify-end p-10 text-white">
        {/* 图标 (可选) */}
        {icon && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              {icon}
            </div>
          </motion.div>
        )}

        {/* 标签 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-[13px] uppercase tracking-wide font-semibold"
        >
          {label}
        </motion.p>

        {/* 标题 */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="mt-2 text-4xl font-bold tracking-tight"
        >
          {title}
        </motion.h2>

        {/* 描述 */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 0.9, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-3 text-[17px] leading-relaxed max-w-md"
        >
          {description}
        </motion.p>

        {/* 操作按钮 */}
        {action && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            className="
              mt-6 w-fit px-6 py-2.5 
              bg-white text-gray-900
              rounded-full 
              font-semibold text-[15px]
              shadow-lg
              transition-[transform,box-shadow] duration-250 ease-swift
            "
          >
            {action.label}
          </motion.button>
        )}
      </div>

      {/* 光晕效果 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
    </motion.div>
  );
}

/**
 * 分类标题组件
 */
interface CategoryHeaderProps {
  title: string;
  showAll?: () => void;
}

export function CategoryHeader({ title, showAll }: CategoryHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">
        {title}
      </h2>
      {showAll && (
        <motion.button
          {...buttonInteraction}
          onClick={showAll}
          className="
            text-[15px] 
            text-[var(--accent-strong)] 
            font-medium
            hover:underline
            transition-[text-decoration,transform] duration-250 ease-swift
          "
        >
          查看全部 →
        </motion.button>
      )}
    </div>
  );
}

/**
 * 横向滚动容器
 */
interface ScrollContainerProps {
  children: ReactNode;
}

export function ScrollContainer({ children }: ScrollContainerProps) {
  return (
    <div className="
      flex gap-4 overflow-x-auto pb-4 -mx-8 px-8
      scrollbar-hide
      snap-x snap-mandatory
    ">
      {children}
    </div>
  );
}
