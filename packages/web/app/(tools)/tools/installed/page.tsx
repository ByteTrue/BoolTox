'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { useToast } from '@/components/toast';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { Package, RefreshCw, Box } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animation-config';
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
      // Optimistic update handles UI, toast confirms action
      showToast('Plugin started', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to start', 'error');
    }
  }, [startPlugin, showToast]);

  const handleStop = React.useCallback(async (pluginId: string) => {
    try {
      await stopPlugin(pluginId);
      showToast('Plugin stopped', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to stop', 'error');
    }
  }, [stopPlugin, showToast]);

  const handleUninstall = React.useCallback(async (pluginId: string) => {
    if (!confirm('Are you sure you want to uninstall this plugin?')) return;
    try {
      await uninstallPlugin(pluginId);
      showToast('Plugin uninstalled', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Uninstall failed', 'error');
    }
  }, [uninstallPlugin, showToast]);

  // Loading
  if (isDetecting || (isLoading && plugins.length === 0)) {
    return <div className="p-10 text-center text-neutral-400">Loading installed plugins...</div>;
  }

  // No Agent
  if (!isAvailable) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">My Plugins</h1>
        <AgentInstaller />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">My Plugins</h1>
          <p className="text-neutral-500 mt-1">
            Manage your local tools. {plugins.length} installed.
          </p>
        </div>
        <button
          onClick={() => reload()}
          className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
          title="Refresh List"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-900 p-1 rounded-lg w-fit">
        {(['all', 'running', 'stopped'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              filter === f
                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          Error: {error}
        </div>
      )}

      {/* Empty State */}
      {plugins.length === 0 && (
        <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
            <Package size={24} />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No plugins found</h3>
          <p className="text-neutral-500 mb-6">Install plugins from the marketplace to get started.</p>
          <Link href="/tools/market" className="px-4 py-2 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg font-medium hover:opacity-90 transition-opacity">
            Go to Marketplace
          </Link>
        </div>
      )}

      {/* List */}
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
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
