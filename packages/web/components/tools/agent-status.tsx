'use client';

import { useAgent } from '@/hooks/use-agent';

export function AgentStatus() {
  const { agentInfo, isAvailable, isDetecting, redetect } = useAgent();

  if (isDetecting) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-sm">
        <div className="w-2 h-2 rounded-full bg-neutral-400 dark:bg-neutral-500 animate-pulse" />
        <span>检测中...</span>
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 text-sm border border-success-200 dark:border-success-800/50">
        <div className="w-2 h-2 rounded-full bg-success-500" />
        <span className="font-medium">Agent 已连接</span>
        {agentInfo.version && (
          <span className="text-xs text-success-600 dark:text-success-500">v{agentInfo.version}</span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 text-sm border border-warning-200 dark:border-warning-800/50">
      <div className="w-2 h-2 rounded-full bg-warning-500" />
      <span>Agent 未连接</span>
      <button
        onClick={redetect}
        className="ml-1 text-xs underline hover:text-warning-800 dark:hover:text-warning-300"
      >
        重试
      </button>
    </div>
  );
}

