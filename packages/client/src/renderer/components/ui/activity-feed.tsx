/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../theme-provider';
import { useActivityFeed } from '@/contexts';
import { formatRelativeTime, type ActivityFeedItem } from '@/content/activity-feed';
import { getGlassStyle, GLASS_BORDERS } from '@/utils/glass-layers';
import { cardHover, buttonInteraction } from '@/utils/animation-presets';
import { History, RefreshCw } from 'lucide-react';
import { ChangelogDrawer } from './changelog-drawer';

type ThemeMode = 'dark' | 'light';

export function ActivityFeed() {
  const { theme } = useTheme();
  const { items, loading, refreshing, refresh, error } = useActivityFeed();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>();

  const hasItems = items.length > 0;
  const latestItem = hasItems ? items[0] : undefined;

  const handleViewDetail = () => {
    if (!latestItem) return;
    setSelectedItemId(latestItem.id);
    setIsDrawerOpen(true);
  };

  const handleViewHistory = () => {
    setSelectedItemId(undefined);
    setIsDrawerOpen(true);
  };

  const handleRefresh = async () => {
    await refresh();
  };

  // 使用统一的玻璃边框，不再根据优先级改变边框颜色
  const glassStyle = getGlassStyle('CARD', theme);

  return (
    <>
      <motion.div
        {...cardHover}
        className="relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border p-8 transition-shadow duration-250 ease-swift hover:shadow-lg"
        style={glassStyle} // 使用统一的玻璃样式
      >
        {!loading && latestItem?.priority === 'high' ? (
          <div
            className="absolute inset-0 opacity-5"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(circle at 50% 50%, rgba(101, 187, 233, 0.3), transparent 70%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(101, 187, 233, 0.2), transparent 70%)',
            }}
          />
        ) : null}

        <div className="relative z-10 flex h-full flex-col gap-4">
          {!loading && error ? (
            <div
              className={`rounded-2xl border px-3 py-2 text-xs leading-relaxed ${
                theme === 'dark'
                  ? 'border-red-400/20 bg-red-500/10 text-red-200'
                  : 'border-red-200 bg-red-50 text-red-600'
              }`}
            >
              {hasItems ? '公告服务暂时不可用，当前展示缓存内容。' : error}
            </div>
          ) : null}

          {loading ? (
            <ActivityFeedSkeleton theme={theme} />
          ) : latestItem ? (
            <ActivityFeedContent
              theme={theme}
              latestItem={latestItem}
              itemCount={items.length}
              refreshing={refreshing}
              onViewDetail={handleViewDetail}
              onViewHistory={handleViewHistory}
              onRefresh={handleRefresh}
            />
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-sm">
              <p className={theme === 'dark' ? 'text-white/60' : 'text-slate-600'}>
                {error ?? '暂无公告'}
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {!loading && latestItem ? (
        <ChangelogDrawer
          open={isDrawerOpen}
          items={items}
          onClose={() => setIsDrawerOpen(false)}
          initialSelectedId={selectedItemId}
        />
      ) : null}
    </>
  );
}

function ActivityFeedSkeleton({ theme }: { theme: ThemeMode }) {
  const block = theme === 'dark' ? 'bg-white/10' : 'bg-slate-200';
  const text = theme === 'dark' ? 'bg-white/15' : 'bg-slate-200';

  return (
    <div className="flex h-full flex-col gap-6 animate-pulse">
      <div className="flex items-start gap-4">
        <div className={`h-14 w-14 rounded-xl ${block}`} />
        <div className="flex-1 space-y-3">
          <div className={`h-5 w-2/3 rounded ${text}`} />
          <div className={`h-4 w-1/4 rounded ${text}`} />
          <div className={`h-5 w-24 rounded ${text}`} />
        </div>
      </div>

      <div className="space-y-3">
        <div className={`h-4 w-full rounded ${text}`} />
        <div className={`h-4 w-11/12 rounded ${text}`} />
        <div className={`h-4 w-10/12 rounded ${text}`} />
        <div className={`h-4 w-9/12 rounded ${text}`} />
      </div>

      <div
        className="mt-auto flex flex-wrap items-center gap-3 border-t pt-2"
        style={{
          borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
        }}
      >
        <div className={`h-9 w-28 rounded-lg ${block}`} />
        <div className={`h-9 w-32 rounded-lg ${block}`} />
        <div className={`h-6 w-20 rounded-full ${block}`} />
      </div>
    </div>
  );
}

