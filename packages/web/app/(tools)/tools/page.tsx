'use client';

import { useAgent } from '@/hooks/use-agent';
import { AgentStatus } from '@/components/tools/agent-status';
import { AgentInstaller } from '@/components/tools/agent-installer';

export default function ToolsPage() {
  const { isAvailable, client } = useAgent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">工具箱</h1>
        <p className="text-neutral-600">探索强大的效率工具插件</p>
      </div>

      {/* Agent 状态指示器 */}
      <div className="flex items-center gap-4">
        <AgentStatus />
        {isAvailable && (
          <p className="text-sm text-neutral-500">
            已连接到本地 Agent，可以使用所有功能
          </p>
        )}
      </div>

      {/* Agent 未安装时显示安装引导 */}
      {!isAvailable && (
        <AgentInstaller />
      )}

      {/* 工具列表 */}
      {isAvailable && (
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">
            快速访问
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              href="/tools/market"
              className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-200 ease-apple"
            >
              <h3 className="font-semibold text-neutral-900 mb-2">插件市场</h3>
              <p className="text-sm text-neutral-600 mb-4">
                浏览和安装社区插件
              </p>
              <span className="text-primary-500 text-sm font-medium">
                前往市场 →
              </span>
            </a>

            <div className="p-6 border border-neutral-200 rounded-2xl bg-white opacity-50">
              <h3 className="font-semibold text-neutral-900 mb-2">已安装插件</h3>
              <p className="text-sm text-neutral-600 mb-4">
                管理你的插件
              </p>
              <span className="text-neutral-400 text-sm">即将推出</span>
            </div>

            <div className="p-6 border border-neutral-200 rounded-2xl bg-white opacity-50">
              <h3 className="font-semibold text-neutral-900 mb-2">设置</h3>
              <p className="text-sm text-neutral-600 mb-4">
                配置和偏好设置
              </p>
              <span className="text-neutral-400 text-sm">即将推出</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
