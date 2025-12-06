'use client';

import { useState } from 'react';

export function AgentInstaller() {
  const [platform, setPlatform] = useState<'macos' | 'windows' | 'linux'>('macos');
  const [copied, setCopied] = useState(false);

  const installScripts = {
    macos: `curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/macos.sh | bash`,
    windows: `irm https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/windows.ps1 | iex`,
    linux: `curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/linux.sh | bash`,
  };

  const copyScript = async () => {
    await navigator.clipboard.writeText(installScripts[platform]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 border border-warning-200 dark:border-warning-800/50 rounded-2xl bg-warning-50 dark:bg-warning-900/20">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl bg-warning-100 dark:bg-warning-900/50 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-warning-600 dark:text-warning-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            需要安装 BoolTox Agent
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
            此功能需要本地 Agent 提供系统权限支持。安装只需 30 秒，完全开源免费。
          </p>

          {/* 平台选择 */}
          <div className="flex gap-2 mb-4">
            {(['macos', 'windows', 'linux'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  platform === p
                    ? 'bg-primary-500 text-white'
                    : 'bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
              >
                {p === 'macos' ? 'macOS' : p === 'windows' ? 'Windows' : 'Linux'}
              </button>
            ))}
          </div>

          {/* 安装脚本 */}
          <div className="relative">
            <pre className="p-4 rounded-lg bg-neutral-900 dark:bg-neutral-950 text-neutral-100 dark:text-neutral-300 text-sm overflow-x-auto font-mono border border-neutral-800 dark:border-neutral-800">
              <code>{installScripts[platform]}</code>
            </pre>
            <button
              onClick={copyScript}
              className="absolute top-2 right-2 px-3 py-1.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-100 text-xs font-medium transition-all"
            >
              {copied ? '✓ 已复制' : '复制'}
            </button>
          </div>

          {/* 说明 */}
          <div className="mt-4 space-y-2 text-sm text-neutral-600">
            <p className="font-medium">安装步骤：</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>复制上方命令</li>
              <li>打开终端（Terminal / PowerShell）</li>
              <li>粘贴并运行命令</li>
              <li>等待安装完成（约 30 秒）</li>
              <li>刷新此页面</li>
            </ol>
          </div>

          {/* 手动下载 */}
          <div className="mt-4 pt-4 border-t border-warning-200">
            <p className="text-sm text-neutral-600 mb-2">
              或者{' '}
              <a
                href="https://github.com/ByteTrue/BoolTox/releases/latest"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-500 underline hover:text-primary-600"
              >
                手动下载安装包
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
