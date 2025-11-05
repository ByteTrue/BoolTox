// 内容服务封装：当前直接返回本地静态配置；后续可替换为远程 CMS / API。
// 设计目标：统一访问层 + 轻量缓存 + 失败回退（fallback to static）。

import { overviewContent, serviceStatus, collectionContent, themeContent, marketplaceContent } from '../content/home-content';
import { createLogger } from './logger';

type HomeContentResponse = {
  success: boolean;
  data: Omit<HomeContentBundle, 'source'>;
  error?: string;
};

const logger = createLogger('ContentService');

export interface HomeContentBundle {
  overview: typeof overviewContent;
  serviceStatus: typeof serviceStatus;
  collections: typeof collectionContent;
  themes: typeof themeContent;
  marketplace: typeof marketplaceContent;
  lastUpdated: string;
  source: 'static' | 'api';
}

// 同步本地静态数据
export function getStaticHomeContent(): HomeContentBundle {
  return {
    overview: overviewContent,
    serviceStatus,
    collections: collectionContent,
    themes: themeContent,
    marketplace: marketplaceContent,
    lastUpdated: new Date().toISOString(),
    source: 'static',
  };
}

// 统一异步获取（优先调用 /api/content，失败则回退静态）
export async function fetchHomeContent(): Promise<HomeContentBundle> {
  if (typeof window.ipc === 'undefined') return getStaticHomeContent();
  try {
    const result = await window.ipc.invoke('get-home-content') as HomeContentResponse;
    if (!result.success) throw new Error(result.error || 'IPC error');
    return { ...result.data, source: 'api' };
  } catch (error) {
    logger.error('Failed to fetch home content via IPC:', error);
    return getStaticHomeContent();
  }
}
