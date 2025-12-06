'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePlugins } from '@/hooks/use-plugins';
import { useRemotePlugins } from '@/hooks/use-remote-plugins';
import { useToast } from '@/components/toast';
import { PageLoading } from '@/components/ui/loading';
import { ArrowLeft, Download, CheckCircle, ExternalLink, Github, Home } from 'lucide-react';

export default function PluginDetailPage({ params }: { params: Promise<{ pluginId: string }> }) {
  const { pluginId } = use(params);
  const router = useRouter();
  const { plugins: installedPlugins, installPlugin, uninstallPlugin, loadPlugins } = usePlugins();
  const { plugins: remotePlugins, isLoading } = useRemotePlugins();
  const { showToast } = useToast();
  const [isInstalling, setIsInstalling] = React.useState(false);

  // 查找插件
  const plugin = remotePlugins.find(p => p.id === pluginId);
  const installed = installedPlugins.find(p => p.id === pluginId);

  // 加载中显示 Skeleton
  if (isLoading) {
    return <PageLoading text="加载插件详情..." />;
  }

  // 处理安装
  const handleInstall = async () => {
    if (!plugin || !installPlugin) return;

    setIsInstalling(true);
    try {
      await installPlugin(plugin.downloadUrl, 'url', plugin.sha256 || undefined);
      await loadPlugins();
      showToast(`${plugin.name} 安装成功！`, 'success');
    } catch (err) {
      console.error('Install failed:', err);
      showToast(err instanceof Error ? err.message : '安装失败', 'error');
    } finally {
      setIsInstalling(false);
    }
  };

  // 处理卸载
  const handleUninstall = async () => {
    if (!pluginId || !uninstallPlugin) return;

    if (!confirm(`确定要卸载 ${plugin?.name || '此插件'} 吗？所有相关数据将被删除。`)) {
      return;
    }

    setIsInstalling(true);
    try {
      await uninstallPlugin(pluginId);
      await loadPlugins();
      showToast('卸载成功！', 'success');
    } catch (err) {
      console.error('Uninstall failed:', err);
      showToast(err instanceof Error ? err.message : '卸载失败', 'error');
    } finally {
      setIsInstalling(false);
    }
  };

  if (!plugin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">插件未找到</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">请检查插件 ID 是否正确</p>
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

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>返回插件市场</span>
      </button>

      {/* 插件头部信息 */}
      <div className="p-8 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <div className="flex items-start gap-6">
          {/* 插件图标 */}
          <div className="w-24 h-24 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-5xl flex-shrink-0">
            🍅
          </div>

          {/* 插件信息 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{plugin.name}</h1>
                  {plugin.verified && (
                    <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">官方认证</span>
                    </div>
                  )}
                </div>
                <p className="text-neutral-600 dark:text-neutral-400">{plugin.description}</p>
              </div>
            </div>

            {/* 统计信息 */}
            <div className="flex items-center gap-6 text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              <span>⭐ {plugin.stats.rating.toFixed(1)} 评分</span>
              <span>📦 {plugin.stats.downloads.toLocaleString()} 下载</span>
              <span>📅 v{plugin.version}</span>
              <span className="text-neutral-400 dark:text-neutral-500">by {plugin.author}</span>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              {installed ? (
                <>
                  <Link
                    href={`/plugin/${pluginId}`}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
                  >
                    打开插件
                  </Link>
                  <button
                    onClick={handleUninstall}
                    disabled={isInstalling}
                    className="px-6 py-3 rounded-lg border border-error-200 dark:border-error-800/50 text-error-600 dark:text-error-400 font-medium hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-50"
                  >
                    {isInstalling ? '卸载中...' : '卸载'}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
                >
                  {isInstalling ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>安装中...</span>
                    </>
                  ) : (
                    <>
                      <Download size={20} />
                      <span>安装插件</span>
                    </>
                  )}
                </button>
              )}

              {plugin.homepage && (
                <a
                  href={plugin.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  <ExternalLink size={20} />
                  <span>访问主页</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 详细描述 */}
      <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">详细介绍</h2>
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{plugin.description}</p>
        </div>
      </div>

      {/* 功能特性 */}
      <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">功能特性</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-2xl">⏱️</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">专注计时</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">25分钟专注时段，帮助保持高效工作状态</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-2xl">🔔</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">系统通知</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">时间到达时自动发送系统通知提醒</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-2xl">⏸️</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">灵活控制</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">支持暂停、继续和重置操作</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
            <div className="text-2xl">🎨</div>
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">美观界面</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">简洁现代的设计，流畅的动画效果</p>
            </div>
          </div>
        </div>
      </div>

      {/* 技术信息 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息 */}
        <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">基本信息</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">版本</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{plugin.version}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">分类</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {plugin.category === 'productivity' ? '生产力' : plugin.category}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">作者</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{plugin.author}</dd>
            </div>
            <div>
              <dt className="text-sm text-neutral-500 dark:text-neutral-400">最后更新</dt>
              <dd className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {new Date(plugin.updatedAt).toLocaleDateString('zh-CN')}
              </dd>
            </div>
          </dl>
        </div>

        {/* 链接 */}
        <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">相关链接</h2>
          <div className="space-y-3">
            {plugin.homepage && (
              <a
                href={plugin.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <Home size={16} />
                <span className="text-sm font-medium">项目主页</span>
                <ExternalLink size={14} />
              </a>
            )}
            {plugin.repository && (
              <a
                href={plugin.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-500 hover:text-primary-600 transition-colors"
              >
                <Github size={16} />
                <span className="text-sm font-medium">源代码仓库</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 关键词 */}
      {plugin.keywords && plugin.keywords.length > 0 && (
        <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">标签</h2>
          <div className="flex flex-wrap gap-2">
            {plugin.keywords.map(keyword => (
              <span
                key={keyword}
                className="px-3 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-sm"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
