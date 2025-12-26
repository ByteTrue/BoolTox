/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 渲染进程日志封装
 * 自动转发日志到主进程 LoggerService
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogSource {
  process: 'renderer';
  module?: string;
  window?: string;
}

/**
 * 渲染进程 Logger
 */
class RendererLogger {
  private module: string;
  private window: string;

  constructor(module: string = '', window: string = 'main') {
    this.module = module;
    this.window = window;
  }

  /**
   * 转发日志到主进程
   */
  private async logToMain(level: LogLevel, message: string, ...meta: unknown[]): Promise<void> {
    const source: LogSource = {
      process: 'renderer',
      module: this.module,
      window: this.window,
    };

    try {
      // 同时输出到控制台（开发环境）
      if (import.meta.env.DEV) {
        const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        const moduleStr = this.module ? ` [${this.module}]` : '';
        switch (level) {
          case 'error':
            console.error(`${timestamp} <${level.toUpperCase()}>${moduleStr} ${message}`, ...meta);
            break;
          case 'warn':
            console.warn(`${timestamp} <${level.toUpperCase()}>${moduleStr} ${message}`, ...meta);
            break;
          case 'info':
            console.warn(`${timestamp} <${level.toUpperCase()}>${moduleStr} ${message}`, ...meta);
            break;
          case 'debug':
            console.warn(`${timestamp} <${level.toUpperCase()}>${moduleStr} ${message}`, ...meta);
            break;
        }
      }

      // 转发到主进程
      await window.ipc?.invoke('app:log-to-main', source, level, message, meta);
    } catch (error) {
      // IPC 失败时降级到控制台
      console.error('[Logger] 转发日志到主进程失败:', error);
      switch (level) {
        case 'error':
          console.error(message, ...meta);
          break;
        case 'warn':
          console.warn(message, ...meta);
          break;
        case 'info':
          console.warn(message, ...meta);
          break;
        case 'debug':
          console.warn(message, ...meta);
          break;
      }
    }
  }

  /**
   * 公共日志方法
   */
  public error(message: string, ...meta: unknown[]): void {
    void this.logToMain('error', message, ...meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    void this.logToMain('warn', message, ...meta);
  }

  public info(message: string, ...meta: unknown[]): void {
    void this.logToMain('info', message, ...meta);
  }

  public debug(message: string, ...meta: unknown[]): void {
    void this.logToMain('debug', message, ...meta);
  }

  /**
   * 创建带命名空间的子 logger
   */
  public withContext(module: string): RendererLogger {
    return new RendererLogger(module, this.window);
  }
}

// 导出默认实例
export const logger = new RendererLogger();

// 导出创建方法
export function createLogger(namespace: string): RendererLogger {
  return new RendererLogger(namespace);
}

// 导出类型
export type { LogLevel, LogSource };
