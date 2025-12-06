'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { EmptyState } from '@/components/ui/empty-state';
import { RefreshCw, Package, Box } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animation-config';

export default function InstalledPluginsPage() {
  const { isAvailable, isDetecting } = useAgent();
  const {
    plugins,
    isLoading,
    error,
    loadPlugins,
    startPlugin,
    stopPlugin,
    uninstallPlugin,
  } = usePlugins();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState<'all' | 'running' | 'stopped'>('all');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // 过滤插件
  const filteredPlugins = React.useMemo(() => {
    if (filter === 'all') return plugins;
    if (filter === 'running') {
      return plugins.filter((p) => p.status === 'running');
    }
    return plugins.filter((p) => p.status === 'stopped');
  }, [plugins, filter]);

  // 统计
  const stats = React.useMemo(() => {
    return {
      total: plugins.length,
      running: plugins.filter((p) => p.status === 'running').length,
      stopped: plugins.filter((p) => p.status === 'stopped').length,
    };
  }, [plugins]);

  // 处理启动
  const handleStart = React.useCallback(async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      await startPlugin(pluginId);
      showToast('插件启动成功', 'success');
    } catch (err) {
      console.error('Start failed:', err);
      showToast(err instanceof Error ? err.message : '启动失败', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [startPlugin, showToast]);

  // 处理停止
  const handleStop = React.useCallback(async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      await stopPlugin(pluginId);
      showToast('插件已停止', 'success');
    } catch (err) {
      console.error('Stop failed:', err);
      showToast(err instanceof Error ? err.message : '停止失败', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [stopPlugin, showToast]);

  // 处理卸载
  const handleUninstall = React.useCallback(async (pluginId: string) => {
    const pluginName = plugins.find((p) => p.id === pluginId)?.manifest.name || '此插件';

    if (!confirm(`确定要卸载 ${pluginName} 吗？所有相关数据将被删除。`)) {
      return;
    }

    setActionLoading(pluginId);
    try {
      await uninstallPlugin(pluginId);
      await loadPlugins();
      showToast('卸载成功！', 'success');
    } catch (err) {
      console.error('Uninstall failed:', err);
      showToast(err instanceof Error ? err.message : '卸载失败', 'error');
    } finally {
      setActionLoading(null);
    }
  }, [plugins, uninstallPlugin, loadPlugins, showToast]);

  // 数据未准备好：在所有 Hooks 调用之后再返回，避免闪烁
  if (isDetecting || isLoading) {
    return null;
  }

  // Agent 未安装
  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">我的插件</h1>
          <p className="text-neutral-600 dark:text-neutral-400">管理已安装的插件</p>
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
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">我的插件</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            管理已安装的插件 · {stats.total} 个插件，{stats.running} 个运行中
          </p>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={loadPlugins}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all disabled:opacity-50"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          <span>刷新</span>
        </button>
      </div>

      {/* 分类标签 */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          全部 ({stats.total})
        </button>
        <button
          onClick={() => setFilter('running')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'running'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          运行中 ({stats.running})
        </button>
        <button
          onClick={() => setFilter('stopped')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'stopped'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800'
          }`}
        >
          已停止 ({stats.stopped})
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 border border-error-200 dark:border-error-800/50 rounded-xl bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400">
          {error}
        </div>
      )}

      {/* 加载中 */}
      {isLoading && plugins.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 dark:border-primary-800 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="text-neutral-600 dark:text-neutral-400">加载插件列表...</p>
        </div>
      )}

      {/* 空状态 */}
      {!isLoading && plugins.length === 0 && (
        <EmptyState
          emoji="📦"
          title="还没有安装任何插件"
          description="从插件市场选择你需要的工具，一键安装即可使用"
          action={{
            label: "浏览插件市场",
            href: "/tools/market",
          }}
          suggestions={[
            {
              icon: <Package size={20} />,
              label: "探索官方插件",
              href: "/tools/market?category=official",
            },
            {
              icon: <Box size={20} />,
              label: "查看热门插件",
              href: "/tools/market?sort=downloads",
            },
          ]}
        />
      )}

      {/* 无筛选结果 */}
      {!isLoading && plugins.length > 0 && filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400 mb-2">此分类下暂无插件</p>
          <button
            onClick={() => setFilter('all')}
            className="text-primary-500 dark:text-primary-400 hover:underline text-sm"
          >
            查看全部插件
          </button>
        </div>
      )}

      {/* 插件列表 */}
      {filteredPlugins.length > 0 && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredPlugins.map((plugin) => (
            <motion.div key={plugin.id} variants={staggerItem}>
              <PluginCard
                plugin={plugin}
                onStart={handleStart}
                onStop={handleStop}
                onUninstall={handleUninstall}
                isLoading={actionLoading === plugin.id}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
