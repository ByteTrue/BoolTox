'use client';

import React from 'react';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useRemotePlugins } from '@/hooks/use-remote-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { Download, CheckCircle, RefreshCw, Search, Box, Store } from 'lucide-react';
import Link from 'next/link';

export default function PluginMarketPage() {
  const { isAvailable, isDetecting } = useAgent();
  const { plugins: installedPlugins, installPlugin, reload: reloadLocal } = usePlugins();
  const { plugins: remotePlugins, categories, isLoading, error, reload: reloadRemote } = useRemotePlugins();
  const { showToast } = useToast();
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [installingPlugin, setInstallingPlugin] = React.useState<string | null>(null);

  // Merge Data
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

  // Filter
  const filteredPlugins = React.useMemo(() => {
    let result = mergedPlugins;
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }
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

  // Install Handler
  const handleInstall = async (plugin: typeof mergedPlugins[0]) => {
    setInstallingPlugin(plugin.id);
    try {
      await installPlugin(plugin.downloadUrl, 'url', plugin.sha256 || undefined);
      await reloadLocal();
      showToast(`${plugin.name} 安装成功`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : '安装失败', 'error');
    } finally {
      setInstallingPlugin(null);
    }
  };

  if (isDetecting) return null;

  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">插件市场</h1>
        <AgentInstaller />
      </div>
    );
  }

  return (
    <div className="relative space-y-8 max-w-6xl mx-auto pb-20" style={{ contain: 'layout style paint' }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium mb-3">
            <Store size={12} />
            <span>发现精选工具</span>
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">插件市场</h1>
          <p className="text-neutral-500 mt-2">
            发现来自社区的优质工具
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
              <input
                type="text"
                placeholder="搜索插件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors duration-200"
              />
           </div>
           <button
             onClick={() => reloadRemote()}
             className="p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200"
             title="刷新列表"
           >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              selectedCategory === 'all'
                ? 'bg-primary-500 text-white shadow-soft'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'
            }`}
          >
          全部
        </button>
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                selectedCategory === category.id
                  ? 'bg-primary-500 text-white shadow-soft'
                  : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
            {category.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlugins.map((plugin) => (
          <div
            key={plugin.id}
            className="group relative flex flex-col p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft transition-colors duration-200"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-700 flex items-center justify-center text-neutral-500 group-hover:scale-110 transition-transform duration-300">
                  <Box size={24} />
                </div>
                <div>
                   <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                    {plugin.name}
                  </h3>
                   <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-neutral-500">v{plugin.version}</span>
                    {plugin.verified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">已验证</span>
                    )}
                   </div>
                </div>
              </div>
            </div>

            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 flex-grow line-clamp-2">
              {plugin.description}
            </p>

            <div className="flex items-center gap-2 mt-auto">
               {plugin.installed ? (
                 <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-medium cursor-default border border-green-200 dark:border-green-800">
                   <CheckCircle size={14} />
                   <span>已安装</span>
                 </div>
               ) : (
                 <button
                   onClick={() => handleInstall(plugin)}
                   disabled={installingPlugin === plugin.id}
                   className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-colors duration-200 active:scale-95 disabled:opacity-50"
                 >
                   {installingPlugin === plugin.id ? (
                     <span>安装中...</span>
                   ) : (
                     <>
                      <Download size={14} />
                      <span>安装</span>
                     </>
                   )}
                 </button>
               )}
                 <Link
                  href={`/tools/market/${plugin.id}`}
                  className="p-2.5 rounded-xl text-neutral-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors duration-200"
                  title="查看详情"
                >
                 <Box size={16} />
               </Link>
            </div>
          </div>
        ))}
      </div>

       {!isLoading && filteredPlugins.length === 0 && (
         <div className="py-20 text-center">
           <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
             <Search size={28} />
           </div>
           <p className="text-neutral-500">没有找到匹配的插件</p>
         </div>
       )}

    </div>
  );
}
