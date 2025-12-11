/**
 * React Hooks 模块
 * 提供便捷的 React Hook API
 */

import { useState, useEffect, useCallback } from 'react';
import { BackendClient } from './backend.js';
import { getBooltoxClient } from './api.js';

/**
 * useStorage Hook
 * 自动同步的本地存储
 */
export function useStorage<T>(key: string, defaultValue: T): [T, (value: T) => Promise<void>] {
  const [value, setValue] = useState<T>(defaultValue);
  const [isInitialized, setIsInitialized] = useState(false);
  const client = getBooltoxClient();

  // 初始化：从存储读取
  useEffect(() => {
    client
      .getStorage<T>(key)
      .then((stored) => {
        if (stored !== undefined) {
          setValue(stored);
        }
        setIsInitialized(true);
      })
      .catch((error) => {
        console.error(`Failed to load storage key "${key}":`, error);
        setIsInitialized(true);
      });
  }, [key]);

  // 设置值并同步到存储
  const setStorageValue = useCallback(
    async (newValue: T) => {
      setValue(newValue);
      try {
        await client.setStorage(key, newValue);
      } catch (error) {
        console.error(`Failed to save storage key "${key}":`, error);
      }
    },
    [key, client]
  );

  return [value, setStorageValue];
}

/**
 * useBackend Hook
 * 自动连接和管理后端进程
 */
export function useBackend() {
  const [backend, setBackend] = useState<BackendClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);

  useEffect(() => {
    const client = new BackendClient();

    // 自动连接
    client
      .connect()
      .then((channelId) => {
        setBackend(client);
        setIsConnected(true);
        setIsConnecting(false);
        console.log('Backend connected:', channelId);
      })
      .catch((err) => {
        setError(err.message);
        setIsConnecting(false);
        console.error('Failed to connect to backend:', err);
      });

    // 清理
    return () => {
      if (client) {
        client.disconnect().catch(console.error);
      }
    };
  }, []);

  return {
    /** 后端客户端实例 */
    backend,
    /** 是否已连接 */
    isConnected,
    /** 是否正在连接 */
    isConnecting,
    /** 连接错误 */
    error,
  };
}

/**
 * useBackendEvent Hook
 * 监听后端事件
 */
export function useBackendEvent<T = unknown>(
  backend: BackendClient | null,
  event: string,
  callback: (data: T) => void
): void {
  useEffect(() => {
    if (!backend || !backend.isReady()) {
      return;
    }

    // 注册监听器
    const unsubscribe = backend.on(event, callback as (data: unknown) => void);

    // 清理
    return () => {
      unsubscribe();
    };
  }, [backend, event, callback]);
}

/**
 * useBackendCall Hook
 * 便捷的后端方法调用
 */
export function useBackendCall<TParams = unknown, TResult = unknown>(
  backend: BackendClient | null
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);

  const call = useCallback(
    async (method: string, params?: TParams): Promise<TResult | null> => {
      if (!backend) {
        setError('Backend not connected');
        return null;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await backend.call<TParams, TResult>(method, params);
        setData(result);
        setIsLoading(false);
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        setIsLoading(false);
        return null;
      }
    },
    [backend]
  );

  return {
    /** 调用后端方法 */
    call,
    /** 是否正在加载 */
    isLoading,
    /** 错误信息 */
    error,
    /** 返回数据 */
    data,
  };
}

/**
 * useWindowTitle Hook
 * 自动设置窗口标题
 */
export function useWindowTitle(title: string): void {
  const client = getBooltoxClient();

  useEffect(() => {
    client.setTitle(title).catch(console.error);
  }, [title, client]);
}
