import Link from 'next/link';
import { ArrowRight, Zap, Shield, Boxes, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-neutral-50 via-primary-50/20 to-neutral-50 dark:from-neutral-950 dark:via-primary-950/10 dark:to-neutral-950"
      style={{ contain: 'layout paint style' }}
    >
      {/* 装饰性网格背景 */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(59 130 246) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Hero 内容 */}
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6">
        <div className="text-center space-y-8 max-w-4xl">
          {/* 标题 */}
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium border border-primary-200 dark:border-primary-800/50">
              <Sparkles size={16} />
              <span>开源 · 可扩展 · 完全免费</span>
            </div>

            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-neutral-900 via-primary-600 to-neutral-900 dark:from-neutral-100 dark:via-primary-400 dark:to-neutral-100 bg-clip-text text-transparent">
                BoolTox
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              一站式效率工具平台
              <br />
              <span className="text-primary-600 dark:text-primary-400 font-medium">
                插件生态 · Web + Agent 混合架构
              </span>
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <div>
              <Link
                href="/tools"
                prefetch
                className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold bg-primary-500 text-white hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-colors duration-200 active:scale-95"
              >
                <span>探索工具箱</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div>
              <Link
                href="/tools/market"
                prefetch
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors duration-200 active:scale-95"
              >
                浏览插件
              </Link>
            </div>
          </div>

          {/* 特性卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto">
            <div className="group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                <Zap size={24} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                高性能
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                本地 Agent 提供原生性能，支持 Python/Node.js 后端
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                <Boxes size={24} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                插件生态
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                GitOps 插件市场，一键安装，热插拔，版本管理
              </p>
            </div>

            <div className="group p-6 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-primary-300 dark:hover:border-primary-700 transition-colors duration-200">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300">
                <Shield size={24} />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
                安全可靠
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                开源透明，本地运行，数据隐私，完全可控
              </p>
            </div>
          </div>

          {/* 底部提示 */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 pt-8">
            按 <kbd className="px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-xs">⌘K</kbd> 打开命令面板
          </p>
        </div>
      </div>
    </div>
  );
}
