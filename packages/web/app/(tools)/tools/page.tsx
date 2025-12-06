'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { AgentStatus } from '@/components/tools/agent-status';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { PluginCard } from '@/components/tools/plugin-card';
import { Package, Box, Settings, ArrowRight, Activity, Zap } from 'lucide-react';
import { staggerContainer, staggerItem } from '@/lib/animation-config';

export default function ToolsPage() {
  const { isAvailable, isDetecting } = useAgent();
  const { plugins, isLoading, startPlugin, stopPlugin, uninstallPlugin } = usePlugins();

  const stats = {
    total: plugins.length,
    running: plugins.filter(p => p.status === 'running').length,
  };

  const runningPlugins = plugins.filter(p => p.status === 'running');

  // Loading State - Minimal
  if (isDetecting || (isLoading && plugins.length === 0)) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-neutral-400">
        Loading toolbox...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20">
      
      {/* Header */}
      <header className="flex items-end justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Toolbox
          </h1>
          <p className="text-neutral-500 mt-1">
            Manage your local development tools and plugins.
          </p>
        </div>
        <div className="flex items-center gap-3">
           {isAvailable && <AgentStatus />}
        </div>
      </header>

      {/* Agent Installer */}
      {!isAvailable && <AgentInstaller />}

      {isAvailable && (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-10"
        >
          
          {/* Quick Access / Stats */}
          <section>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link href="/tools/market" className="group block p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Package className="text-neutral-500 group-hover:text-blue-500 transition-colors" size={24} />
                  <ArrowRight size={16} className="text-neutral-300 group-hover:text-neutral-500" />
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">Marketplace</div>
                <div className="text-sm text-neutral-500">Discover new tools</div>
              </Link>

              <Link href="/tools/installed" className="group block p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <Box className="text-neutral-500 group-hover:text-purple-500 transition-colors" size={24} />
                  <div className="text-xs font-mono bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded text-neutral-600 dark:text-neutral-400">
                    {stats.total} Installed
                  </div>
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">My Plugins</div>
                <div className="text-sm text-neutral-500">Manage installed tools</div>
              </Link>

              <div className="block p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="text-neutral-400" size={24} />
                </div>
                <div className="font-semibold text-neutral-900 dark:text-neutral-100">System Status</div>
                <div className="text-sm text-neutral-500">All systems operational</div>
              </div>
            </div>
          </section>

          {/* Running Plugins */}
          {runningPlugins.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Zap size={14} /> Active Sessions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {runningPlugins.map(plugin => (
                  <motion.div key={plugin.id} variants={staggerItem}>
                    <PluginCard 
                      plugin={plugin} 
                      onStart={startPlugin}
                      onStop={stopPlugin}
                      onUninstall={uninstallPlugin}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* All Plugins (if any installed but not running) */}
          {plugins.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
                All Tools
              </h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map(plugin => (
                  <motion.div key={plugin.id} variants={staggerItem}>
                    <PluginCard 
                      plugin={plugin} 
                      onStart={startPlugin}
                      onStop={stopPlugin}
                      onUninstall={uninstallPlugin}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

           {/* Empty State */}
          {plugins.length === 0 && (
            <div className="text-center py-20 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
                <Package size={24} />
              </div>
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">No plugins installed</h3>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                Get started by exploring the marketplace to find tools that boost your productivity.
              </p>
              <Link href="/tools/market" className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black font-medium hover:opacity-90 transition-opacity">
                Browse Marketplace
              </Link>
            </div>
          )}

        </motion.div>
      )}
    </div>
  );
}
