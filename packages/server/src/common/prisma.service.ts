import { PrismaClient } from '@prisma/client';
import { databaseConfig } from '../config/database.config';
import { logger } from './logger.service';

/**
 * Prisma Client singleton service
 */
class PrismaService {
  private static instance: PrismaClient | null = null;
  private static isConnecting = false;

  /**
   * Get Prisma Client instance
   */
  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: databaseConfig.log,
        errorFormat: databaseConfig.errorFormat,
      });

      // Log queries in development
      if (databaseConfig.log.includes('query' as any)) {
        PrismaService.instance.$on('query' as never, (e: any) => {
          logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma query');
        });
      }
    }

    return PrismaService.instance;
  }

  /**
   * Connect to database
   */
  static async connect(): Promise<void> {
    if (PrismaService.isConnecting) {
      logger.warn('Database connection already in progress');
      return;
    }

    try {
      PrismaService.isConnecting = true;
      const prisma = PrismaService.getInstance();
      await prisma.$connect();
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to database');
      throw error;
    } finally {
      PrismaService.isConnecting = false;
    }
  }

  /**
   * Disconnect from database
   */
  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      try {
        await PrismaService.instance.$disconnect();
        PrismaService.instance = null;
        logger.info('Database disconnected successfully');
      } catch (error) {
        logger.error({ error }, 'Failed to disconnect from database');
        throw error;
      }
    }
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const prisma = PrismaService.getInstance();
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error({ error }, 'Database health check failed');
      return false;
    }
  }
}

/**
 * Export Prisma Client instance
 */
export const prisma = PrismaService.getInstance();

/**
 * Export service methods
 */
export const connectDatabase = PrismaService.connect;
export const disconnectDatabase = PrismaService.disconnect;
export const databaseHealthCheck = PrismaService.healthCheck;