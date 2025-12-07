'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, Grid3x3, List, Plus, Activity, Cpu, HardDrive } from 'lucide-react';
import { PluginCard, PluginCardSkeleton } from '@/components/tools/plugin-card-new';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getInstalledPlugins, getRunningPlugins, type Plugin } from '@/lib/mock-plugins';

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'running' | 'stopped';

export default function ToolsPageNew() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = React.useState<FilterMode>('all');

  // 获取已安装的插件
  const installedPlugins = getInstalledPlugins();
  const runningPlugins = getRunningPlugins();

  // 筛选插件
  const filteredPlugins = React.useMemo(() => {
    let result = installedPlugins;

    // 搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 状态筛选
    if (filterMode === 'running') {
      result = result.filter((p) => p.isRunning);
    } else if (filterMode === 'stopped') {
      result = result.filter((p) => !p.isRunning);
    }

    return result;
  }, [installedPlugins, searchQuery, filterMode]);

  // 模拟启动
  const handleLaunch = (plugin: Plugin) => {
    toast.success(`${plugin.name} 已启动`);
  };

  // 模拟停止
  const handleStop = (plugin: Plugin) => {
    toast.info(`${plugin.name} 已停止`);
  };

  // 模拟系统资源（演示用）
  const systemStats = {
    cpu: 23.5,
    memory: 45.2,
    disk: 67.8,
  };

  return (
    <div className="relative min-h-screen bg-background">
      {/* 顶部栏 */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* 左侧：标题和统计 */}
            <div>
              <h1 className="text-2xl font-bold">工具箱</h1>
              <p className="text-sm text-muted-foreground">
                已安装 {installedPlugins.length} 个工具，{runningPlugins.length} 个正在运行
              </p>
            </div>

            {/* 右侧：搜索和工具栏 */}
            <div className="flex items-center gap-3">
              {/* 搜索框 */}
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索已安装的工具..."
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

              {/* 添加插件按钮 */}
              <Link href="/tools/market">
                <button className="flex items-center gap-2 rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
                  <Plus size={16} />
                  <span className="hidden sm:inline">添加插件</span>
                </button>
              </Link>
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilterMode('all')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filterMode === 'all'
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                  : 'hover:bg-accent'
              )}
            >
              全部 ({installedPlugins.length})
            </button>
            <button
              onClick={() => setFilterMode('running')}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filterMode === 'running'
                  ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400'
                  : 'hover:bg-accent'
              )}
            >
              <div className="h-2 w-2 animate-pulse rounded-full bg-success-500" />
              运行中 ({runningPlugins.length})
            </button>
            <button
              onClick={() => setFilterMode('stopped')}
              className={cn(
                'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                filterMode === 'stopped'
                  ? 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400'
                  : 'hover:bg-accent'
              )}
            >
              已停止 ({installedPlugins.length - runningPlugins.length})
            </button>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Agent 状态面板 */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Agent 状态</h2>
              <Activity size={20} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* CPU 使用率 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Cpu size={16} />
                    CPU
                  </span>
                  <span className="font-medium">{systemStats.cpu}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStats.cpu}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                  />
                </div>
              </div>

              {/* 内存使用率 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive size={16} />
                    内存
                  </span>
                  <span className="font-medium">{systemStats.memory}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStats.memory}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.1 }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                  />
                </div>
              </div>

              {/* 磁盘使用率 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <HardDrive size={16} />
                    磁盘
                  </span>
                  <span className="font-medium">{systemStats.disk}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${systemStats.disk}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 插件网格 */}
          {filteredPlugins.length > 0 ? (
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
                  transition={{ delay: index * 0.05 }}
                >
                  <PluginCard
                    {...plugin}
                    onLaunch={() => handleLaunch(plugin)}
                    onStop={() => handleStop(plugin)}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-muted p-6">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">
                {installedPlugins.length === 0 ? '还没有安装任何插件' : '未找到匹配的工具'}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {installedPlugins.length === 0
                  ? '前往插件市场探索数百个高质量工具'
                  : '尝试调整搜索条件或筛选器'}
              </p>
              <Link href="/tools/market">
                <button className="rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-600">
                  浏览插件市场
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
