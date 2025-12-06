/**
 * BoolTox 客户端 API (插件端)
 * 通过 postMessage 与父页面通信
 * 此文件会被注入到插件的 HTML 中
 */

(function () {
  let requestId = 0;
  const pendingRequests = new Map();
  const eventListeners = new Map();

  /**
   * 发送请求到父页面
   */
  function sendRequest(api, method, params = []) {
    return new Promise((resolve, reject) => {
      const id = `req-${++requestId}`;

      // 保存待处理请求
      pendingRequests.set(id, { resolve, reject });

      // 发送消息
      window.parent.postMessage(
        {
          type: 'booltox-request',
          id,
          api,
          method,
          params,
        },
        '*'
      );

      // 超时处理
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * 处理来自父页面的消息
   */
  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message) return;

    // 响应消息
    if (message.type === 'booltox-response') {
      const pending = pendingRequests.get(message.id);
      if (pending) {
        pendingRequests.delete(message.id);
        if (message.error) {
          pending.reject(new Error(message.error));
        } else {
          pending.resolve(message.result);
        }
      }
    }

    // 事件消息
    if (message.type === 'booltox-event') {
      const listeners = eventListeners.get(message.method);
      if (listeners) {
        listeners.forEach((listener) => {
          try {
            listener(message.params?.[0]);
          } catch (err) {
            console.error('[BooltoxClient] Event listener error:', err);
          }
        });
      }
    }
  });

  /**
   * 创建 window.booltox API
   */
  window.booltox = {
    // ==================== 后端通信 ====================
    backend: {
      async register() {
        const result = await sendRequest('backend', 'register');
        return result;
      },

      async call(channelId, method, params, timeout) {
        const result = await sendRequest('backend', 'call', [method, params, timeout]);
        return result;
      },

      async notify(channelId, method, params) {
        await sendRequest('backend', 'notify', [method, params]);
      },

      on(channelId, event, listener) {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, new Set());
        }
        eventListeners.get(event).add(listener);

        return () => {
          eventListeners.get(event)?.delete(listener);
        };
      },

      off(channelId, event, listener) {
        if (listener) {
          eventListeners.get(event)?.delete(listener);
        } else {
          eventListeners.delete(event);
        }
      },

      isReady(channelId) {
        // 简化实现：假设 register 完成后就是 ready
        return true;
      },

      async waitForReady(channelId, timeout) {
        // 等待 $ready 事件
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            reject(new Error('Backend ready timeout'));
          }, timeout || 10000);

          this.on(channelId, '$ready', () => {
            clearTimeout(timer);
            resolve();
          });
        });
      },
    },

    // ==================== 窗口管理 ====================
    window: {
      async setTitle(title) {
        await sendRequest('window', 'setTitle', [title]);
      },
    },

    // ==================== 存储 ====================
    storage: {
      async get(key) {
        const result = await sendRequest('storage', 'get', [key]);
        return result;
      },

      async set(key, value) {
        await sendRequest('storage', 'set', [key, value]);
      },

      async remove(key) {
        await sendRequest('storage', 'remove', [key]);
      },
    },

    // ==================== 文件系统 ====================
    fs: {
      async readFile(path, encoding) {
        throw new Error('Not implemented');
      },

      async writeFile(path, content, encoding) {
        throw new Error('Not implemented');
      },
    },
  };

  console.log('[BooltoxClient] API ready');
})();
