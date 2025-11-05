import pino from 'pino';
import { env } from '../config/env.config';

/**
 * Create logger instance
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: env.LOG_PRETTY
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: env.NODE_ENV,
  },
});

/**
 * Create child logger with namespace
 */
export function createLogger(namespace: string) {
  return logger.child({ namespace });
}

/**
 * Log levels
 */
export const LogLevel = {
  FATAL: 60,
  ERROR: 50,
  WARN: 40,
  INFO: 30,
  DEBUG: 20,
  TRACE: 10,
} as const;