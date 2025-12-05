export default function PluginMarketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">插件市场</h1>
        <p className="text-neutral-600">发现更多强大的工具插件</p>
      </div>

      {/* 分类标签 TODO */}
      <div className="flex gap-2">
        <button className="px-4 py-2 rounded-lg bg-primary-500 text-white text-sm font-medium">
          官方插件
        </button>
        <button className="px-4 py-2 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50">
          社区插件
        </button>
      </div>

      {/* 插件列表占位 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-soft"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-xl bg-neutral-100" />
                <div>
                  <h3 className="font-semibold text-neutral-900">
                    插件 {i}
                  </h3>
                  <p className="text-sm text-neutral-500">v1.0.0</p>
                </div>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-success-100 text-success-600 rounded-md">
                已验证
              </span>
            </div>
            <p className="text-sm text-neutral-600 mb-4">
              插件描述占位文本
            </p>
            <button className="w-full px-4 py-2 rounded-xl bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-all">
              安装插件
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
