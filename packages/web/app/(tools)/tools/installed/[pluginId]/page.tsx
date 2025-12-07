'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlugins } from '@/hooks/use-plugins';
import { useToast } from '@/components/toast';
import {
  ArrowLeft,
  Play,
  Square,
  ExternalLink,
  Github,
  Home,
  Package,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type { PluginBackendConfig, PluginRuntimeConfig } from '@booltox/shared';

export default function InstalledPluginDetailPage({
  params,
}: {
  params: Promise<{ pluginId: string }>;
}) {
  const { pluginId } = use(params);
  const router = useRouter();
  const { plugins, startPlugin, stopPlugin, uninstallPlugin, isLoading } = usePlugins();
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = React.useState(false);

  const plugin = plugins.find((p) => p.id === pluginId);
  const isRunning = plugin?.status === 'running';
  const isOfficial = plugin?.manifest.id.startsWith('com.booltox.');

  // 数据加载中：返回 null，避免闪烁"未找到"页面
  if (isLoading) {
    return null;
  }

  // 未找到
  if (!plugin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            插件未找到
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">可能已被卸载或 ID 不正确</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 处理启动/停止
  const handleToggle = async () => {
    setActionLoading(true);
    try {
      if (isRunning) {
        await stopPlugin(pluginId);
        showToast(`${plugin.manifest.name} 已停止`, 'success');
      } else {
        await startPlugin(pluginId);
        showToast(`${plugin.manifest.name} 已启动`, 'success');
      }
    } catch (err) {
      console.error('Toggle failed:', err);
      showToast(err instanceof Error ? err.message : '操作失败', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 处理卸载
  const handleUninstall = async () => {
    if (
      !confirm(
        `确定要卸载 ${plugin.manifest.name} 吗？所有相关数据将被删除。`
      )
    ) {
      return;
    }

    setActionLoading(true);
    try {
      await uninstallPlugin(pluginId);
      showToast('卸载成功！', 'success');
      router.push('/tools/installed');
    } catch (err) {
      console.error('Uninstall failed:', err);
      showToast(err instanceof Error ? err.message : '卸载失败', 'error');
      setActionLoading(false);
    }
  };

  const runtime = plugin.manifest.runtime;
  const backendConfig: PluginBackendConfig | undefined =
    runtime && 'backend' in runtime ? (runtime as PluginRuntimeConfig & { backend?: PluginBackendConfig }).backend : undefined;
  const hasBackend = Boolean(backendConfig);

  return (
    <div className="space-y-6 transition-opacity">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回我的插件</span>
      </button>

      {/* 插件头部信息 */}
      <div className="p-8 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <div className="flex items-start gap-6">
          {/* 插件图标 */}
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-5xl flex-shrink-0 shadow-soft">
            {plugin.manifest.name[0]}
          </div>

          {/* 插件信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
                    {plugin.manifest.name}
                  </h1>
                  {isOfficial ? (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">官方认证</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">未验证</span>
                    </div>
                  )}

                  {/* 运行状态 */}
                  {isRunning && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-sm font-medium">运行中</span>
                    </div>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {plugin.manifest.description}
                </p>
              </div>
            </div>

            {/* 元信息 */}
            <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              <span>📦 v{plugin.version}</span>
              <span>👤 {plugin.manifest.author}</span>
              {hasBackend && (
                <span className="capitalize">
                  🔧 {backendConfig?.type} 后端
                </span>
              )}
              {plugin.isDev && (
                <span className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-xs font-medium">
                  开发模式
                </span>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              {isRunning ? (
                <>
                  <Link
                    href={`/plugin/${pluginId}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all"
                  >
                    打开插件
                  </Link>
                  <button
                    onClick={handleToggle}
                    disabled={actionLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 font-semibold hover:bg-warning-200 dark:hover:bg-warning-900/50 transition-all disabled:opacity-50"
                  >
                    <Square size={20} />
                    <span>停止</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggle}
                  disabled={actionLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-semibold hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-all disabled:opacity-50"
                >
                  <Play size={20} />
                  <span>启动</span>
                </button>
              )}

              <button
                onClick={handleUninstall}
                disabled={actionLoading || isRunning}
                className="px-6 py-3 rounded-xl border-2 border-error-200 dark:border-error-800/50 text-error-600 dark:text-error-400 font-semibold hover:bg-error-50 dark:hover:bg-error-900/20 transition-all disabled:opacity-50"
              >
                {actionLoading ? '卸载中...' : '卸载插件'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 详细信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            基本信息
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">插件 ID</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                {plugin.id}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">版本</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {plugin.version}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">作者</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {plugin.manifest.author}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">运行模式</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {plugin.mode === 'webview' ? 'Web 视图' : '独立应用'}
              </dd>
            </div>
            {backendConfig && (
              <div>
                <dt className="text-sm text-neutral-500 dark:text-neutral-400">后端类型</dt>
                <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100 capitalize">
                  {backendConfig.type}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* 权限信息 */}
        {plugin.manifest.permissions && plugin.manifest.permissions.length > 0 && (
          <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              权限列表
            </h2>
            <div className="space-y-2">
              {plugin.manifest.permissions.map((permission) => (
                <div
                  key={permission}
                  className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300"
                >
                  <CheckCircle size={16} className="text-primary-500 flex-shrink-0" />
                  <span className="font-mono">{permission}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 相关链接 */}
      {(plugin.manifest.homepage || plugin.manifest.repository) && (
        <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            相关链接
          </h2>
          <div className="flex flex-wrap gap-3">
            {plugin.manifest.homepage && (
              <a
                href={plugin.manifest.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                <Home size={16} />
                <span>项目主页</span>
                <ExternalLink size={14} />
              </a>
            )}
            {plugin.manifest.repository && (
              <a
                href={plugin.manifest.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all"
              >
                <Github size={16} />
                <span>源代码</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      )}

      {/* 快速操作 */}
      <div className="p-6 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
              快速操作
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              管理插件的常用操作
            </p>
          </div>
          <div className="flex gap-3">
            {isRunning && (
              <Link
                href={`/plugin/${pluginId}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
              >
                <Package size={16} />
                <span>打开插件</span>
              </Link>
            )}
            <Link
              href="/tools/market"
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <Package size={16} />
              <span>浏览更多插件</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
