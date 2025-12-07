'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Star,
  ExternalLink,
  Github,
  Shield,
  Clock,
  User,
  CheckCircle,
  Play,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MOCK_PLUGINS, type Plugin } from '@/lib/mock-plugins';

export default function PluginDetailPageNew() {
  const params = useParams();
  const router = useRouter();
  const pluginId = params.pluginId as string;

  // 查找插件
  const plugin = MOCK_PLUGINS.find((p) => p.id === pluginId);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'features' | 'changelog' | 'reviews'>('overview');

  if (!plugin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">插件不存在</h2>
          <p className="mb-4 text-muted-foreground">未找到该插件</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-primary-500 px-4 py-2 text-white hover:bg-primary-600"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  // 模拟安装
  const handleInstall = () => {
    toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
      loading: `正在安装 ${plugin.name}...`,
      success: `${plugin.name} 安装成功！`,
      error: '安装失败',
    });
  };

  // 渲染星级
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        size={20}
        className={cn(
          'transition-colors',
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-neutral-300 dark:text-neutral-600'
        )}
      />
    ));
  };

  return (
    <div className="relative min-h-screen bg-background pb-20">
      {/* 返回按钮 */}
      <div className="sticky top-16 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
            返回插件市场
          </button>
        </div>
      </div>

      {/* Hero 区域 */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary-50 via-purple-50/50 to-pink-50/30 dark:from-primary-950/20 dark:via-purple-950/10 dark:to-pink-950/10">
        {/* 装饰性背景 */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
              linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />

        <div className="container relative mx-auto px-6 py-12">
          <div className="flex flex-col gap-8 md:flex-row md:items-start">
            {/* 左侧：图标和基本信息 */}
            <div className="flex flex-col items-center gap-4 md:items-start">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-2xl"
              >
                {plugin.icon}
              </motion.div>

              {plugin.isOfficial && (
                <div className="flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-medium text-success-700 dark:bg-success-900/30 dark:text-success-400">
                  <CheckCircle size={14} />
                  官方插件
                </div>
              )}
            </div>

            {/* 右侧：详细信息 */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="mb-2 text-3xl font-bold md:text-4xl">{plugin.name}</h1>
                <p className="text-lg text-muted-foreground">{plugin.description}</p>
              </div>

              {/* 统计信息 */}
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {/* 评分 */}
                <div className="flex items-center gap-2">
                  <div className="flex">{renderStars(plugin.rating)}</div>
                  <span className="font-medium">{plugin.rating}</span>
                </div>

                {/* 下载量 */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Download size={16} />
                  <span>{plugin.downloads.toLocaleString()} 下载</span>
                </div>

                {/* 版本 */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span>v{plugin.version}</span>
                </div>

                {/* 许可证 */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Shield size={16} />
                  <span>{plugin.license}</span>
                </div>

                {/* 更新时间 */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock size={16} />
                  <span>{plugin.lastUpdated}</span>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-wrap gap-3">
                {plugin.isInstalled ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-medium text-white shadow-glow hover:bg-primary-600"
                    >
                      <Play size={18} />
                      打开
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-lg border-2 border-border bg-background px-6 py-3 font-medium hover:bg-accent"
                    >
                      <Settings size={18} />
                      设置
                    </motion.button>
                  </>
                ) : (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleInstall}
                    className="flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 font-medium text-white shadow-glow hover:bg-primary-600"
                  >
                    <Download size={18} />
                    安装插件
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://github.com/booltox/${plugin.id}`, '_blank')}
                  className="flex items-center gap-2 rounded-lg border-2 border-border bg-background px-6 py-3 font-medium hover:bg-accent"
                >
                  <Github size={18} />
                  GitHub
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.open(`https://docs.booltox.dev/plugins/${plugin.id}`, '_blank')}
                  className="flex items-center gap-2 rounded-lg border-2 border-border bg-background px-6 py-3 font-medium hover:bg-accent"
                >
                  <ExternalLink size={18} />
                  文档
                </motion.button>
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2">
                {plugin.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-accent px-3 py-1 text-sm font-medium"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab 导航 */}
      <div className="border-b border-border bg-background">
        <div className="container mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: '简介' },
              { id: 'features', label: '功能特性' },
              { id: 'changelog', label: '更新日志' },
              { id: 'reviews', label: '评论' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'relative border-b-2 py-4 text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab 内容 */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              <h2>关于 {plugin.name}</h2>
              <p>{plugin.description}</p>

              <h3>主要功能</h3>
              <ul>
                <li>功能点 1</li>
                <li>功能点 2</li>
                <li>功能点 3</li>
              </ul>

              <h3>权限说明</h3>
              <div className="not-prose rounded-lg border border-warning-200 bg-warning-50 p-4 dark:border-warning-800 dark:bg-warning-900/20">
                <div className="flex gap-2">
                  <Shield size={20} className="mt-0.5 text-warning-600 dark:text-warning-400" />
                  <div>
                    <p className="mb-2 font-medium text-warning-900 dark:text-warning-100">
                      此插件需要以下权限：
                    </p>
                    <ul className="space-y-1 text-sm text-warning-800 dark:text-warning-200">
                      <li>• 文件系统读写</li>
                      <li>• Python 环境访问</li>
                      <li>• 网络请求</li>
                    </ul>
                  </div>
                </div>
              </div>

              <h3>作者信息</h3>
              <div className="not-prose flex items-center gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
                  <User size={20} className="text-primary-700 dark:text-primary-400" />
                </div>
                <div>
                  <p className="font-medium">{plugin.author}</p>
                  <p className="text-sm text-muted-foreground">响应时间 &lt; 24h</p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              <h2>功能特性</h2>
              <p>这里展示插件的详细功能说明...</p>
            </motion.div>
          )}

          {activeTab === 'changelog' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-neutral dark:prose-invert max-w-none"
            >
              <h2>更新日志</h2>
              <h3>v{plugin.version} - {plugin.lastUpdated}</h3>
              <ul>
                <li>新增功能 A</li>
                <li>优化功能 B</li>
                <li>修复 Bug C</li>
              </ul>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">用户评论</h2>
                <button className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600">
                  写评论
                </button>
              </div>
              <p className="text-muted-foreground">暂无评论</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
