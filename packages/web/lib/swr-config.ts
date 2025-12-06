/**
 * SWR 配置和自定义 Hooks
 * 用于远程数据缓存和自动重新验证
 */

import useSWR from 'swr';
import type { SWRConfiguration } from 'swr';

/**
 * 全局 SWR 配置
 */
export const swrConfig: SWRConfiguration = {
  // 重新验证策略
  revalidateOnFocus: true,      // 窗口聚焦时重新验证
  revalidateOnReconnect: true,  // 网络重连时重新验证
  dedupingInterval: 2000,       // 2秒内去重请求

  // 缓存策略
  refreshInterval: 0,           // 默认不自动刷新（按需启用）

  // 重试策略
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,     // 5秒重试间隔

  // 性能优化
  suspense: false,              // 暂不启用 Suspense
  keepPreviousData: true,       // 保留旧数据直到新数据加载
};

/**
 * Fetcher 函数（使用 ky）
 */
export async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const error = new Error('数据获取失败');
    throw error;
  }

  return response.json();
}

/**
 * 使用远程插件数据（带 SWR 缓存）
 */
export function useRemotePluginsWithSWR() {
  const REGISTRY_URL =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:9527/dev/plugins/index.json'
      : 'https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/index.json';

  type RegistryData = {
    plugins: any[];
    categories: any[];
  };

  const { data, error, isLoading, mutate } = useSWR<RegistryData>(
    REGISTRY_URL,
    () => fetcher<RegistryData>(REGISTRY_URL),
    {
      ...swrConfig,
      refreshInterval: 5 * 60 * 1000, // 每 5 分钟自动刷新
      dedupingInterval: 10000,        // 10秒内去重
    }
  );

  return {
    plugins: data?.plugins || [],
    categories: data?.categories || [],
    isLoading,
    error: error?.message,
    reload: mutate, // 手动刷新
  };
}

/**
 * 使用插件数据（带预加载）
 */
export function usePluginWithPreload(pluginId: string) {
  const { data, error, isLoading } = useSWR(
    pluginId ? `/api/plugins/${pluginId}` : null,
    fetcher,
    swrConfig
  );

  return {
    plugin: data,
    isLoading,
    error: error?.message,
  };
}

/**
 * 预加载数据（用于 Link hover 时）
 */
export function preloadPluginData(pluginId: string) {
  // SWR 会自动缓存
  fetcher(`/api/plugins/${pluginId}`).catch(() => {
    // 静默失败，仅预加载
  });
}
