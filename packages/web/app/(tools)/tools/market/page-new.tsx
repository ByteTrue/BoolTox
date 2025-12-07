'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SlidersHorizontal, Grid3x3, List, RefreshCw } from 'lucide-react';
import { PluginCard, PluginCardSkeleton } from '@/components/tools/plugin-card-new';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MOCK_PLUGINS,
  CATEGORIES,
  TAGS,
  filterPluginsByCategory,
  filterPluginsByTags,
  searchPlugins,
  sortPluginsByRating,
  sortPluginsByDownloads,
  sortPluginsByUpdate,
  type Plugin,
} from '@/lib/mock-plugins';

type ViewMode = 'grid' | 'list';
type SortBy = 'rating' | 'downloads' | 'updated' | 'none';

export default function PluginMarketPageNew() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [sortBy, setSortBy] = React.useState<SortBy>('none');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // 筛选和搜索逻辑
  const filteredPlugins = React.useMemo(() => {
    let result = MOCK_PLUGINS;

    // 搜索
    if (searchQuery.trim()) {
      result = searchPlugins(searchQuery);
    }

    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter((p) => p.tags.some((tag) => selectedTags.includes(tag)));
    }

    // 排序
    switch (sortBy) {
      case 'rating':
        result = sortPluginsByRating(result);
        break;
      case 'downloads':
        result = sortPluginsByDownloads(result);
        break;
      case 'updated':
        result = sortPluginsByUpdate(result);
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedTags, sortBy]);

  // 切换标签
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 清除筛选
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedTags([]);
    setSortBy('none');
    toast.info('已清除所有筛选条件');
  };

  // 模拟刷新
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success('插件列表已刷新');
    }, 1000);
  };

  // 模拟安装
  const handleInstall = (plugin: Plugin) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: `正在安装 ${plugin.name}...`,
        success: `${plugin.name} 安装成功！`,
        error: '安装失败，请稍后重试',
      }
    );
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* 顶部栏 */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 左侧：标题 */}
            <div>
              <h1 className="text-2xl font-bold">插件市场</h1>
              <p className="text-sm text-muted-foreground">
                发现 {MOCK_PLUGINS.length} 个优质插件
              </p>
            </div>

            {/* 右侧：搜索和工具栏 */}
            <div className="flex items-center gap-3">
              {/* 搜索框 */}
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索插件..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* 视图切换 */}
              <div className="hidden md:flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'hover:bg-accent'
                  )}
                >
                  <Grid3x3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'rounded-md p-1.5 transition-colors',
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                      : 'hover:bg-accent'
                  )}
                >
                  <List size={16} />
                </button>
              </div>

              {/* 刷新按钮 */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="rounded-lg border border-border bg-background p-2 hover:bg-accent disabled:opacity-50"
              >
                <RefreshCw size={16} className={cn(isLoading && 'animate-spin')} />
              </button>

              {/* 侧边栏切换（移动端） */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden rounded-lg border border-border bg-background p-2 hover:bg-accent"
              >
                <SlidersHorizontal size={16} />
              </button>
            </div>
          </div>

          {/* 活动筛选器显示 */}
          {(selectedCategory !== 'all' || selectedTags.length > 0 || sortBy !== 'none') && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">筛选条件:</span>
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-2 py-1 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                  {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                </span>
              )}
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs"
                >
                  #{tag}
                </span>
              ))}
              {sortBy !== 'none' && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs">
                  排序: {sortBy === 'rating' ? '评分' : sortBy === 'downloads' ? '下载量' : '更新时间'}
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                清除全部
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* 侧边栏筛选器 */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.aside
                initial={{ x: -300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="w-64 flex-shrink-0 space-y-6"
              >
                {/* 分类筛选 */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">分类</h3>
                  <div className="space-y-1">
                    {CATEGORIES.map((category) => {
                      const CategoryIcon = category.icon;
                      const count = filterPluginsByCategory(category.id).length;
                      return (
                        <button
                          key={category.id}
                          onClick={() => setSelectedCategory(category.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
                            selectedCategory === category.id
                              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                              : 'hover:bg-accent'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <CategoryIcon size={16} />
                            {category.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 标签筛选 */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">标签</h3>
                  <div className="flex flex-wrap gap-2">
                    {TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={cn(
                          'rounded-md px-2 py-1 text-xs transition-colors',
                          selectedTags.includes(tag)
                            ? 'bg-primary-500 text-white'
                            : 'bg-accent hover:bg-accent/80'
                        )}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 排序 */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">排序</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="none">默认排序</option>
                    <option value="rating">评分最高</option>
                    <option value="downloads">下载最多</option>
                    <option value="updated">最近更新</option>
                  </select>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* 插件网格 */}
          <div className="flex-1">
            {isLoading ? (
              <div className={cn(
                'grid gap-6',
                viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
              )}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <PluginCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredPlugins.length > 0 ? (
              <motion.div
                layout
                className={cn(
                  'grid gap-6',
                  viewMode === 'grid' ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'
                )}
              >
                {filteredPlugins.map((plugin, index) => (
                  <motion.div
                    key={plugin.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <PluginCard
                      {...plugin}
                      onInstall={() => handleInstall(plugin)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                <div className="mb-4 rounded-full bg-muted p-6">
                  <Search size={32} className="text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">未找到匹配的插件</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  尝试调整搜索条件或浏览其他分类
                </p>
                <button
                  onClick={clearFilters}
                  className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
                >
                  清除筛选
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
