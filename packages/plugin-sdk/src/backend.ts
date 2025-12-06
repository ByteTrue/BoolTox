/**
 * 后端通信模块
 * JSON-RPC 客户端封装
 */

import type {
  BooltoxBackendAPI,
  BooltoxBackendRegistration,
  BooltoxProcessHandle,
  BooltoxBackendMessage,
} from '@booltox/shared';
import { getBooltoxAPI } from './api.js';

/**
 * 后端客户端类
 * 封装与插件后端进程的通信
 */
export class BackendClient {
  private api: BooltoxBackendAPI;
  private channelId?: string;
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  constructor() {
    this.api = getBooltoxAPI().backend;
  }

  /**
   * 注册并连接到后端进程
   */
  async connect(definition?: BooltoxBackendRegistration): Promise<string> {
    const handle: BooltoxProcessHandle = await this.api.register(definition);
    this.channelId = handle.channelId;

    // 等待后端就绪
    await this.api.waitForReady(this.channelId, 10000);

    return this.channelId;
  }

  /**
   * 调用后端方法（JSON-RPC call）
   */
  async call<TParams = unknown, TResult = unknown>(
    method: string,
    params?: TParams,
    timeout?: number
  ): Promise<TResult> {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    return this.api.call<TParams, TResult>(
      this.channelId,
      method,
      params,
      timeout
    );
  }

  /**
   * 发送通知到后端（JSON-RPC notify，无返回值）
   */
  async notify<TParams = unknown>(
    method: string,
    params?: TParams
  ): Promise<void> {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    return this.api.notify(this.channelId, method, params);
  }

  /**
   * 监听后端事件
   */
  on(event: string, listener: (data: unknown) => void): () => void {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    // 记录监听器
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    // 注册到 API
    const unsubscribe = this.api.on(this.channelId, event, listener);

    // 返回取消监听函数
    return () => {
      unsubscribe();
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * 监听后端事件（一次性）
   */
  once(event: string, listener: (data: unknown) => void): () => void {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    return this.api.once(this.channelId, event, listener);
  }

  /**
   * 取消监听后端事件
   */
  off(event: string, listener?: (data: unknown) => void): void {
    if (!this.channelId) {
      return;
    }

    this.api.off(this.channelId, event, listener);

    if (listener) {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  /**
   * 检查后端是否就绪
   */
  isReady(): boolean {
    if (!this.channelId) {
      return false;
    }
    return this.api.isReady(this.channelId);
  }

  /**
   * 等待后端就绪
   */
  async waitForReady(timeout?: number): Promise<void> {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    return this.api.waitForReady(this.channelId, timeout);
  }

  /**
   * 发送消息到后端（原始消息，不使用 JSON-RPC）
   */
  async postMessage(payload: unknown): Promise<void> {
    if (!this.channelId) {
      throw new Error('Backend not connected. Call connect() first.');
    }

    return this.api.postMessage(this.channelId, payload);
  }

  /**
   * 断开连接并销毁后端进程
   */
  async disconnect(): Promise<void> {
    if (!this.channelId) {
      return;
    }

    // 清理所有监听器
    this.listeners.clear();

    // 销毁后端进程
    await this.api.dispose(this.channelId);

    this.channelId = undefined;
  }

  /**
   * 获取 channelId
   */
  getChannelId(): string | undefined {
    return this.channelId;
  }
}

/**
 * 创建后端客户端实例
 */
export function createBackendClient(): BackendClient {
  return new BackendClient();
}
