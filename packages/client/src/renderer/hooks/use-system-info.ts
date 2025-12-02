/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect, useCallback } from 'react';
import type { SystemInfo } from '@/types/system';

/**
 * 系统信息 Hook
 * 自动从 Electron 主进程获取系统信息，并每60秒刷新一次
 */
export function useSystemInfo() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemInfo = useCallback(async () => {
    try {
      setIsLoading(true);
      const info = await window.ipc.invoke('get-system-info');
      setSystemInfo(info as SystemInfo);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch system info:', err);
      setError(err instanceof Error ? err.message : '获取系统信息失败');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // 初始加载
    fetchSystemInfo();

    // 每60秒自动刷新
    const interval = setInterval(fetchSystemInfo, 60000);

    return () => clearInterval(interval);
  }, [fetchSystemInfo]);

  return {
    systemInfo,
    isLoading,
    error,
    refresh: fetchSystemInfo,
  };
}

/**
 * 格式化字节为人类可读格式
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 格式化运行时长
 * @param seconds 秒数
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}天`);
  if (hours > 0) parts.push(`${hours}小时`);
  if (minutes > 0) parts.push(`${minutes}分钟`);

  return parts.length > 0 ? parts.join(' ') : '刚刚启动';
}

/**
 * 获取操作系统图标
 */
export function getOSIcon(platform: string): string {
  switch (platform) {
    case 'win32':
      return '🪟';
    case 'darwin':
      return '🍎';
    case 'linux':
      return '🐧';
    default:
      return '💻';
  }
}

/**
 * 计算使用百分比
 */
export function calculatePercentage(used: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((used / total) * 100 * 10) / 10; // 保留1位小数
}

/**
 * 根据使用百分比获取颜色状态
 */
export function getUsageColor(percentage: number): 'green' | 'yellow' | 'red' {
  if (percentage >= 90) return 'red';
  if (percentage >= 70) return 'yellow';
  return 'green';
}
