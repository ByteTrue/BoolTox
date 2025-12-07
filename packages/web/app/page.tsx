'use client';

import Link from 'next/link';
import { ArrowRight, Zap, Shield, Boxes, Sparkles } from 'lucide-react';
import { SimpleTiltCard } from '@/components/ui/tilt-card';

export default function HomePage() {
  return (
    <div
      className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-background"
      style={{ contain: 'layout paint style' }}
    >
      {/* 背景网格（轻量级） */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Hero 内容 */}
      <div className="relative flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 py-12">
        <div className="text-center space-y-12 max-w-6xl">
          {/* 标题区域 */}
          <div className="space-y-6 transition-opacity duration-200 ease-out">
            {/* 顶部标签 */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium border border-primary-200 dark:border-primary-800/50">
              <Sparkles size={16} />
              <span>开源 · 可扩展 · 完全免费</span>
            </div>

            {/* 主标题 - 超大字体 */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-primary-600 to-foreground dark:from-foreground dark:via-primary-400 dark:to-foreground bg-clip-text text-transparent">
                BoolTox
              </span>
            </h1>

            {/* 副标题 */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              一站式效率工具平台
              <br />
              <span className="text-primary-600 dark:text-primary-400 font-semibold">
                插件生态 · Web + Agent 混合架构
              </span>
            </p>
          </div>

          {/* CTA 按钮组 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/tools" prefetch>
              <button className="group inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-semibold bg-primary-500 text-white hover:bg-primary-600 shadow-glow transition-colors duration-200">
                <span>探索工具箱</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>

            <Link href="/tools/market" prefetch>
              <button className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-base font-semibold border-2 border-border bg-background hover:bg-accent transition-colors duration-200">
                浏览插件市场
              </button>
            </Link>
          </div>

          {/* 特性卡片 - 精简动效 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-5xl mx-auto">
            {[
              {
                icon: <Zap size={24} />,
                title: '高性能',
                description: '本地 Agent 提供原生性能，支持 Python/Node.js 后端',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: <Boxes size={24} />,
                title: '插件生态',
                description: 'GitOps 插件市场，一键安装，热插拔，版本管理',
                gradient: 'from-purple-500 to-pink-500',
              },
              {
                icon: <Shield size={24} />,
                title: '安全可靠',
                description: '开源透明，本地运行，数据隐私，完全可控',
                gradient: 'from-green-500 to-emerald-500',
              },
            ].map((feature) => (
              <SimpleTiltCard key={feature.title} className="group h-full">
                <div className="relative h-full p-6 rounded-2xl bg-card border border-border hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-colors duration-200">
                  {/* 顶部渐变装饰 */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 via-purple-500 to-pink-500 opacity-0 transition-opacity group-hover:opacity-100 rounded-t-2xl" />

                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center text-white mb-4 shadow-lg transition-transform duration-200 group-hover:scale-105`}
                  >
                    {feature.icon}
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </SimpleTiltCard>
            ))}
          </div>

          {/* 底部提示 */}
          <p className="text-sm text-muted-foreground pt-8">
            按{' '}
            <kbd className="px-2 py-1 rounded-md bg-muted border border-border font-mono text-xs">
              ⌘K
            </kbd>{' '}
            打开命令面板
          </p>
        </div>
      </div>
    </div>
  );
}
