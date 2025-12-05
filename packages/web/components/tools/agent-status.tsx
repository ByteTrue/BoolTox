'use client';

import { useAgent } from '@/hooks/use-agent';

export function AgentStatus() {
  const { agentInfo, isAvailable, isDetecting, redetect } = useAgent();

  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-600 text-sm">
        <div className="w-2 h-2 rounded-full bg-neutral-400 animate-pulse" />
        <span>检测中...</span>
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-100 text-success-700 text-sm">
        <div className="w-2 h-2 rounded-full bg-success-500" />
        <span>Agent 已连接</span>
        {agentInfo.version && (
          <span className="text-xs text-success-600">v{agentInfo.version}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning-100 text-warning-700 text-sm">
      <div className="w-2 h-2 rounded-full bg-warning-500" />
      <span>Agent 未连接</span>
      <button
        onClick={redetect}
        className="ml-1 text-xs underline hover:text-warning-800"
      >
        重试
      </button>
    </div>
  );
}
