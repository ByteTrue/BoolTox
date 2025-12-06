import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center bg-neutral-50 dark:bg-neutral-950">
      <div className="text-center space-y-6 max-w-2xl px-6">
        <h1 className="text-5xl font-bold text-neutral-900 dark:text-neutral-100">
          欢迎来到 BoolTox
        </h1>
        <p className="text-xl text-neutral-600 dark:text-neutral-400">
          一站式效率工具平台 · 开源 · 可扩展
        </p>

        <div className="flex gap-4 justify-center pt-4">
          <Link
            href="/tools"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-medium bg-primary-500 text-white hover:bg-primary-600 transition-all duration-200"
          >
            探索工具箱
          </Link>
          <Link
            href="/tools/market"
            className="inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-medium border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
          >
            插件市场
          </Link>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 pt-8">
          正在开发中 · Web + Agent 架构 · 插件生态系统
        </p>
      </div>
    </div>
  );
}
