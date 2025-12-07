'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, Star, Play, Pause, Settings, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PluginCardProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category?: string;
  tags?: string[];
  rating?: number;
  downloads?: number;
  version?: string;
  isOfficial?: boolean;
  isRunning?: boolean;
  isInstalled?: boolean;
  onInstall?: () => void;
  onLaunch?: () => void;
  onStop?: () => void;
  className?: string;
}

export function PluginCard({
  id,
  name,
  description,
  icon,
  category,
  tags = [],
  rating = 0,
  downloads = 0,
  version,
  isOfficial = false,
  isRunning = false,
  isInstalled = false,
  onInstall,
  onLaunch,
  onStop,
  className,
}: PluginCardProps) {
  const formatDownloads = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={14}
        className={cn(
          'transition-colors',
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300 dark:text-neutral-600'
        )}
      />
    ));
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(
        'group relative overflow-hidden rounded-xl border bg-card transition-all duration-300',
        'hover:border-primary-300 dark:hover:border-primary-700',
        'hover:shadow-md dark:hover:shadow-lg',
        className
      )}
    >
      {/* 官方标记彩带 */}
      {isOfficial && (
        <div className="absolute -left-8 top-6 z-10 w-32 rotate-[-45deg] bg-success-500 py-1 text-center text-xs font-medium text-white shadow-md">
          官方
        </div>
      )}

      {/* 顶部渐变装饰条 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100" />

      <div className="p-6">
        {/* 头部：图标 + 标签 */}
        <div className="mb-4 flex items-start justify-between">
          {/* 图标 */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
            className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-lg"
          >
            {icon}
          </motion.div>

          {/* 右上角标签 */}
          <div className="flex flex-col items-end gap-1">
            {rating > 0 && (
              <div className="flex items-center gap-1">
                {renderStars(rating)}
                <span className="ml-1 text-xs font-medium text-neutral-600 dark:text-neutral-400">
                  {rating.toFixed(1)}
                </span>
              </div>
            )}
            {category && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                {category}
              </span>
            )}
          </div>
        </div>

        {/* 标题和描述 */}
        <div className="mb-4">
          <h3 className="mb-1 text-lg font-semibold text-foreground transition-colors group-hover:text-primary-600 dark:group-hover:text-primary-400">
            {name}
          </h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
        </div>

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-neutral-100 px-2 py-1 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 底部：统计信息 */}
        <div className="mb-4 flex items-center gap-4 text-xs text-muted-foreground">
          {downloads > 0 && (
            <div className="flex items-center gap-1">
              <Download size={14} />
              <span>{formatDownloads(downloads)}</span>
            </div>
          )}
          {version && (
            <div className="flex items-center gap-1">
              <span>v{version}</span>
            </div>
          )}
          {isRunning && (
            <div className="flex items-center gap-1 text-success-500">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
              <span className="font-medium">运行中</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {isInstalled ? (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={isRunning ? onStop : onLaunch}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                  isRunning
                    ? 'bg-warning-500 text-white hover:bg-warning-600'
                    : 'bg-primary-500 text-white hover:bg-primary-600 shadow-glow'
                )}
              >
                {isRunning ? (
                  <>
                    <Pause size={16} />
                    停止
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    启动
                  </>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
              >
                <Settings size={16} />
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={onInstall}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-600 shadow-glow"
              >
                <Download size={16} />
                安装
              </motion.button>
              <Link href={`/tools/market/${id}`}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center justify-center rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <ExternalLink size={16} />
                </motion.button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// 骨架屏加载状态
export function PluginCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="h-14 w-14 animate-pulse rounded-xl bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="mb-4 space-y-2">
        <div className="h-5 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="mb-4 flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-6 w-20 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="mb-4 flex items-center gap-4">
        <div className="h-4 w-12 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      </div>

      <div className="flex gap-2">
        <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
        <div className="h-10 w-10 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800" />
      </div>
    </div>
  );
}
