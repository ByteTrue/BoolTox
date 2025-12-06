'use client';

import React from 'react';

/**
 * 远程插件信息（从插件市场）
 */
export interface RemotePlugin {
  id: string;
  name: string;
  version: string;
  author: string;
  description: string;
  category: string;
  keywords: string[];
  verified: boolean;
  icon: string;
  homepage: string;
  repository: string;
  downloadUrl: string;
  sha256: string;
  size: number;
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    stars: number;
  };
  createdAt: string;
  updatedAt: string;
  screenshots: string[];
  requirements?: {
    python?: string;
    node?: string;
    platform?: string[];
  };
}

/**
 * 插件注册表响应
 */
interface PluginRegistry {
  version: string;
  updated: string;
  plugins: RemotePlugin[];
  categories: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
  }>;
}

/**
 * useRemotePlugins Hook
 * 从 GitHub 获取远程插件列表
 */
export function useRemotePlugins() {
  const [plugins, setPlugins] = React.useState<RemotePlugin[]>([]);
  const [categories, setCategories] = React.useState<PluginRegistry['categories']>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // 插件注册表 URL（开发环境使用本地文件）
  const REGISTRY_URL = process.env.NODE_ENV === 'development'
    ? 'http://localhost:9527/dev/plugins/index.json' // 开发环境：通过 Agent 提供
    : 'https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/index.json'; // 生产环境：GitHub Raw

  // 加载远程插件列表
  const loadPlugins = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(REGISTRY_URL, {
        cache: 'no-cache',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch plugins: ${response.status}`);
      }

      const data: PluginRegistry = await response.json();
      setPlugins(data.plugins || []);
      setCategories(data.categories || []);
    } catch (err) {
      console.error('[useRemotePlugins] Load failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
      setPlugins([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [REGISTRY_URL]);

  // 初始加载
  React.useEffect(() => {
    loadPlugins();
  }, [loadPlugins]);

  return {
    plugins,
    categories,
    isLoading,
    error,
    reload: loadPlugins,
  };
}
