'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useRemotePlugins } from '@/hooks/use-remote-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { Download, CheckCircle, RefreshCw, Search, Box } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animation-config';
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
      // SWR will handle reload, but we can force it too
      await reloadLocal();
      showToast(`${plugin.name} installed successfully`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Install failed', 'error');
    } finally {
      setInstallingPlugin(null);
    }
  };

  if (isDetecting) return null;

  if (!isAvailable) {
    return (
      <div className="space-y-6">
         <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Plugin Market</h1>
        <AgentInstaller />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Plugin Market</h1>
          <p className="text-neutral-500 mt-1">
            Discover tools from the community.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
             <input 
               type="text" 
               placeholder="Search..." 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full md:w-64 pl-9 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-neutral-100"
             />
          </div>
          <button
            onClick={() => reloadRemote()}
            className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
          }`}
        >
          All
        </button>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category.id
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-black'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
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
            className="group relative flex flex-col p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500">
                  <Box size={20} />
                </div>
                <div>
                   <h3 className="font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
                    {plugin.name}
                  </h3>
                   <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-neutral-500">v{plugin.version}</span>
                    {plugin.verified && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium">Verified</span>
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
                 <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 text-sm font-medium cursor-default">
                   <CheckCircle size={14} />
                   <span>Installed</span>
                 </div>
               ) : (
                 <button
                   onClick={() => handleInstall(plugin)}
                   disabled={installingPlugin === plugin.id}
                   className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                 >
                   {installingPlugin === plugin.id ? (
                     <span>Installing...</span>
                   ) : (
                     <>
                      <Download size={14} />
                      <span>Install</span>
                     </>
                   )}
                 </button>
               )}
               <Link
                 href={`/tools/market/${plugin.id}`}
                 className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
               >
                 <Box size={16} />
               </Link>
            </div>
          </motion.div>
        ))}
      </motion.div>

       {!isLoading && filteredPlugins.length === 0 && (
         <div className="py-20 text-center text-neutral-500">
           No plugins found.
         </div>
       )}

    </div>
  );
}
