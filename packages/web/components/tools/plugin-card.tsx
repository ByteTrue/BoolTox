'use client';

import React from 'react';
import Link from 'next/link';
import type { PluginInfo } from '@booltox/sdk';
import { Play, Square, Trash2, Download, ExternalLink, Box } from 'lucide-react';
import { motion } from 'framer-motion';

interface PluginCardProps {
  plugin: PluginInfo;
  onStart?: (pluginId: string) => void;
  onStop?: (pluginId: string) => void;
  onUninstall?: (pluginId: string) => void;
  isLoading?: boolean;
}

export function PluginCard({
  plugin,
  onStart,
  onStop,
  onUninstall,
  isLoading = false,
}: PluginCardProps) {
  const isRunning = plugin.status === 'running';

  return (
    <div className="group relative flex flex-col p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors duration-200">
      
      {/* Header: Icon + Status */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400">
            {/* Simple fallback icon if no specific icon system is in place */}
            <Box size={20} />
          </div>
          <div>
            <h3 className="font-medium text-neutral-900 dark:text-neutral-100 leading-tight">
              {plugin.manifest.name}
            </h3>
            <p className="text-xs text-neutral-500 mt-0.5">v{plugin.version}</p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-neutral-200 dark:bg-neutral-700'}`} />
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6 flex-grow line-clamp-2 leading-relaxed">
        {plugin.manifest.description}
      </p>

      {/* Actions - Always visible but subtle until hover? No, keep clear. */}
      <div className="flex items-center gap-2 mt-auto">
        {plugin.installed ? (
          <>
            {/* Primary Action */}
            {isRunning ? (
              <button
                onClick={() => onStop?.(plugin.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
              >
                <Square size={14} className="fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                onClick={() => onStart?.(plugin.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors disabled:opacity-50"
              >
                <Play size={14} className="fill-current" />
                <span>Start</span>
              </button>
            )}

            {/* Secondary Actions */}
            <Link
              href={`/tools/installed/${plugin.id}`}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              title="Details"
            >
              <ExternalLink size={16} />
            </Link>
            
            <button
              onClick={() => onUninstall?.(plugin.id)}
              disabled={isLoading || isRunning}
              className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Uninstall"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <button
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <Download size={14} />
            <span>Install</span>
          </button>
        )}
      </div>
    </div>
  );
}
