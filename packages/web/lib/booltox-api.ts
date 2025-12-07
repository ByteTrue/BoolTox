/**
 * BoolTox API 桥接层
 * 为插件提供统一的 API 访问
 */

import type { AgentClient } from '@booltox/sdk';

export interface BooltoxAPI {
  backend: {
    register: () => Promise<{ channelId: string }>;
    call: (
      channelId: string,
      method: string,
      params?: unknown,
      timeout?: number
    ) => Promise<unknown>;
    notify: (channelId: string, method: string, params?: unknown) => Promise<void>;
    on: (channelId: string, event: string, listener: (data: unknown) => void) => () => void;
    off: (channelId: string, event: string, listener?: (data: unknown) => void) => void;
    isReady: (channelId: string) => boolean;
    waitForReady: (channelId: string, timeout?: number) => Promise<void>;
  };
  window: {
    setTitle: (title: string) => Promise<void>;
  };
  storage: {
    get: <T>(key: string) => Promise<T | undefined>;
    set: <T>(key: string, value: T) => Promise<void>;
    remove: (key: string) => Promise<void>;
  };
  fs: {
    readFile: (path: string, encoding?: string) => Promise<string>;
    writeFile: (path: string, content: string, encoding?: string) => Promise<void>;
  };
}

/**
 * 创建 BoolTox API 实例
 */
