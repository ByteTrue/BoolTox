import type { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs';
import { getPluginManager } from '@booltox/core/plugin';

/**
 * BoolTox 客户端脚本（内联，注入到插件 HTML 中）
 */
const BOOLTOX_CLIENT_SCRIPT = `
(function () {
  let requestId = 0;
  const pendingRequests = new Map();
  const eventListeners = new Map();

  function sendRequest(api, method, params = []) {
    return new Promise((resolve, reject) => {
      const id = 'req-' + (++requestId);
      pendingRequests.set(id, { resolve, reject });
      console.log('[BooltoxClient] 发送请求:', { id, api, method, params });
      window.parent.postMessage({ type: 'booltox-request', id, api, method, params }, '*');
      setTimeout(() => {
        if (pendingRequests.has(id)) {
          pendingRequests.delete(id);
          console.error('[BooltoxClient] 请求超时:', id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    console.log('[BooltoxClient] 收到消息:', message);
    if (!message) return;

    if (message.type === 'booltox-response') {
      console.log('[BooltoxClient] 处理响应:', message.id);
      const pending = pendingRequests.get(message.id);
      if (pending) {
        pendingRequests.delete(message.id);
        if (message.error) {
          console.error('[BooltoxClient] 响应错误:', message.error);
          pending.reject(new Error(message.error));
        } else {
          console.log('[BooltoxClient] 响应成功:', message.result);
          pending.resolve(message.result);
        }
      } else {
        console.warn('[BooltoxClient] 未找到待处理请求:', message.id);
      }
    }

    if (message.type === 'booltox-event') {
      console.log('[BooltoxClient] 收到事件:', message.method, message.params);
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

  window.booltox = {
    backend: {
      async register() {
        return await sendRequest('backend', 'register');
      },
      async call(channelId, method, params, timeout) {
        return await sendRequest('backend', 'call', [method, params, timeout]);
      },
      async notify(channelId, method, params) {
        await sendRequest('backend', 'notify', [method, params]);
      },
      on(channelId, event, listener) {
        if (!eventListeners.has(event)) {
          eventListeners.set(event, new Set());
        }
        eventListeners.get(event).add(listener);
        return () => { eventListeners.get(event)?.delete(listener); };
      },
      off(channelId, event, listener) {
        if (listener) {
          eventListeners.get(event)?.delete(listener);
        } else {
          eventListeners.delete(event);
        }
      },
      isReady(channelId) {
        return true;
      },
      async waitForReady(channelId, timeout) {
        // 简化实现：startPlugin 返回时后端已就绪
        console.log('[BooltoxClient] waitForReady: 后端已就绪');
        return Promise.resolve();
      },
    },
    window: {
      async setTitle(title) {
        await sendRequest('window', 'setTitle', [title]);
      },
    },
    storage: {
      async get(key) {
        return await sendRequest('storage', 'get', [key]);
      },
      async set(key, value) {
        await sendRequest('storage', 'set', [key, value]);
      },
      async remove(key) {
        await sendRequest('storage', 'remove', [key]);
      },
    },
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
`;

/**
 * 插件静态文件服务
 * 提供插件前端文件访问
 */
export async function staticRoutes(server: FastifyInstance) {
  const pluginManager = getPluginManager();

  // 开发环境：提供插件注册表
  if (process.env.NODE_ENV === 'development' && process.env.BOOLTOX_DEV_PLUGINS_DIR) {
    const pluginsRoot = path.dirname(process.env.BOOLTOX_DEV_PLUGINS_DIR);
    const registryPath = path.join(pluginsRoot, 'plugins/index.json');

    server.get('/dev/plugins/index.json', async (request, reply) => {
      try {
        if (fs.existsSync(registryPath)) {
          const content = fs.readFileSync(registryPath, 'utf-8');
          reply.type('application/json');
          reply.header('Access-Control-Allow-Origin', '*');
          return reply.send(content);
        } else {
          reply.code(404);
          return { error: 'Registry not found' };
        }
      } catch (error) {
        server.log.error('Failed to load registry:', error);
        reply.code(500);
        return { error: 'Internal server error' };
      }
    });

    server.log.info(`[Static] Dev registry enabled: ${registryPath}`);
  }

  // 插件静态文件路由 - 动态注册
  server.get('/plugins/:pluginId/static/*', async (request, reply) => {
    const { pluginId } = request.params as { pluginId: string };
    const filepath = (request.params as any)['*'];

    try {
      // 获取插件信息
      const plugin = pluginManager.getPlugin(pluginId);
      if (!plugin) {
        reply.code(404);
        return { error: 'Plugin not found' };
      }

      // 构建文件路径
      const pluginDistDir = path.join(plugin.path, 'dist');
      const fullPath = path.resolve(pluginDistDir, filepath);

      // 安全检查：防止路径遍历攻击
      if (!fullPath.startsWith(pluginDistDir)) {
        reply.code(403);
        return { error: 'Forbidden' };
      }

      // 检查文件是否存在
      if (!fs.existsSync(fullPath)) {
        reply.code(404);
        return { error: 'File not found' };
      }

      // 读取文件
      let content = fs.readFileSync(fullPath);

      // 设置正确的 Content-Type
      const ext = path.extname(fullPath).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
      };

      const contentType = contentTypes[ext] || 'application/octet-stream';
      reply.type(contentType);

      // 特殊处理：如果是 index.html，注入客户端脚本
      if (ext === '.html' && filepath === 'index.html') {
        let html = content.toString('utf-8');

        // 注入到 </head> 之前
        html = html.replace(
          '</head>',
          `<script>${BOOLTOX_CLIENT_SCRIPT}</script></head>`
        );

        content = Buffer.from(html, 'utf-8');
        server.log.info(`[Static] Injected booltox-client.js into ${pluginId}/index.html`);
      }

      // 添加 CORS 头
      reply.header('Access-Control-Allow-Origin', '*');
      reply.header('Access-Control-Allow-Methods', 'GET');

      return reply.send(content);
    } catch (error) {
      server.log.error(`Static file error: ${error}`);
      reply.code(500);
      return { error: 'Internal server error' };
    }
  });

  server.log.info('Static file routes registered');
}
