import { env } from './env.config';

/**
 * Database configuration
 */
export const databaseConfig = {
  url: env.DATABASE_URL,
  
  // Connection pool settings
  connectionLimit: 10,
  
  // Logging
  log: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] as const : ['error'] as const,
  
  // Error formatting
  errorFormat: env.NODE_ENV === 'development' ? 'pretty' as const : 'minimal' as const,
} as const;

/**
 * Database health check query
 */
export const healthCheckQuery = 'SELECT 1';