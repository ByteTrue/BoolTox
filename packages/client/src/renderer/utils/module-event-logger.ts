// 模块事件日志管理器
// 用于记录模块的安装、卸载、启用、停用等操作，存储到 localStorage

export interface ModuleEvent {
  id: string;                    // 事件唯一ID
  timestamp: number;             // 时间戳
  moduleId: string;              // 模块ID
  moduleName: string;            // 模块名称
  action: 'install' | 'uninstall' | 'enable' | 'disable' | 'pin-to-quick-access' | 'unpin-from-quick-access';
  category: string;              // 模块分类
}

const STORAGE_KEY = 'booltox:module-events';
const MAX_EVENTS = 100; // 最多保存100条事件
const MAX_DAYS = 30;    // 保留30天内的事件

/**
 * 生成唯一事件ID
 */
function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * 从 localStorage 读取事件列表
 */
function getEvents(): ModuleEvent[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data) as ModuleEvent[];
  } catch (error) {
    console.error('Failed to read module events from localStorage:', error);
    return [];
  }
}

/**
 * 保存事件列表到 localStorage
 */
function saveEvents(events: ModuleEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (error) {
    console.error('Failed to save module events to localStorage:', error);
  }
}

/**
 * 记录模块事件
 */
export function logModuleEvent(event: Omit<ModuleEvent, 'id' | 'timestamp'>): void {
  const events = getEvents();

  const newEvent: ModuleEvent = {
    id: generateEventId(),
    timestamp: Date.now(),
    ...event,
  };

  // 添加到列表开头（最新的在前）
  events.unshift(newEvent);

  // 限制事件数量
  const trimmedEvents = events.slice(0, MAX_EVENTS);

  saveEvents(trimmedEvents);
}

/**
 * 获取最近的N条事件
 */
export function getRecentEvents(limit = 10): ModuleEvent[] {
  const events = getEvents();
  return events.slice(0, limit);
}

/**
 * 获取所有事件
 */
export function getAllEvents(): ModuleEvent[] {
  return getEvents();
}

/**
 * 清理过期事件（超过指定天数）
 */
export function clearOldEvents(daysToKeep = MAX_DAYS): void {
  const events = getEvents();
  const cutoffTime = Date.now() - daysToKeep * 24 * 60 * 60 * 1000;

  const recentEvents = events.filter(event => event.timestamp >= cutoffTime);

  saveEvents(recentEvents);
}

/**
 * 清空所有事件
 */
export function clearAllEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear module events:', error);
  }
}

/**
 * 获取特定模块的事件历史
 */
export function getModuleEvents(moduleId: string): ModuleEvent[] {
  const events = getEvents();
  return events.filter(event => event.moduleId === moduleId);
}

/**
 * 获取特定操作类型的事件
 */
export function getEventsByAction(action: ModuleEvent['action']): ModuleEvent[] {
  const events = getEvents();
  return events.filter(event => event.action === action);
}

/**
 * 获取最近激活的模块ID列表（去重）
 * 用于"最近使用"功能
 */
export function getRecentlyActiveModuleIds(limit = 5): string[] {
  const events = getEvents();

  // 筛选 enable 事件
  const enableEvents = events.filter(event => event.action === 'enable');

  // 去重并限制数量
  const uniqueModuleIds = Array.from(
    new Set(enableEvents.map(event => event.moduleId))
  );

  return uniqueModuleIds.slice(0, limit);
}
