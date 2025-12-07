'use client';

import React from 'react';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { Package, RefreshCw, ArrowRight, Layers } from 'lucide-react';
import Link from 'next/link';

export default function InstalledPluginsPage() {
  const { isAvailable, isDetecting } = useAgent();
  const {
    plugins,
    isLoading,
    error,
    startPlugin,
    stopPlugin,
    uninstallPlugin,
    reload
  } = usePlugins();
  const { showToast } = useToast();
  const [filter, setFilter] = React.useState<'all' | 'running' | 'stopped'>('all');

  // Filter Logic
  const filteredPlugins = React.useMemo(() => {
    if (filter === 'all') return plugins;
    if (filter === 'running') return plugins.filter((p) => p.status === 'running');
    return plugins.filter((p) => p.status === 'stopped');
  }, [plugins, filter]);

  // Handlers
  const handleStart = React.useCallback(async (pluginId: string) => {
    try {
      await startPlugin(pluginId);
      showToast('插件已启动', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '启动失败', 'error');
    }
  }, [startPlugin, showToast]);

  const handleStop = React.useCallback(async (pluginId: string) => {
    try {
      await stopPlugin(pluginId);
      showToast('插件已停止', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '停止失败', 'error');
    }
  }, [stopPlugin, showToast]);

  const handleUninstall = React.useCallback(async (pluginId: string) => {
    if (!confirm('确定要卸载这个插件吗？')) return;
    try {
      await uninstallPlugin(pluginId);
      showToast('插件已卸载', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '卸载失败', 'error');
    }
  }, [uninstallPlugin, showToast]);

  // Loading
  if (isDetecting || (isLoading && plugins.length === 0)) {
    return <div className="p-10 text-center text-neutral-400">正在加载已安装插件...</div>;
  }

  // No Agent
  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">我的插件</h1>
        <AgentInstaller />
      </div>
    );
  }

  const filterLabels = {
    all: '全部',
    running: '运行中',
    stopped: '已停止'
  };

  return (
    <div className="relative space-y-8 max-w-6xl mx-auto" style={{ contain: 'layout style paint' }}>

      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-medium mb-3">
            <Layers size={12} />
            <span>本地插件管理</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">我的插件</h1>
          <p className="text-neutral-500 mt-2">
            管理你的本地工具，已安装 {plugins.length} 个
          </p>
        </div>
        <button
          onClick={() => reload()}
          className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors duration-200"
          title="刷新列表"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-1.5 rounded-xl w-fit">
        {(['all', 'running', 'stopped'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              filter === f
                ? 'bg-primary-500 text-white shadow-soft'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            {filterLabels[f]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          错误: {error}
        </div>
      )}

      {/* Empty State */}
      {plugins.length === 0 && (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 text-neutral-400 mb-4">
            <Package size={28} />
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">还没有安装插件</h3>
          <p className="text-neutral-500 mb-6 mt-2">前往插件市场安装你需要的工具</p>
          <Link href="/tools/market" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-colors duration-200 active:scale-95">
            <span>前往插件市场</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <div key={plugin.id}>
            <PluginCard
              plugin={plugin}
              onStart={handleStart}
              onStop={handleStop}
              onUninstall={handleUninstall}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
