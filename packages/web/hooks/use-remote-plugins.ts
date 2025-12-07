'use client';

import React from 'react';
import useSWR from 'swr';

/**
 * Remote Plugin Info
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
 * Registry Response
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

const REGISTRY_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:9527/dev/plugins/index.json'
  : 'https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/index.json';

const fetcher = async (url: string) => {
  // 允许浏览器复用缓存，避免每次进入页面都直连远端
  const res = await fetch(url, {
    cache: 'force-cache',
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Failed to fetch plugins: ${res.status}`);
  return res.json() as Promise<PluginRegistry>;
};

export function useRemotePlugins() {
  const { data, error, isLoading, mutate } = useSWR<PluginRegistry>(
    REGISTRY_URL,
    fetcher,
    {
      revalidateOnFocus: false, // Don't spam GitHub/Localhost
      revalidateOnReconnect: false,
      keepPreviousData: true, // Key for UX
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  return {
    plugins: data?.plugins || [],
    categories: data?.categories || [],
    isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: () => mutate(),
  };
}
