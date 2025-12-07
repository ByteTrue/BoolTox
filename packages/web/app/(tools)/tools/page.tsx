'use client';

import Link from 'next/link';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { AgentStatus } from '@/components/tools/agent-status';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { Package, Box, ArrowRight, Activity, Zap, Sparkles } from 'lucide-react';
import React from 'react';

export default function ToolsPage() {
  const { isAvailable, isDetecting } = useAgent();
  const { plugins, isLoading, startPlugin, stopPlugin, uninstallPlugin } = usePlugins();

  const stats = React.useMemo(() => ({
    total: plugins.length,
    running: plugins.filter(p => p.status === 'running').length,
  }), [plugins]);

  const runningPlugins = React.useMemo(() =>
    plugins.filter(p => p.status === 'running'),
    [plugins]
  );

  // Loading State
  if (isDetecting || (isLoading && plugins.length === 0)) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-neutral-400">
        正在加载工具箱...
      </div>
    );
  }

  return (
    <div className="relative max-w-6xl mx-auto space-y-10 pb-20" style={{ contain: 'layout style paint' }}>

      {/* Header */}
      <header className="relative flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-xs font-medium mb-3">
            <Sparkles size={12} />
            <span>本地工具管理</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            工具箱
          </h1>
          <p className="text-neutral-500 mt-2">
            管理你的本地开发工具和插件
          </p>
        </div>
        <div className="flex items-center gap-3">
           {isAvailable && <AgentStatus />}
        </div>
      </header>

      {/* Agent Installer */}
      {!isAvailable && <AgentInstaller />}

      {isAvailable && (
        <div className="space-y-10">
          {/* Quick Access / Stats */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/tools/market" prefetch={true} className="group block p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Package size={24} />
                  </div>
                  <ArrowRight size={16} className="text-neutral-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">插件市场</div>
                <div className="text-sm text-neutral-500 mt-1">发现新工具</div>
              </Link>

              <Link href="/tools/installed" prefetch={true} className="group block p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft transition-colors duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    <Box size={24} />
                  </div>
                  <div className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg text-neutral-600 dark:text-neutral-400">
                    {stats.total} 已安装
                  </div>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">我的插件</div>
                <div className="text-sm text-neutral-500 mt-1">管理已安装工具</div>
              </Link>

              <div className="block p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white">
                    <Activity size={24} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">在线</span>
                  </div>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">系统状态</div>
                <div className="text-sm text-neutral-500 mt-1">所有系统运行正常</div>
              </div>
            </div>
          </section>

          {/* Running Plugins */}
          {runningPlugins.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" /> 运行中的插件
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runningPlugins.map(plugin => (
                  <div key={plugin.id}>
                    <PluginCard
                      plugin={plugin}
                      onStart={startPlugin}
                      onStop={stopPlugin}
                      onUninstall={uninstallPlugin}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* All Plugins */}
          {plugins.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                全部工具
              </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map(plugin => (
                  <div key={plugin.id}>
                    <PluginCard
                      plugin={plugin}
                      onStart={startPlugin}
                      onStop={stopPlugin}
                      onUninstall={uninstallPlugin}
                    />
                  </div>
                ))}
              </div>
            </section>
          )}

           {/* Empty State */}
          {plugins.length === 0 && (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 text-neutral-400 mb-4">
                <Package size={28} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">还没有安装插件</h3>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto mt-2">
                前往插件市场，发现能提升你工作效率的工具
              </p>
              <Link href="/tools/market" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all duration-200 active:scale-95">
                <span>浏览插件市场</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
