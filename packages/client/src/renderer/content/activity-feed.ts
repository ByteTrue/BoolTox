/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

export interface ActivityFeedItem {
  id: string;
  type: 'announcement' | 'update';
  title: string;
  content: string;
  timestamp: number;
  priority: 'high' | 'normal' | 'low';
  icon?: string;
  ctaLabel?: string;
  ctaUrl?: string;
}

/**
 * 根据优先级排序
 */
export function sortByPriority(items: ActivityFeedItem[]): ActivityFeedItem[] {
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  return [...items].sort((a, b) => {
    // 优先级高的在前
    const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // 优先级相同时，时间新的在前
    return b.timestamp - a.timestamp;
  });
}

/**
 * 格式化时间戳为相对时间
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} 天前`;
  } else if (hours > 0) {
    return `${hours} 小时前`;
  } else if (minutes > 0) {
    return `${minutes} 分钟前`;
  } else if (seconds > 0) {
    return `${seconds} 秒前`;
  } else {
    return '刚刚';
  }
}
