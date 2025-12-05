'use client';

import React from 'react';
import type { PluginInfo } from '@booltox/sdk';
import { Play, Square, Trash2, Download } from 'lucide-react';

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
  const isOfficial = plugin.manifest.id.startsWith('com.booltox.');

  return (
    <div className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-200 ease-apple">
      {/* 头部 */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-3">
          {/* 图标 */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xl font-bold">
            {plugin.manifest.name[0]}
          </div>

          {/* 信息 */}
          <div>
            <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
              {plugin.manifest.name}
              {plugin.isDev && (
                <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded">
                  开发中
                </span>
              )}
            </h3>
            <p className="text-sm text-neutral-500">v{plugin.version}</p>
          </div>
        </div>

        {/* 验证标记 */}
        {isOfficial ? (
          <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-600 rounded-md">
            ✓ 已验证
          </span>
        ) : (
          <span className="px-2 py-1 text-xs font-medium bg-warning-100 text-warning-600 rounded-md">
            ⚠ 未验证
          </span>
        )}
      </div>

      {/* 描述 */}
      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
        {plugin.manifest.description}
      </p>

      {/* 元信息 */}
      <div className="flex items-center gap-4 mb-4 text-xs text-neutral-500">
        <span>{plugin.manifest.author}</span>
        <span>•</span>
        <span>{plugin.mode === 'webview' ? 'Web' : '独立应用'}</span>
        {plugin.manifest.runtime?.backend && (
          <>
            <span>•</span>
            <span className="capitalize">{plugin.manifest.runtime.backend.type}</span>
          </>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        {plugin.installed ? (
          <>
            {/* 启动/停止 */}
            {isRunning ? (
              <button
                onClick={() => onStop?.(plugin.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-warning-100 text-warning-700 text-sm font-medium hover:bg-warning-200 transition-all disabled:opacity-50"
              >
                <Square size={16} />
                <span>停止</span>
              </button>
            ) : (
              <button
                onClick={() => onStart?.(plugin.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-50"
              >
                <Play size={16} />
                <span>启动</span>
              </button>
            )}

            {/* 卸载 */}
            <button
              onClick={() => onUninstall?.(plugin.id)}
              disabled={isLoading || isRunning}
              className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 transition-all disabled:opacity-50"
            >
              <Trash2 size={16} />
            </button>
          </>
        ) : (
          <button
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all disabled:opacity-50"
          >
            <Download size={16} />
            <span>安装</span>
          </button>
        )}
      </div>
    </div>
  );
}
