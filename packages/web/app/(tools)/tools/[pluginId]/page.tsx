'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAgent } from '@/hooks/use-agent';
import { createPostMessageBridge } from '@/lib/postmessage-bridge';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import type { PluginInfo } from '@booltox/sdk';

export default function PluginRunPage({ params }: { params: Promise<{ pluginId: string }> }) {
  // Next.js 15: unwrap params
  const { pluginId } = use(params);

  const router = useRouter();
  const { client, isAvailable } = useAgent();
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pluginInfo, setPluginInfo] = React.useState<PluginInfo | null>(null);
  const [isStarted, setIsStarted] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const bridgeCleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (!isAvailable || !client || isStarted) {
      if (!isAvailable || !client) {
        setError('Agent 未连接');
        setIsLoading(false);
      }
      return;
    }

    // 启动插件并加载前端
    const startAndLoadPlugin = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // 1. 获取插件信息
        console.log('[PluginRunPage] 获取插件信息:', pluginId);
        const plugin = await client.getPlugin(pluginId);
        setPluginInfo(plugin);

        // 2. 启动插件后端（如果有）
        const runtime = plugin.manifest.runtime;
        if (runtime && 'backend' in runtime && runtime.backend) {
          console.log('[PluginRunPage] 启动插件后端');
          await client.startPlugin(pluginId);
        }

        setIsStarted(true);
        setIsLoading(false);
      } catch (err) {
        console.error('[PluginRunPage] 加载失败:', err);
        setError(err instanceof Error ? err.message : '加载插件失败');
        setIsLoading(false);
      }
    };

    startAndLoadPlugin();

    // 清理：停止插件（可选）
    return () => {
      // TODO: 实现插件引用计数，决定是否停止
      if (bridgeCleanupRef.current) {
        bridgeCleanupRef.current();
        bridgeCleanupRef.current = null;
      }
    };
  }, [pluginId, isAvailable, isStarted, client]);

  // iframe 加载完成后创建 postMessage 桥接
  const handleIframeLoad = () => {
    if (!iframeRef.current || !client || bridgeCleanupRef.current) return;

    try {
      console.log('[PluginRunPage] 创建 PostMessage 桥接');
      const cleanup = createPostMessageBridge(pluginId, client, iframeRef.current);
      bridgeCleanupRef.current = cleanup;
    } catch (err) {
      console.error('[PluginRunPage] Bridge creation failed:', err);
      setError('通信桥接创建失败');
    }
  };

  // Agent 未连接
  if (!isAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            需要连接 Agent
          </h2>
          <p className="text-neutral-600 mb-6">
            请先安装并启动 BoolTox Agent
          </p>
          <button
            onClick={() => router.push('/tools')}
            className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
          >
            返回工具箱
          </button>
        </div>
      </div>
    );
  }

  // 加载中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
          <p className="text-neutral-600">加载插件中...</p>
        </div>
      </div>
    );
  }

  // 加载失败
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            加载失败
          </h2>
          <p className="text-neutral-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 rounded-lg border border-neutral-200 text-neutral-700 font-medium hover:bg-neutral-50"
            >
              返回
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 插件 UI 容器
  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-14 border-b border-neutral-200 flex items-center justify-between px-4 bg-white z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            title="返回"
          >
            <ArrowLeft size={20} className="text-neutral-700" />
          </button>
          <div className="h-6 w-px bg-neutral-200" />
          <div>
            <h1 className="text-sm font-semibold text-neutral-900">
              {pluginInfo?.manifest?.name || '插件'}
            </h1>
            {pluginInfo?.manifest?.version && (
              <p className="text-xs text-neutral-500">
                v{pluginInfo.manifest.version}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs font-medium text-green-700">运行中</span>
          </div>
        </div>
      </div>

      {/* 插件容器 */}
      <div className="flex-1 relative">
        {/* 使用 iframe 加载插件 */}
        <iframe
          ref={iframeRef}
          src={`http://localhost:9527/plugins/${pluginId}/static/index.html`}
          className="w-full h-full border-0"
          title={pluginInfo?.manifest?.name || '插件'}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
