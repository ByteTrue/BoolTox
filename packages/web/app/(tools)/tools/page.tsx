'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAgent } from '@/hooks/use-agent';
import { usePlugins } from '@/hooks/use-plugins';
import { AgentStatus } from '@/components/tools/agent-status';
import { AgentInstaller } from '@/components/tools/agent-installer';
import { Package, Box, Settings, ArrowRight, PlayCircle } from 'lucide-react';
import { cardAnimation, staggerContainer, staggerItem } from '@/lib/animation-config';

export default function ToolsPage() {
  const { isAvailable, isDetecting } = useAgent();
  const { plugins, isLoading } = usePlugins();

  // 统计信息
  const stats = {
    total: plugins.length,
    running: plugins.filter(p => p.status === 'running').length,
  };

  const runningPlugins = plugins.filter(p => p.status === 'running');

  // 数据未准备好：返回 null，避免闪烁
  if (isDetecting || isLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 页头 */}
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">工具箱</h1>
        <div className="flex items-center gap-4 mt-3">
          <p className="text-neutral-600 dark:text-neutral-400">探索强大的效率工具插件</p>
          {isAvailable && (
            <>
              <span className="text-neutral-300 dark:text-neutral-700">•</span>
              <AgentStatus />
            </>
          )}
        </div>
      </div>

      {/* Agent 未安装 */}
      {!isAvailable && <AgentInstaller />}

      {/* Agent 已安装 */}
      {isAvailable && (
        <>
          {/* 正在运行的插件 */}
          {runningPlugins.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                <PlayCircle size={24} className="text-primary-500 dark:text-primary-400" />
                正在运行 ({runningPlugins.length})
              </h2>
              <motion.div
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {runningPlugins.map((plugin) => (
                  <motion.div key={plugin.id} variants={staggerItem}>
                    <Link
                      href={`/plugin/${plugin.id}`}
                      className="block p-4 border border-primary-200 dark:border-primary-800/50 rounded-xl bg-primary-50/50 dark:bg-primary-900/20 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-all duration-200 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                          {plugin.manifest.name}
                        </h3>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                        {plugin.manifest.description || '正在运行中...'}
                      </p>
                      <span className="text-primary-500 dark:text-primary-400 text-sm font-medium group-hover:underline">
                        打开插件 →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          )}

          {/* 快速访问 */}
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              快速访问
            </h2>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {/* 我的插件 */}
              <motion.div variants={staggerItem}>
                <Link
                  href="/tools/installed"
                  className="block p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-soft hover:shadow-soft-lg transition-all duration-200 ease-apple group"
                >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                    <Box size={24} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">我的插件</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  管理已安装的插件 · {stats.total} 个插件
                  {stats.running > 0 && `, ${stats.running} 个运行中`}
                </p>
                <div className="flex items-center gap-1 text-primary-500 dark:text-primary-400 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>查看详情</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
              </motion.div>

              {/* 插件市场 */}
              <motion.div variants={staggerItem}>
              <Link
                href="/tools/market"
                className="block p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 shadow-soft hover:shadow-soft-lg transition-all duration-200 ease-apple group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                    <Package size={24} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">插件市场</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  浏览和安装社区插件
                </p>
                <div className="flex items-center gap-1 text-primary-500 dark:text-primary-400 text-sm font-medium group-hover:gap-2 transition-all">
                  <span>前往市场</span>
                  <ArrowRight size={16} />
                </div>
              </Link>
              </motion.div>

              {/* 设置 */}
              <motion.div variants={staggerItem}>
              <div className="p-6 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 opacity-50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                    <Settings size={24} />
                  </div>
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">设置</h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                  配置和偏好设置
                </p>
                <span className="text-neutral-400 text-sm">即将推出</span>
              </div>
              </motion.div>
            </motion.div>
          </div>

          {/* 空状态提示 */}
          {stats.total === 0 && (
            <div className="mt-8 p-8 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/50 text-center">
              <div className="text-5xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                还没有安装任何插件
              </h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                去插件市场看看吧
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
