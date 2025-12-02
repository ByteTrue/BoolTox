/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface SegmentOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
  badge?: string | number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 分段控制器组件 - 用于多选项切换
 * 苹果风格的流畅动画效果
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: SegmentedControlProps<T>) {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-4 py-1.5',
    lg: 'text-base px-5 py-2',
  };

  return (
    <div className="inline-flex rounded-full border border-[var(--shell-border)] bg-[var(--shell-surface)] p-1 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              relative flex items-center gap-2 rounded-full font-semibold
              transition-colors duration-200
              ${sizeClasses[size]}
              ${isActive ? 'text-[var(--accent-strong)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}
            `}
          >
            {/* 选中背景动画 */}
            {isActive && (
              <motion.div
                layoutId="segmented-control-bg"
                className="absolute inset-0 bg-[var(--accent-soft)] rounded-full"
                transition={{
                  type: 'spring',
                  stiffness: 500,
                  damping: 35,
                }}
              />
            )}

            {/* 内容 */}
            <span className="relative z-10 flex items-center gap-2">
              {option.icon}
              {option.label}
              {option.badge !== undefined && (
                <span className="rounded-full bg-[var(--shell-chip)] px-2 py-0.5 text-xs font-semibold">
                  {option.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