export function createBooltoxAPI(
  pluginId: string,
  agentClient: AgentClient
): BooltoxAPI {
  // 后端通道管理
  const channels = new Map<string, {
    listeners: Map<string, Set<(data: unknown) => void>>;
    ready: boolean;
  }>();

  // WebSocket 连接（用于接收后端事件）
  let ws: WebSocket | null = null;

  return {
    // ==================== 后端通信 ====================
    backend: {
      /**
       * 注册后端通道
       */
      async register() {
        try {
          console.log('[BooltoxAPI] Registering backend for plugin:', pluginId);

          // 调用 Agent API 注册后端
          const result = await agentClient.startPlugin(pluginId);
          const channelId = result.channelId || pluginId;

          // 初始化通道状态
          channels.set(channelId, {
            listeners: new Map(),
            ready: false,
          });

          // 建立 WebSocket 连接接收后端事件
          const wsUrl = 'ws://localhost:9527'; // 固定 WebSocket URL
          ws = new WebSocket(`${wsUrl}/plugins/${pluginId}/events`);

          ws.onmessage = (event) => {
            try {
              const message = JSON.parse(event.data);
              const channel = channels.get(channelId);
              if (!channel) return;

              // 处理特殊消息
              if (message.method === '$ready') {
                channel.ready = true;
                const listeners = channel.listeners.get('$ready');
                listeners?.forEach(listener => listener(message.params || {}));
              } else if (message.method === '$event') {
                const listeners = channel.listeners.get('$event');
                listeners?.forEach(listener => listener(message.params || {}));
              }
            } catch (err) {
              console.error('[BooltoxAPI] WebSocket message error:', err);
            }
          };

          ws.onerror = (error) => {
            console.error('[BooltoxAPI] WebSocket error:', error);
          };

          return { channelId };
        } catch (error) {
          console.error('[BooltoxAPI] Register failed:', error);
          throw error;
        }
      },

      /**
       * 调用后端方法
       */
      async call(channelId: string, method: string, params?: unknown, _timeout = 30000) {
        try {
          console.log('[BooltoxAPI] Calling backend method:', method, params);
          const result = await agentClient.callBackend(pluginId, method, params);
          return result.result;
        } catch (error) {
          console.error('[BooltoxAPI] Call failed:', error);
          throw error;
        }
      },

      /**
       * 发送通知（不等待响应）
       */
      async notify(channelId: string, method: string, params?: unknown) {
        try {
          await agentClient.callBackend(pluginId, method, params);
        } catch (error) {
          console.error('[BooltoxAPI] Notify failed:', error);
        }
      },

      /**
       * 监听后端事件
       */
      on(channelId: string, event: string, listener: (data: unknown) => void) {
        const channel = channels.get(channelId);
        if (!channel) {
          console.warn('[BooltoxAPI] Channel not found:', channelId);
          return () => {};
        }

        if (!channel.listeners.has(event)) {
          channel.listeners.set(event, new Set());
        }

        channel.listeners.get(event)!.add(listener);

        // 返回取消监听函数
        return () => {
          channel.listeners.get(event)?.delete(listener);
        };
      },

      /**
       * 取消监听
       */
      off(channelId: string, event: string, listener?: (data: unknown) => void) {
        const channel = channels.get(channelId);
        if (!channel) return;

        if (listener) {
          channel.listeners.get(event)?.delete(listener);
        } else {
          channel.listeners.delete(event);
        }
      },

      /**
       * 检查后端是否就绪
       */
      isReady(channelId: string) {
        return channels.get(channelId)?.ready || false;
      },

      /**
       * 等待后端就绪
       */
      async waitForReady(channelId: string, timeout = 10000) {
        const channel = channels.get(channelId);
        if (!channel) {
          throw new Error('Channel not found');
        }

        if (channel.ready) {
          return;
        }

        // 等待就绪事件
        return new Promise<void>((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Backend ready timeout'));
          }, timeout);

          const listener = () => {
            clearTimeout(timer);
            resolve();
          };

          if (!channel.listeners.has('$ready')) {
            channel.listeners.set('$ready', new Set());
          }
          channel.listeners.get('$ready')!.add(listener);
        });
      },
    },

    // ==================== 窗口管理 ====================
    window: {
      /**
       * 设置窗口标题
       */
      async setTitle(title: string) {
        // 在 Web 版本中，直接修改 document.title
        document.title = `${title} - BoolTox`;
      },
    },

    // ==================== 存储 ====================
    storage: {
      /**
       * 获取存储值
       */
      async get<T>(key: string): Promise<T | undefined> {
        try {
          const fullKey = `plugin:${pluginId}:${key}`;
          const value = localStorage.getItem(fullKey);
          return value ? JSON.parse(value) : undefined;
        } catch (error) {
          console.error('[BooltoxAPI] Storage get failed:', error);
          return undefined;
        }
      },

      /**
       * 设置存储值
       */
      async set<T>(key: string, value: T) {
        try {
          const fullKey = `plugin:${pluginId}:${key}`;
          localStorage.setItem(fullKey, JSON.stringify(value));
        } catch (error) {
          console.error('[BooltoxAPI] Storage set failed:', error);
          throw error;
        }
      },

      /**
       * 删除存储值
       */
      async remove(key: string) {
        try {
          const fullKey = `plugin:${pluginId}:${key}`;
          localStorage.removeItem(fullKey);
        } catch (error) {
          console.error('[BooltoxAPI] Storage remove failed:', error);
          throw error;
        }
      },
    },

    // ==================== 文件系统 ====================
    fs: {
      /**
       * 读取文件
       */
      async readFile(path: string, _encoding = 'utf-8') {
        // TODO: 调用 Agent API
        throw new Error('Not implemented');
      },

      /**
       * 写入文件
       */
      async writeFile(path: string, content: string, _encoding = 'utf-8') {
        // TODO: 调用 Agent API
        throw new Error('Not implemented');
      },
    },
  };
}

/**
 * 注入 BoolTox API 到目标窗口
 */
export function injectBooltoxAPI(
  targetWindow: Window,
  pluginId: string,
  agentClient: AgentClient
): void {
  const api = createBooltoxAPI(pluginId, agentClient);
  const target = targetWindow as Window & { booltox?: BooltoxAPI };
  target.booltox = api;
  console.log('[BooltoxAPI] API injected for plugin:', pluginId);
}
