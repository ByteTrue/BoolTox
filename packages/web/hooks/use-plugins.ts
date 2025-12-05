'use client';

import React from 'react';
import { useAgent } from '@/hooks/use-agent';
import type { PluginInfo } from '@booltox/sdk';

export function usePlugins() {
  const { client, isAvailable } = useAgent();
  const [plugins, setPlugins] = React.useState<PluginInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 加载插件列表
  const loadPlugins = React.useCallback(async () => {
    if (!client) {
      setPlugins([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await client.getPlugins();
      setPlugins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
      setPlugins([]);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  // 安装插件
  const installPlugin = React.useCallback(
    async (source: string, type: 'url' | 'local', hash?: string) => {
      if (!client) {
        throw new Error('Agent not connected');
      }

      await client.installPlugin({ source, type, hash });
      await loadPlugins();
    },
    [client, loadPlugins]
  );

  // 卸载插件
  const uninstallPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) {
        throw new Error('Agent not connected');
      }

      await client.uninstallPlugin(pluginId);
      await loadPlugins();
    },
    [client, loadPlugins]
  );

  // 启动插件
  const startPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) {
        throw new Error('Agent not connected');
      }

      await client.startPlugin(pluginId);
      await loadPlugins();
    },
    [client, loadPlugins]
  );

  // 停止插件
  const stopPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) {
        throw new Error('Agent not connected');
      }

      await client.stopPlugin(pluginId);
      await loadPlugins();
    },
    [client, loadPlugins]
  );

  // 初始加载
  React.useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  return {
    plugins,
    isLoading,
    error,
    loadPlugins,
    installPlugin,
    uninstallPlugin,
    startPlugin,
    stopPlugin,
  };
}
