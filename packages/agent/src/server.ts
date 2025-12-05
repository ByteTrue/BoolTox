import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const server = Fastify({
  logger: {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    },
  },
});

// 注册插件
await server.register(cors, {
  origin: [
    'http://localhost:3000', // Next.js dev
    'http://localhost:9527', // Agent 本身
  ],
  credentials: true,
});

await server.register(websocket);

// TODO: 注册静态文件服务（插件市场前端）
// await server.register(staticPlugin, {
//   root: path.join(__dirname, '../public'),
//   prefix: '/marketplace/',
// });

// 健康检查端点
server.get('/api/health', async () => {
  return {
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  };
});

// TODO: 注册路由
// import { pluginsRoutes } from './routes/plugins.js';
// await server.register(pluginsRoutes, { prefix: '/api' });

// 启动服务器
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 9527;
const HOST = process.env.HOST || '0.0.0.0';

try {
  await server.listen({ port: PORT, host: HOST });
  server.log.info(`🚀 BoolTox Agent 运行在 http://localhost:${PORT}`);
  server.log.info(`📦 插件市场: http://localhost:${PORT}/marketplace`);
} catch (err) {
  server.log.error(err);
  process.exit(1);
}

// 优雅关闭
process.on('SIGTERM', async () => {
  server.log.info('收到 SIGTERM 信号，正在关闭服务器...');
  await server.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  server.log.info('收到 SIGINT 信号，正在关闭服务器...');
  await server.close();
  process.exit(0);
});
