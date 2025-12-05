/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 通用类型定义
 * 用于替代 any 类型，提供类型安全
 */

/**
 * 未知的事件数据
 */
export type UnknownEventData = Record<string, unknown> | unknown[];

/**
 * 事件监听器类型
 */
export type EventListener<T = UnknownEventData> = (eventType: string, data: T) => void;

/**
 * 通信统计数据
 */
export interface CommunicationStats {
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  activeConnections: number;
  averageProcessingTime: number;
  topModulesByActivity: Array<{ moduleId: string; messageCount: number }>;
}

/**
 * IPC 事件数据
 */
export interface IpcEventData {
  [key: string]: unknown;
}

/**
 * API 请求参数
 */
export type ApiParams = Record<string, unknown> | unknown[] | string | number | boolean | null | undefined;

/**
 * 错误详情
 */
export interface ErrorDetails {
  code?: string;
  message: string;
  stack?: string;
  originalError?: Error;
  [key: string]: unknown;
}

/**
 * JSON 兼容的值类型
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonArray;

export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonArray = Array<JsonValue>;

/**
 * 类型守卫：检查是否为 JsonObject
 */
export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 类型守卫：检查是否为 JsonArray
 */
export function isJsonArray(value: unknown): value is JsonArray {
  return Array.isArray(value);
}

/**
 * 类型守卫：检查是否为 JsonValue
 */
export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null) return true;
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  if (isJsonObject(value) || isJsonArray(value)) {
    // 递归检查对象/数组的所有值
    if (Array.isArray(value)) {
      return value.every(isJsonValue);
    }
    return Object.values(value).every(isJsonValue);
  }
  return false;
}
