/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useId, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTheme } from '../theme-provider';
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from '@/utils/glass-layers';
import { iconButtonInteraction, buttonInteraction } from '@/utils/animation-presets';
import { formatRelativeTime, type ActivityFeedItem } from '@/content/activity-feed';

export interface ChangelogDrawerProps {
  open: boolean;
  items: ActivityFeedItem[];
  onClose: () => void;
  initialSelectedId?: string;
}

type FilterType = 'all' | 'announcement' | 'update';

/**
 * 更新日志历史抽屉组件
 * 右侧滑入展示所有历史消息，支持类型筛选
 * 支持左右分栏：左侧列表，右侧详细内容
 */
export function ChangelogDrawer({ open, items, onClose, initialSelectedId }: ChangelogDrawerProps) {
  const { theme } = useTheme();
  const drawerId = useId();
  const [filter, setFilter] = useState<FilterType>('all');
  const [selectedItem, setSelectedItem] = useState<ActivityFeedItem | null>(
    () => items.find(item => item.id === initialSelectedId) || items[0] || null
  );

  // 筛选消息
  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.type === filter);
  }, [items, filter]);

  // 类型标签配置
  const typeConfig = {
    update: { label: '更新日志', color: 'blue' },
    announcement: { label: '公告', color: 'purple' },
  } as const;

  // 筛选按钮配置
  const filters: { value: FilterType; label: string; emoji: string }[] = [
    { value: 'all', label: '全部', emoji: '📋' },
    { value: 'announcement', label: '公告', emoji: '📢' },
    { value: 'update', label: '更新', emoji: '🚀' },
  ];

  const drawerContent = (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩层 - 提高 z-index 确保覆盖所有内容 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9998] bg-black/30 backdrop-blur-sm"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
            onClick={onClose}
          />

          {/* Drawer 主体 - 增加宽度以支持分栏 */}
          <motion.div
            id={drawerId}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed right-0 top-0 z-[9999] h-full w-full sm:w-[80vw] border-l ${getGlassShadow(
              theme
            )}`}
            style={{
              ...getGlassStyle('CARD', theme),
              borderColor:
                theme === 'dark'
                  ? 'rgba(255, 255, 255, 0.2)'
                  : 'rgba(101, 187, 233, 0.15)',
              maxWidth: '1200px',
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${drawerId}-title`}
          >
            {/* 左右分栏布局 */}
            <div className="h-full flex">
              {/* 左侧：详细内容区域 - 独立完整矩形 */}
              <div className="flex-1 overflow-y-auto elegant-scroll p-6">
                {selectedItem ? (
                  <motion.div
                    key={selectedItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* 标题区 */}
                    <div className="flex items-start gap-4 mb-6">
                      <div
                        className={`flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl text-3xl ${
                          theme === 'dark' ? 'bg-white/10' : 'bg-slate-100'
                        }`}
                      >
                        {selectedItem.icon || '📢'}
                      </div>
                      <div className="flex-1">
                        <h2
                          className={`text-2xl font-bold mb-2 ${
                            theme === 'dark' ? 'text-white' : 'text-slate-800'
                          }`}
                        >
                          {selectedItem.title}
                        </h2>
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${
                              selectedItem.type === 'update'
                                ? theme === 'dark'
                                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                  : 'bg-blue-50 text-blue-600 border-blue-200'
                                : theme === 'dark'
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                  : 'bg-purple-50 text-purple-600 border-purple-200'
                            }`}
                          >
                            {typeConfig[selectedItem.type]?.label ?? '公告'}
                          </span>
                          <span
                            className={`text-sm ${
                              theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                            }`}
                          >
                            {formatRelativeTime(selectedItem.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 内容区 */}
                    <div
                      className={`rounded-2xl border p-6 ${
                        theme === 'dark' ? 'bg-white/5' : 'bg-white/50'
                      }`}
                      style={{
                        borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
                      }}
                    >
                      <div className={`prose prose-sm max-w-none ${theme === 'dark' ? 'prose-invert' : ''}`}>
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code: ({className, children, ...props}) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match && !String(children).includes('\n');
                              if (isInline) {
                                return (
                                  <code 
                                    className={`rounded px-1.5 py-0.5 font-mono text-sm font-medium not-prose ${
                                      theme === 'dark' 
                                        ? 'bg-white/10 text-brand-blue-300 border border-white/10' 
                                        : 'bg-slate-100 text-brand-blue-600 border border-slate-200'
                                    }`} 
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <code className={`${className} ${theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'} rounded-lg p-1`} {...props}>
                                  {children}
                                </code>
                              );
                            }
                          }}
                        >
                          {selectedItem.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p
                      className={`text-sm ${
                        theme === 'dark' ? 'text-white/50' : 'text-slate-400'
                      }`}
                    >
                      请从右侧选择一条公告查看详情
                    </p>
                  </div>
                )}
              </div>

              {/* 右侧：完整矩形区域（标题+筛选器+列表） */}
              <div
                className="w-80 border-l flex flex-col"
                style={{
                  borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
                }}
              >
                {/* 标题栏 */}
                <div
                  className="flex items-center justify-between border-b px-4 py-3"
                  style={{
                    borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
                  }}
                >
                  <h2
                    id={`${drawerId}-title`}
                    className={`text-lg font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    📜 历史记录
                  </h2>
                  <motion.button
                    {...iconButtonInteraction}
                    type="button"
                    onClick={onClose}
                    className={`rounded-lg p-1.5 transition-[background-color,transform] duration-250 ease-swift ${
                      theme === 'dark'
                        ? 'hover:bg-white/10'
                        : 'hover:bg-slate-100'
                    }`}
                    aria-label="关闭"
                  >
                    <X
                      className={`h-4 w-4 ${
                        theme === 'dark' ? 'text-white/70' : 'text-slate-600'
                      }`}
                    />
                  </motion.button>
                </div>

                {/* 筛选器 */}
                <div
                  className="flex flex-wrap gap-2 border-b p-3"
                  style={{
                    borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
                  }}
                >
                  {filters.map((f) => (
                    <motion.button
                      {...buttonInteraction}
                      key={f.value}
                      type="button"
                      onClick={() => setFilter(f.value)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-[background-color,transform] duration-250 ease-swift ${
                        filter === f.value
                          ? theme === 'dark'
                            ? 'bg-white/20 text-white'
                            : 'bg-brand-blue-400/20 text-slate-800'
                          : theme === 'dark'
                          ? 'bg-white/5 text-white/60 hover:bg-white/10'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{f.emoji}</span>
                      <span>{f.label}</span>
                    </motion.button>
                  ))}
                </div>

                {/* 列表区域 */}
                <div className="flex-1 overflow-y-auto elegant-scroll">
                  {filteredItems.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-6">
                      <p
                        className={`text-sm ${
                          theme === 'dark' ? 'text-white/50' : 'text-slate-400'
                        }`}
                      >
                        暂无相关记录
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {filteredItems.map((item) => (
                        <motion.button
                          {...buttonInteraction}
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedItem(item)}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`w-full text-left rounded-xl border p-3 transition-[background-color,border-color,transform,box-shadow] duration-250 ease-swift relative ${
                            selectedItem?.id === item.id
                              ? theme === 'dark'
                                ? 'bg-brand-blue-400/10'  // 选中态背景高亮
                                : 'bg-brand-blue-400/5'
                              : theme === 'dark'
                              ? 'bg-white/5 hover:bg-white/10'
                              : 'bg-white/50 hover:bg-white/80'
                          }`}
                          style={selectedItem?.id === item.id ? {
                            ...getGlassStyle('ACTIVE', theme, {
                              withBorderGlow: true,
                              withInnerShadow: true,
                            }),
                            // 增强选中态的浮起感
                            boxShadow: theme === 'dark'
                              ? '0 4px 12px rgba(101, 187, 233, 0.25), 0 0.5px 0 0 rgba(101, 187, 233, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.1)'
                              : '0 4px 16px rgba(101, 187, 233, 0.2), 0 0.5px 0 0 rgba(101, 187, 233, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
                          } : {
                            borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
                          }}
                        >
                          {/* 优先级指示器 */}
                          {item.priority === 'high' && (
                            <div
                              className="absolute -right-1 top-3 h-6 w-1 rounded-l-full"
                              style={{
                                background: theme === 'dark'
                                  ? 'rgba(101, 187, 233, 0.8)'
                                  : 'rgba(101, 187, 233, 0.9)',
                              }}
                            />
                          )}

                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-lg flex-shrink-0">{item.icon || '📢'}</span>
                            <h3
                              className={`text-sm font-bold line-clamp-2 ${
                                theme === 'dark' ? 'text-white' : 'text-slate-800'
                              }`}
                            >
                              {item.title}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium border ${
                                item.type === 'update'
                                  ? theme === 'dark'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : 'bg-blue-50 text-blue-600 border-blue-200'
                                  : theme === 'dark'
                                    ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                    : 'bg-purple-50 text-purple-600 border-purple-200'
                              }`}
                            >
                              {typeConfig[item.type]?.label ?? '公告'}
                            </span>
                            <span
                              className={`${
                                theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                              }`}
                            >
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // 使用 Portal 将 Drawer 渲染到 body，避免被父容器的 overflow 影响
  // 确保在浏览器环境中才使用 Portal
  if (typeof document === 'undefined') {
    return null;
  }
  
  return createPortal(drawerContent, document.body);
}
