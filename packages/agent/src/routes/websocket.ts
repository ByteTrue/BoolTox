import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import { getBackendRunner, type BackendEvent } from '@booltox/core/runtime';

/**
 * 插件 WebSocket 事件路由
 * 用于实时推送后端事件到前端
 */
export async function websocketRoutes(server: FastifyInstance) {
  const backendRunner = getBackendRunner();

  // 插件事件流
  server.get('/plugins/:pluginId/events', { websocket: true }, (connection, request) => {
    const { pluginId } = request.params as { pluginId: string };
    const socket: WebSocket = connection.socket;

    server.log.info(`[WebSocket] Client connected for plugin: ${pluginId}`);

    // 监听后端事件并转发
    const handleBackendEvent = (event: BackendEvent) => {
      server.log.info(`[WebSocket] 收到 BackendEvent:`, event);

      // 只转发属于此插件的事件
      if (!event.channelId) {
        server.log.warn(`[WebSocket] Event missing channelId`);
        return;
      }

      if (!event.channelId.startsWith(pluginId)) {
        server.log.debug(`[WebSocket] Event 不属于此插件: ${event.channelId} vs ${pluginId}`);
        return;
      }

      try {
        let method = '';
        let params = event.data || {};

        if (event.type === 'ready') {
          method = '$ready';
        } else if (event.type === 'event') {
          method = '$event';
        } else if (event.type === 'log') {
          method = '$log';
        } else {
          server.log.warn(`[WebSocket] Unknown event type: ${event.type}`);
          return;
        }

        const message = {
          jsonrpc: '2.0',
          method,
          params,
        };

        server.log.info(`[WebSocket] 发送消息到浏览器:`, message);
        socket.send(JSON.stringify(message));
      } catch (err) {
        server.log.error(`[WebSocket] Send failed:`, err);
      }
    };

    // 注册事件监听器
    backendRunner.on('message', handleBackendEvent);
    server.log.info(`[WebSocket] 已注册事件监听器`);

    // 连接关闭清理
    socket.on('close', () => {
      server.log.info(`[WebSocket] Client disconnected for plugin: ${pluginId}`);
      backendRunner.off('message', handleBackendEvent);
    });

    socket.on('error', (error) => {
      server.log.error(`[WebSocket] Error for plugin ${pluginId}:`, error);
    });
  });

  server.log.info('WebSocket routes registered');
}

