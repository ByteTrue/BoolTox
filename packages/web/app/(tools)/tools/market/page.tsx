'use client';

import React from 'react';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { RefreshCw } from 'lucide-react';

export default function PluginMarketPage() {
  const { isAvailable } = useAgent();
  const {
    plugins,
    isLoading,
    error,
    loadPlugins,
    startPlugin,
    stopPlugin,
    uninstallPlugin,
  } = usePlugins();
  const [filter, setFilter] = React.useState<'all' | 'official' | 'community'>('all');
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);

  // 过滤插件
  const filteredPlugins = React.useMemo(() => {
    if (filter === 'all') return plugins;
    if (filter === 'official') {
      return plugins.filter((p) => p.manifest.id.startsWith('com.booltox.'));
    }
    return plugins.filter((p) => !p.manifest.id.startsWith('com.booltox.'));
  }, [plugins, filter]);

  // 处理启动
  const handleStart = async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      await startPlugin(pluginId);
    } catch (err) {
      console.error('Start failed:', err);
      alert(err instanceof Error ? err.message : '启动失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 处理停止
  const handleStop = async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      await stopPlugin(pluginId);
    } catch (err) {
      console.error('Stop failed:', err);
      alert(err instanceof Error ? err.message : '停止失败');
    } finally {
      setActionLoading(null);
    }
  };

  // 处理卸载
  const handleUninstall = async (pluginId: string) => {
    if (!confirm('确定要卸载此插件吗？')) {
      return;
    }

    setActionLoading(pluginId);
    try {
      await uninstallPlugin(pluginId);
    } catch (err) {
      console.error('Uninstall failed:', err);
      alert(err instanceof Error ? err.message : '卸载失败');
    } finally {
      setActionLoading(null);
    }
  };

  // Agent 未安装
  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">插件市场</h1>
          <p className="text-neutral-600">发现更多强大的工具插件</p>
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">插件市场</h1>
          <p className="text-neutral-600">发现更多强大的工具插件</p>
        </div>

        {/* 刷新按钮 */}
        <button
          onClick={loadPlugins}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-all disabled:opacity-50"
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
              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          全部 ({plugins.length})
        </button>
        <button
          onClick={() => setFilter('official')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'official'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          官方插件
        </button>
        <button
          onClick={() => setFilter('community')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            filter === 'community'
              ? 'bg-primary-500 text-white'
              : 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'
          }`}
        >
          社区插件
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="p-4 border border-error-200 rounded-xl bg-error-50 text-error-700">
          {error}
        </div>
      )}

      {/* 加载中 */}
      {isLoading && plugins.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="text-neutral-600">加载插件列表...</p>
        </div>
      )}

      {/* 插件列表 */}
      {!isLoading && filteredPlugins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-neutral-600 mb-2">暂无插件</p>
          <p className="text-sm text-neutral-500">
            {filter === 'all' ? '还没有安装任何插件' : '此分类下暂无插件'}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            onStart={handleStart}
            onStop={handleStop}
            onUninstall={handleUninstall}
            isLoading={actionLoading === plugin.id}
          />
        ))}
      </div>
    </div>
  );
}

