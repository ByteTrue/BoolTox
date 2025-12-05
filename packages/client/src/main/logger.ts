/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 简单的日志工具
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export function createLogger(namespace: string): Logger {
  const log = (level: LogLevel, ...args: unknown[]) => {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = `[${timestamp}] [${namespace}]`;
    
    switch (level) {
      case 'debug':
        console.warn(prefix, ...args);
        break;
      case 'info':
        console.warn(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'error':
        console.error(prefix, ...args);
        break;
    }
  };

  return {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),
  };
}
