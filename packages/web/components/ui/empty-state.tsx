/**
 * 优雅的空状态组件
 * 用于引导用户采取行动
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { fadeIn, staggerContainer, staggerItem } from '@/lib/animation-config';

interface EmptyStateProps {
  icon?: React.ReactNode;
  emoji?: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  suggestions?: {
    icon: React.ReactNode;
    label: string;
    href: string;
  }[];
}

export function EmptyState({
  icon,
  emoji,
  title,
  description,
  action,
  secondaryAction,
  suggestions,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      {/* 图标或 Emoji */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.1 }}
        className="mb-6"
      >
        {emoji ? (
          <div className="text-6xl md:text-7xl">{emoji}</div>
        ) : icon ? (
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 dark:text-neutral-500">
            {icon}
          </div>
        ) : null}
      </motion.div>

      {/* 文本 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="max-w-md space-y-2"
      >
        <h3 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          {title}
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {description}
        </p>
      </motion.div>

      {/* 操作按钮 */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 mt-8"
        >
          {action && (
            <div>
              {action.href ? (
                <Link
                  href={action.href}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all active:scale-95"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  onClick={action.onClick}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all active:scale-95"
                >
                  {action.label}
                </button>
              )}
            </div>
          )}

          {secondaryAction && (
            <div>
              {secondaryAction.href ? (
                <Link
                  href={secondaryAction.href}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
                >
                  {secondaryAction.label}
                </Link>
              ) : (
                <button
                  onClick={secondaryAction.onClick}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all active:scale-95"
                >
                  {secondaryAction.label}
                </button>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 建议 */}
      {suggestions && suggestions.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="w-full max-w-xl mt-12"
        >
          <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4">
            或者尝试：
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {suggestions.map((suggestion, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Link
                  href={suggestion.href}
                  className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft transition-all group"
                >
                  <div className="text-neutral-600 dark:text-neutral-400 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                    {suggestion.icon}
                  </div>
                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {suggestion.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * 预设的空状态变体
 */
export function NoPluginsInstalled() {
  return (
    <EmptyState
      emoji="📦"
      title="还没有安装任何插件"
      description="从插件市场选择你需要的工具，一键安装即可使用"
      action={{
        label: "浏览插件市场",
        href: "/tools/market",
      }}
      suggestions={[
        { icon: <span>🍅</span>, label: "番茄钟", href: "/tools/market/com.booltox.pomodoro" },
        { icon: <span>📋</span>, label: "剪贴板管理", href: "/tools/market" },
      ]}
    />
  );
}

export function NoSearchResults({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      emoji="🔍"
      title="未找到匹配的插件"
      description="试试使用其他关键词，或浏览所有插件"
      action={{
        label: "清除搜索",
        onClick: onClear,
      }}
      secondaryAction={{
        label: "浏览全部",
        href: "/tools/market",
      }}
    />
  );
}

export function AgentNotInstalled() {
  return (
    <EmptyState
      emoji="🤖"
      title="需要安装 BoolTox Agent"
      description="Agent 是一个轻量级的本地服务，为插件提供系统权限和后端支持"
      action={{
        label: "查看安装指南",
        href: "#agent-installer",
      }}
    />
  );
}
