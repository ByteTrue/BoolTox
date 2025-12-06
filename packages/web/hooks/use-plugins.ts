'use client';

import React from 'react';
import useSWR, { mutate } from 'swr';
import { useAgent } from '@/hooks/use-agent';
import type { PluginInfo } from '@booltox/sdk';

const SWR_KEY = 'plugins-list';

export function usePlugins() {
  const { client, isAvailable } = useAgent();

  // SWR Fetcher
  const fetcher = React.useCallback(async () => {
    if (!client) return [];
    return client.getPlugins();
  }, [client]);

  // Use SWR for auto-caching and revalidation
  // keepPreviousData: true -> prevents flashing empty list during reloads
  const { data: plugins = [], isLoading, error } = useSWR(
    isAvailable ? SWR_KEY : null, 
    fetcher,
    {
      keepPreviousData: true,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  // Install Plugin
  const installPlugin = React.useCallback(
    async (source: string, type: 'url' | 'local', hash?: string) => {
      if (!client) throw new Error('Agent not connected');
      // No optimistic update for install as we don't know the result yet
      await client.installPlugin({ source, type, hash });
      mutate(SWR_KEY);
    },
    [client]
  );

  // Uninstall Plugin
  const uninstallPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) throw new Error('Agent not connected');

      // Optimistic update: Remove from list immediately
      mutate(
        SWR_KEY,
        (current: PluginInfo[] = []) => current.filter(p => p.id !== pluginId),
        false
      );

      await client.uninstallPlugin(pluginId);
      mutate(SWR_KEY); // Revalidate to be sure
    },
    [client]
  );

  // Start Plugin
  const startPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) throw new Error('Agent not connected');

      // Optimistic update: Mark as running immediately
      mutate(
        SWR_KEY,
        (current: PluginInfo[] = []) => 
          current.map(p => p.id === pluginId ? { ...p, status: 'running' } : p),
        false
      );

      await client.startPlugin(pluginId);
      mutate(SWR_KEY);
    },
    [client]
  );

  // Stop Plugin
  const stopPlugin = React.useCallback(
    async (pluginId: string) => {
      if (!client) throw new Error('Agent not connected');

      // Optimistic update: Mark as stopped immediately
      mutate(
        SWR_KEY,
        (current: PluginInfo[] = []) => 
          current.map(p => p.id === pluginId ? { ...p, status: 'stopped' } : p),
        false
      );

      await client.stopPlugin(pluginId);
      mutate(SWR_KEY);
    },
    [client]
  );

  return {
    plugins,
    isLoading,
    error,
    installPlugin,
    uninstallPlugin,
    startPlugin,
    stopPlugin,
    reload: () => mutate(SWR_KEY),
  };
}
