'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useRemotePlugins } from '@/hooks/use-remote-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginListSkeleton } from '@/components/ui/skeleton';
import { Download, CheckCircle, RefreshCw, Search } from 'lucide-react';
import { staggerContainer, staggerItem, cardAnimation } from '@/lib/animation-config';

export default function PluginMarketPage() {
  const { isAvailable, isDetecting } = useAgent();
  const { plugins: installedPlugins, installPlugin, loadPlugins } = usePlugins();
  const { plugins: remotePlugins, categories, isLoading, error, reload } = useRemotePlugins();
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [installingPlugin, setInstallingPlugin] = React.useState<string | null>(null);

  // 合并远程和本地插件数据
  const mergedPlugins = React.useMemo(() => {
    return remotePlugins.map(remote => {
      const installed = installedPlugins.find(local => local.id === remote.id);
      return {
        ...remote,
        installed: !!installed,
        installedVersion: installed?.version,
        needsUpdate: installed && installed.version !== remote.version,
      };
    });
  }, [remotePlugins, installedPlugins]);

  // 筛选插件
  const filteredPlugins = React.useMemo(() => {
    let result = mergedPlugins;

    // 分类筛选
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.keywords.some(k => k.toLowerCase().includes(query))
      );
    }

    return result;
  }, [mergedPlugins, selectedCategory, searchQuery]);

  // 处理安装
  const handleInstall = async (plugin: typeof mergedPlugins[0]) => {
    if (!installPlugin) return;

    setInstallingPlugin(plugin.id);
    try {
      await installPlugin(plugin.downloadUrl, 'url', plugin.sha256 || undefined);
      await loadPlugins();
      showToast(`${plugin.name} 安装成功！`, 'success');
    } catch (err) {
      console.error('Install failed:', err);
      showToast(err instanceof Error ? err.message : '安装失败', 'error');
    } finally {
      setInstallingPlugin(null);
    }
  };

  // 检测中：在所有 Hooks 之后返回
  if (isDetecting) {
    return null;
  }

  // Agent 未安装
  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">插件市场</h1>
          <p className="text-neutral-600 dark:text-neutral-400">发现更多强大的工具插件</p>
        </div>
        <AgentInstaller />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">插件市场</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            发现更多强大的工具插件 · {filteredPlugins.length} 个插件
          </p>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={reload}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 dark:text-neutral-500" size={20} />
        <input
          type="text"
          placeholder="搜索插件..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 dark:placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
        />
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          全部 ({mergedPlugins.length})
        </button>
        {categories.map(category => {
          const count = mergedPlugins.filter(p => p.category === category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white'
                  : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              {category.icon} {category.name} ({count})
            </button>
          );
        })}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 border border-error-200 dark:border-error-800/50 rounded-xl bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400">
          <p className="font-semibold mb-1">加载失败</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* 加载中 */}
      {isLoading && (
        <PluginListSkeleton count={6} />
      )}

      {/* 空状态 */}
      {!isLoading && filteredPlugins.length === 0 && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            {searchQuery ? '未找到匹配的插件' : '暂无插件'}
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            {searchQuery ? '尝试使用其他关键词搜索' : '插件市场正在建设中'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
            >
              清除搜索
            </button>
          )}
        </div>
      )}

      {/* 插件列表 */}
      {!isLoading && filteredPlugins.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredPlugins.map((plugin) => (
            <motion.div
              key={plugin.id}
              variants={staggerItem}
              {...cardAnimation}
              className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-soft hover:shadow-soft-lg transition-shadow"
            >
              {/* 插件图标和名称 */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-2xl">
                    🍅
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{plugin.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">v{plugin.version}</p>
                  </div>
                </div>
                {plugin.verified && (
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                    <CheckCircle size={12} />
                    <span className="text-xs font-medium">官方</span>
                  </div>
                )}
              </div>

              {/* 描述 */}
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                {plugin.description}
              </p>

              {/* 统计信息 */}
              <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                <span>⭐ {plugin.stats.rating.toFixed(1)}</span>
                <span>📦 {plugin.stats.downloads > 1000 ? `${(plugin.stats.downloads / 1000).toFixed(1)}k` : plugin.stats.downloads} 下载</span>
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {plugin.installed ? (
                  <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm font-medium">
                    <CheckCircle size={16} />
                    <span>已安装</span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleInstall(plugin)}
                    disabled={installingPlugin === plugin.id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                  >
                    {installingPlugin === plugin.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>安装中...</span>
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        <span>安装</span>
                      </>
                    )}
                  </button>
                )}
                <Link
                  href={`/tools/market/${plugin.id}`}
                  className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  详情
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
