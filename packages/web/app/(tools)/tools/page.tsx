export default function ToolsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">工具箱</h1>
        <p className="text-neutral-600">探索强大的效率工具插件</p>
      </div>

      {/* Agent 状态指示器 TODO */}
      <div className="p-4 border border-neutral-200 rounded-xl bg-white">
        <p className="text-sm text-neutral-600">Agent 状态检测中...</p>
      </div>

      {/* 工具列表 TODO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-soft">
          <h3 className="font-semibold text-neutral-900 mb-2">插件市场</h3>
          <p className="text-sm text-neutral-600 mb-4">
            浏览和安装社区插件
          </p>
          <a
            href="/tools/market"
            className="text-primary-500 text-sm font-medium hover:text-primary-600"
          >
            前往市场 →
          </a>
        </div>
      </div>
    </div>
  );
}
