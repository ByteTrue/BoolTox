import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { serverConfig } from './config/server.config';
import { logger } from './common/logger.service';
import { connectDatabase, disconnectDatabase, databaseHealthCheck } from './common/prisma.service';
import { errorMiddleware, notFoundHandler } from './common/middleware/error.middleware';
import { sendSuccess } from './common/response.util';
import { registerPublicReleasesRoutes, registerAdminReleasesRoutes } from './modules/releases/releases.controller';
import { registerGitHubWebhookRoutes } from './modules/github/webhook.controller';
import { registerModulesRoutes } from './modules/modules/modules.controller';
import { registerAnnouncementRoutes } from './modules/announcements/announcements.controller';
import { registerLogsRoutes } from './modules/logs/logs.controller';
import { syncCronService } from './modules/github/sync.cron';

/**
 * Create and configure Fastify application
 */
async function createApp() {
  const app = Fastify({
    logger: false, // Use custom pino logger
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    trustProxy: true,
    bodyLimit: serverConfig.bodyLimit.json,
    connectionTimeout: serverConfig.timeout.server,
    keepAliveTimeout: serverConfig.timeout.idle,
  });

  // Register CORS
  await app.register(cors, serverConfig.cors);

  // Register Helmet for security headers
  await app.register(helmet, {
    contentSecurityPolicy: false, // Disable for API
  });

  // Register rate limiting
  await app.register(rateLimit, {
    max: serverConfig.rateLimit.max,
    timeWindow: serverConfig.rateLimit.timeWindow,
    errorResponseBuilder: () => ({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests, please try again later',
      },
    }),
  });

  // Register error handler
  app.setErrorHandler(errorMiddleware);

  // Register not found handler
  app.setNotFoundHandler(notFoundHandler);

  // Health check endpoint
  app.get('/health', async (_request, reply) => {
    const dbHealthy = await databaseHealthCheck();

    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbHealthy ? 'connected' : 'disconnected',
      environment: serverConfig.isDevelopment ? 'development' : 'production',
    };

    if (!dbHealthy) {
      return reply.code(503).send({
        success: false,
        data: health,
      });
    }

    return sendSuccess(reply, health);
  });

  // Root endpoint
  app.get('/', async (_request, reply) => {
    return sendSuccess(reply, {
      name: 'BoolTox API Server',
      version: '1.0.0',
      status: 'running',
      documentation: '/api/docs',
    });
  });

  // Register public routes
  await app.register(registerPublicReleasesRoutes, { prefix: '/api/public/releases' });
  
  // Register admin routes
  await app.register(registerAdminReleasesRoutes, { prefix: '/api/admin/releases' });
  
  // Register webhook routes
  await app.register(registerGitHubWebhookRoutes, { prefix: '/api/webhooks' });

  // Register modules routes
  await app.register(registerModulesRoutes);

  // Register announcements routes
  await app.register(registerAnnouncementRoutes);

  // Register logs routes
  await app.register(registerLogsRoutes);

  return app;
}

/**
 * Start the server
 */
async function start() {
  try {
    // Connect to database
    logger.info('Connecting to database...');
    await connectDatabase();

    // Create and start app
    const app = await createApp();

    await app.listen({
      port: serverConfig.port,
      host: serverConfig.host,
    });

    logger.info(
      {
        port: serverConfig.port,
        host: serverConfig.host,
        env: serverConfig.isDevelopment ? 'development' : 'production',
      },
      'Server started successfully'
    );

    // Start GitHub sync cron job
    syncCronService.start();

    // Graceful shutdown handlers
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach((signal) => {
      process.on(signal, async () => {
        logger.info(`Received ${signal}, shutting down gracefully...`);

        try {
          // Stop cron jobs
          syncCronService.stop();
          logger.info('Cron jobs stopped');

          // Close server
          await app.close();
          logger.info('Server closed');

          // Disconnect database
          await disconnectDatabase();
          logger.info('Database disconnected');

          process.exit(0);
        } catch (error) {
          logger.error({ error }, 'Error during shutdown');
          process.exit(1);
        }
      });
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.fatal({ error }, 'Uncaught exception');
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal({ reason, promise }, 'Unhandled rejection');
      process.exit(1);
    });
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();