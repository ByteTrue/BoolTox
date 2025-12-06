/**
 * BoolTox API 桥接层 (基于 postMessage)
 * 为 iframe 插件提供 API 访问
 */

import type { AgentClient } from '@booltox/sdk';

/**
 * postMessage 消息格式
 */
interface BooltoxMessage {
  type: 'booltox-request' | 'booltox-response' | 'booltox-event';
  id?: string;
  api: string;
  method: string;
  params?: any[];
  result?: any;
  error?: string;
}

/**
 * 创建 PostMessage API 桥接
 * 父页面监听 iframe 的请求并转发到 Agent
 */
export function createPostMessageBridge(
  pluginId: string,
  agentClient: AgentClient,
  iframeElement: HTMLIFrameElement
): () => void {
  let channelId: string | null = null;
  const pendingRequests = new Map<string, {
    resolve: (result: any) => void;
    reject: (error: any) => void;
  }>();

  // WebSocket 连接（用于接收后端事件）
  let ws: WebSocket | null = null;

  /**
   * 处理来自 iframe 的消息
   */
  const handleMessage = async (event: MessageEvent) => {
    // 安全检查：确保消息来自 iframe
    if (event.source !== iframeElement.contentWindow) {
      return;
    }

    const message = event.data as BooltoxMessage;
    if (!message || message.type !== 'booltox-request') {
      return;
    }

    console.log('[PostMessageBridge] 收到请求:', message);

    try {
      let result: any;

      // 根据 API 类型分发
      if (message.api === 'backend') {
        console.log('[PostMessageBridge] 调用 handleBackendAPI');
        result = await handleBackendAPI(message);
        console.log('[PostMessageBridge] handleBackendAPI 返回:', result);
      } else if (message.api === 'window') {
        result = await handleWindowAPI(message);
      } else if (message.api === 'storage') {
        result = await handleStorageAPI(message);
      } else {
        throw new Error(`Unknown API: ${message.api}`);
      }

      // 发送响应
      console.log('[PostMessageBridge] 发送响应:', message.id, result);
      sendResponse(message.id!, result);
    } catch (error) {
      console.error('[PostMessageBridge] 处理错误:', error);
      sendError(message.id!, error instanceof Error ? error.message : 'Unknown error');
    }
  };

  /**
   * 处理 backend API
   */
  const handleBackendAPI = async (message: BooltoxMessage) => {
    switch (message.method) {
      case 'register': {
        // 启动后端
        console.log('[PostMessageBridge] 启动插件后端');
        const result = await agentClient.startPlugin(pluginId);
        channelId = result.channelId || pluginId;
        console.log('[PostMessageBridge] 后端已启动, channelId:', channelId);

        // 建立 WebSocket 连接接收事件
        try {
          // 使用固定的 WebSocket URL（与 Agent 地址一致）
          const wsUrl = 'ws://localhost:9527';
          console.log('[PostMessageBridge] 建立 WebSocket 连接:', `${wsUrl}/plugins/${pluginId}/events`);

          ws = new WebSocket(`${wsUrl}/plugins/${pluginId}/events`);

          // 等待连接建立
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
              console.warn('[PostMessageBridge] WebSocket 连接超时，继续执行');
              resolve(); // 超时也继续，不阻塞
            }, 3000);

            ws!.onopen = () => {
              console.log('[PostMessageBridge] WebSocket 已连接');
              clearTimeout(timeout);

              // 连接成功后设置消息处理器
              ws!.onmessage = (wsEvent) => {
                try {
                  const data = JSON.parse(wsEvent.data);
                  console.log('[PostMessageBridge] WebSocket 收到事件:', data);
                  sendEvent(data.method, data.params);
                } catch (err) {
                  console.error('[PostMessageBridge] WebSocket 消息解析错误:', err);
                }
              };

              resolve();
            };

            ws!.onerror = (error) => {
              console.error('[PostMessageBridge] WebSocket 连接错误:', error);
              clearTimeout(timeout);
              resolve(); // 错误也继续，不阻塞
            };
          });
        } catch (err) {
          console.error('[PostMessageBridge] WebSocket 初始化失败:', err);
          // 继续执行，不阻塞主流程
        }

        console.log('[PostMessageBridge] 后端注册完成');
        return { channelId };
      }

      case 'call': {
        const [method, params, timeout] = message.params || [];
        const result = await agentClient.callBackend(pluginId, method, params);
        return result.result;
      }

      case 'notify': {
        const [method, params] = message.params || [];
        await agentClient.callBackend(pluginId, method, params);
        return {};
      }

      case 'isReady':
        return channelId !== null;

      case 'waitForReady': {
        // TODO: 实现等待逻辑
        return {};
      }

      default:
        throw new Error(`Unknown backend method: ${message.method}`);
    }
  };

  /**
   * 处理 window API
   */
  const handleWindowAPI = async (message: BooltoxMessage) => {
    switch (message.method) {
      case 'setTitle': {
        const [title] = message.params || [];
        document.title = `${title} - BoolTox`;
        return {};
      }

      default:
        throw new Error(`Unknown window method: ${message.method}`);
    }
  };

  /**
   * 处理 storage API
   */
  const handleStorageAPI = async (message: BooltoxMessage) => {
    switch (message.method) {
      case 'get': {
        const [key] = message.params || [];
        const fullKey = `plugin:${pluginId}:${key}`;
        const value = localStorage.getItem(fullKey);
        return value ? JSON.parse(value) : undefined;
      }

      case 'set': {
        const [key, value] = message.params || [];
        const fullKey = `plugin:${pluginId}:${key}`;
        localStorage.setItem(fullKey, JSON.stringify(value));
        return {};
      }

      case 'remove': {
        const [key] = message.params || [];
        const fullKey = `plugin:${pluginId}:${key}`;
        localStorage.removeItem(fullKey);
        return {};
      }

      default:
        throw new Error(`Unknown storage method: ${message.method}`);
    }
  };

  /**
   * 发送响应到 iframe
   */
  const sendResponse = (id: string, result: any) => {
    const response: BooltoxMessage = {
      type: 'booltox-response',
      id,
      api: '',
      method: '',
      result,
    };

    console.log('[PostMessageBridge] postMessage 发送响应:', response);
    iframeElement.contentWindow?.postMessage(response, '*');
    console.log('[PostMessageBridge] postMessage 已调用');
  };

  /**
   * 发送错误到 iframe
   */
  const sendError = (id: string, error: string) => {
    const response: BooltoxMessage = {
      type: 'booltox-response',
      id,
      api: '',
      method: '',
      error,
    };

    iframeElement.contentWindow?.postMessage(response, '*');
  };

  /**
   * 发送事件到 iframe
   */
  const sendEvent = (eventName: string, data: any) => {
    const message: BooltoxMessage = {
      type: 'booltox-event',
      api: 'backend',
      method: eventName,
      params: [data],
    };

    iframeElement.contentWindow?.postMessage(message, '*');
  };

  // 注册消息监听器
  window.addEventListener('message', handleMessage);

  console.log('[PostMessageBridge] API bridge created for plugin:', pluginId);

  // 返回清理函数
  return () => {
    window.removeEventListener('message', handleMessage);
    ws?.close();
    console.log('[PostMessageBridge] API bridge destroyed for plugin:', pluginId);
  };
}
