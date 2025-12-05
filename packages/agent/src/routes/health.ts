import type { FastifyInstance } from 'fastify';

export async function healthRoutes(server: FastifyInstance) {
  // 健康检查
  server.get('/health', async () => {
    return {
      status: 'ok',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  });

  // Agent 信息
  server.get('/info', async () => {
    return {
      name: 'BoolTox Agent',
      version: '0.1.0',
      protocol: '2.0.0',
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
    };
  });
}
