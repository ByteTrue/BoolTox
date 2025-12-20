/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  recommendations?: ReactNode;
}

/**
 * 空状态组件 - 用于引导用户操作
 * 遵循苹果液态玻璃设计风格
 */
export function EmptyState({
  icon,
  title,
  description,
  actions,
  recommendations,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* 图标 */}
      {icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="mb-6 text-[var(--text-tertiary)]"
        >
          {icon}
        </motion.div>
      )}

      {/* 标题 */}
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-xl font-semibold text-[var(--text-primary)] mb-3"
      >
        {title}
      </motion.h3>

      {/* 描述 */}
      {description && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm text-[var(--text-secondary)] max-w-md mb-8"
        >
          {description}
        </motion.p>
      )}

      {/* 操作按钮 */}
      {actions && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-wrap gap-3 justify-center"
        >
          {actions}
        </motion.div>
      )}

      {/* 推荐内容 */}
      {recommendations && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-12 w-full max-w-4xl"
        >
          {recommendations}
        </motion.div>
      )}
    </motion.div>
  );
}