function ActivityFeedContent({
  theme,
  latestItem,
  itemCount,
  refreshing,
  onViewDetail,
  onViewHistory,
  onRefresh,
}: {
  theme: ThemeMode;
  latestItem: ActivityFeedItem;
  itemCount: number;
  refreshing: boolean;
  onViewDetail: () => void;
  onViewHistory: () => void;
  onRefresh: () => void;
}) {
  return (
    <>
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl text-3xl ${
            theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'
          }`}
        >
          {latestItem.icon || '📢'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="mb-2 flex items-start justify-between gap-3">
            <h3
              className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            >
              {latestItem.title}
            </h3>
            <span
              className={`text-xs whitespace-nowrap ${
                theme === 'dark' ? 'text-white/50' : 'text-slate-500'
              }`}
            >
              {formatRelativeTime(latestItem.timestamp)}
            </span>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
              latestItem.type === 'update'
                ? theme === 'dark'
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  : 'bg-blue-50 text-blue-600 border-blue-200'
                : theme === 'dark'
                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  : 'bg-purple-50 text-purple-600 border-purple-200'
            }`}
          >
            {latestItem.type === 'update' ? '更新日志' : '公告'}
          </span>
        </div>
      </div>

      <div className="flex-1 cursor-pointer overflow-hidden" onClick={onViewDetail}>
        <div
          className={`text-sm leading-relaxed ${
            theme === 'dark' ? 'text-white/80' : 'text-slate-600'
          } prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 6,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 预览模式下禁用图片和标题过大
              img: () => null,
              h1: ({ children }) => <p className="font-bold">{children}</p>,
              h2: ({ children }) => <p className="font-bold">{children}</p>,
              h3: ({ children }) => <p className="font-bold">{children}</p>,
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                const isInline = !match && !String(children).includes('\n');
                if (isInline) {
                  return (
                    <code
                      className={`rounded px-1 py-0.5 font-mono text-xs font-medium ${
                        theme === 'dark'
                          ? 'bg-white/10 text-brand-blue-300'
                          : 'bg-slate-100 text-brand-blue-600'
                      }`}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {latestItem.content}
          </ReactMarkdown>
        </div>
        <div className="mt-2 text-xs text-brand-blue-500 dark:text-brand-blue-400">
          点击查看完整内容 →
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 border-t pt-2"
        style={{
          borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
        }}
      >
        <div className="flex items-center gap-2">
          <motion.button
            {...buttonInteraction}
            type="button"
            onClick={onViewHistory}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-[background-color,transform,box-shadow] duration-250 ease-swift ${
              theme === 'dark'
                ? 'text-white/90 hover:text-white'
                : 'text-slate-800 hover:text-slate-900'
            }`}
            style={{
              ...getGlassStyle('BUTTON', theme, {
                withBorderGlow: true,
                withInnerShadow: true,
              }),
              // 增强按钮的浮起感
              boxShadow:
                theme === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                  : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
            }}
          >
            <History className="h-4 w-4" />
            查看所有公告
          </motion.button>

          <motion.button
            {...buttonInteraction}
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-[background-color,transform,box-shadow] duration-250 ease-swift disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === 'dark'
                ? 'text-white/90 hover:text-white'
                : 'text-slate-800 hover:text-slate-900'
            }`}
            style={{
              ...getGlassStyle('BUTTON', theme, {
                withBorderGlow: true,
                withInnerShadow: true,
              }),
              // 增强按钮的浮起感
              boxShadow:
                theme === 'dark'
                  ? '0 2px 8px rgba(0, 0, 0, 0.3), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
                  : '0 2px 10px rgba(0, 0, 0, 0.1), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
            }}
            title="刷新公告"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {latestItem.ctaUrl ? (
          <motion.button
            {...buttonInteraction}
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.open(latestItem.ctaUrl, '_blank');
              }
            }}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-[background-color,transform,box-shadow] duration-250 ease-swift ${
              theme === 'dark'
                ? 'text-brand-blue-300 hover:text-brand-blue-200'
                : 'text-brand-blue-700 hover:text-brand-blue-800'
            }`}
            style={{
              ...getGlassStyle('BUTTON', theme, {
                withBorderGlow: true,
                withInnerShadow: true,
              }),
              // CTA 按钮额外的品牌色高光
              background:
                theme === 'dark' ? 'rgba(101, 187, 233, 0.20)' : 'rgba(101, 187, 233, 0.18)',
              boxShadow:
                theme === 'dark'
                  ? '0 2px 10px rgba(101, 187, 233, 0.25), 0 0.5px 0 0 rgba(101, 187, 233, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.15)'
                  : '0 2px 12px rgba(101, 187, 233, 0.2), 0 0.5px 0 0 rgba(101, 187, 233, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)',
            }}
          >
            {latestItem.ctaLabel ?? '立即查看'}
          </motion.button>
        ) : null}

        {itemCount > 1 && (
          <div
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              theme === 'dark' ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
            }`}
          >
            共 {itemCount} 条公告
          </div>
        )}
      </div>
    </>
  );
}
