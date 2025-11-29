import { useCallback, useEffect, useState } from 'react';
import type { ModuleInstance } from '@/types/module';
import {
  type ModuleEvent,
  getAllEvents,
  getRecentEvents,
  getRecentlyActiveModuleIds,
  clearOldEvents,
} from '@/utils/module-event-logger';

/**
 * 模块事件管理 Hook
 * 提供事件列表的响应式访问和辅助方法
 */
export function useModuleEvents() {
  const [events, setEvents] = useState<ModuleEvent[]>([]);

  // 从 localStorage 加载事件
  const loadEvents = useCallback(() => {
    const allEvents = getAllEvents();
    setEvents(allEvents);
  }, []);

  // 初始化时加载事件
  useEffect(() => {
    loadEvents();

    // 清理过期事件（超过30天）
    clearOldEvents(30);
  }, [loadEvents]);

  // 监听 localStorage 变化（跨组件同步）
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'booltox:module-events') {
        loadEvents();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadEvents]);

  /**
   * 获取最近使用的模块实例列表
   * @param installedModules 已安装的模块列表
   * @param limit 返回数量限制
   */
  const getRecentlyActiveModules = useCallback(
    (installedModules: ModuleInstance[], limit = 5): ModuleInstance[] => {
      const recentIds = getRecentlyActiveModuleIds(limit);

      // 根据 ID 列表顺序返回模块实例
      return recentIds
        .map(id => installedModules.find(m => m.id === id))
        .filter((m): m is ModuleInstance => m !== undefined);
    },
    []
  );

  /**
   * 获取最近N条事件
   */
  const getRecent = useCallback((limit = 10): ModuleEvent[] => {
    return getRecentEvents(limit);
  }, []);

  /**
   * 刷新事件列表
   */
  const refresh = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    events,
    getRecentlyActiveModules,
    getRecent,
    refresh,
  };
}
