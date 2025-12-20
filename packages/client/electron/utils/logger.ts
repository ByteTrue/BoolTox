/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 中心化日志服务
 * 基于 winston + winston-daily-rotate-file
 * 参考 Cherry Studio LoggerService 设计
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { app, ipcMain } from 'electron';
import path from 'path';
import os from 'os';

// 日志级别
export const LOG_LEVEL = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];

const LEVEL_MAP = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// ANSI 颜色
const ANSI = {
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  GREEN: '\x1b[32m',
  BLUE: '\x1b[34m',
  CYAN: '\x1b[36m',
  BOLD: '\x1b[1m',
  END: '\x1b[0m',
};

function colorText(text: string, color: keyof typeof ANSI): string {
  return ANSI[color] + text + ANSI.END;
}

// 日志来源
interface LogSource {
  process: 'main' | 'renderer';
  module?: string;
  window?: string;
}

/**
 * LoggerService 单例
 */
class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private logsDir: string;

  // 环境变量（开发环境）
  private envLevel: LogLevel | 'none' = 'none';
  private envShowModules: string[] = [];

  // 当前模块名
  private module: string = '';
  private context: Record<string, unknown> = {};

  private constructor() {
    // 日志目录
    this.logsDir = app.isPackaged
      ? path.join(app.getPath('userData'), 'logs')
      : path.join(process.cwd(), 'logs');

    // 环境变量（开发环境）
    if (!app.isPackaged) {
      // 日志级别：BOOLTOX_LOG_LEVEL=debug
      if (process.env.BOOLTOX_LOG_LEVEL && Object.values(LOG_LEVEL).includes(process.env.BOOLTOX_LOG_LEVEL as LogLevel)) {
        this.envLevel = process.env.BOOLTOX_LOG_LEVEL as LogLevel;
        console.warn(colorText(`[LoggerService] 环境变量 BOOLTOX_LOG_LEVEL: ${this.envLevel}`, 'BLUE'));
      }

      // 模块过滤：BOOLTOX_LOG_MODULES=ToolManager,PythonManager
      if (process.env.BOOLTOX_LOG_MODULES) {
        this.envShowModules = process.env.BOOLTOX_LOG_MODULES.split(',')
          .map((m) => m.trim())
          .filter((m) => m !== '');
        console.warn(colorText(`[LoggerService] 环境变量 BOOLTOX_LOG_MODULES: ${this.envShowModules.join(', ')}`, 'BLUE'));
      }
    }

    // Winston 配置
    const transports: winston.transport[] = [];

    // 通用日志文件（滚动，保留 30 天）
    transports.push(
      new DailyRotateFile({
        filename: path.join(this.logsDir, 'app.%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '30d',
        level: 'debug',
      })
    );

    // 错误日志文件（滚动，保留 60 天）
    transports.push(
      new DailyRotateFile({
        level: 'warn',
        filename: path.join(this.logsDir, 'app-error.%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '10m',
        maxFiles: '60d',
      })
    );

    // 创建 logger
    this.logger = winston.createLogger({
      level: app.isPackaged ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      exitOnError: false,
      transports,
    });

    // 注册 IPC handler（渲染进程日志转发）
    this.registerIpcHandler();

    // 启动日志
    this.info('='.repeat(80));
    this.info(`BoolTox 启动 - 版本 ${app.getVersion()}`);
    this.info(`环境: ${app.isPackaged ? '生产' : '开发'}`);
    this.info(`日志路径: ${this.logsDir}`);
    this.info(`平台: ${process.platform} ${process.arch}`);
    this.info(`系统: ${os.platform()}-${os.arch()} / ${os.version()}`);
    this.info(`CPU: ${os.cpus()[0]?.model || 'Unknown'}`);
    this.info(`内存: ${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`);
    this.info(`Electron: ${process.versions.electron}`);
    this.info(`Node: ${process.versions.node}`);
    this.info('='.repeat(80));
  }

  /**
   * 获取单例
   */
  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * 创建带命名空间的 logger
   */
  public withContext(module: string, context?: Record<string, unknown>): LoggerService {
    const newLogger = Object.create(this);
    newLogger.logger = this.logger;
    newLogger.module = module;
    newLogger.context = { ...this.context, ...context };
    return newLogger;
  }

  /**
   * 处理日志
   */
  private processLog(source: LogSource, level: LogLevel, message: string, meta: unknown[]): void {
    // 开发环境：彩色控制台输出 + 模块过滤
    if (!app.isPackaged) {
      // 环境变量过滤
      if (this.envLevel !== 'none' && LEVEL_MAP[level] < LEVEL_MAP[this.envLevel]) {
        return;
      }
      if (this.module && this.envShowModules.length > 0 && !this.envShowModules.includes(this.module)) {
        return;
      }

      // 彩色输出
      const time = colorText(
        new Date().toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'CYAN'
      );

      const moduleStr = this.module ? ` ${colorText(`[${this.module}]`, 'BOLD')} ` : ' ';

      const levelColors = {
        error: 'RED',
        warn: 'YELLOW',
        info: 'GREEN',
        debug: 'BLUE',
      } as const;

      const levelStr = colorText(`<${level.toUpperCase()}>`, levelColors[level]);

      if (level === 'error') {
        console.error(`${time} ${levelStr}${moduleStr}${message}`, ...meta);
      } else {
        console.warn(`${time} ${levelStr}${moduleStr}${message}`, ...meta);
      }
    }

    // 写入文件
    this.logger.log(level, message, {
      module: this.module,
      source: source.process,
      window: source.window,
      context: this.context,
      meta,
    });
  }

  /**
   * 处理渲染进程日志
   */
  private processRendererLog(source: LogSource, level: LogLevel, message: string, meta: unknown[]): void {
    this.processLog(source, level, `[Renderer] ${message}`, meta);
  }

  /**
   * 注册 IPC handler（渲染进程日志转发）
   */
  private registerIpcHandler(): void {
    ipcMain.handle('app:log-to-main', (_event, source: LogSource, level: LogLevel, message: string, meta: unknown[]) => {
      this.processRendererLog(source, level, message, meta);
    });
  }

  /**
   * 公共日志方法
   */
  public error(message: string, ...meta: unknown[]): void {
    this.processLog({ process: 'main', module: this.module }, 'error', message, meta);
  }

  public warn(message: string, ...meta: unknown[]): void {
    this.processLog({ process: 'main', module: this.module }, 'warn', message, meta);
  }

  public info(message: string, ...meta: unknown[]): void {
    this.processLog({ process: 'main', module: this.module }, 'info', message, meta);
  }

  public debug(message: string, ...meta: unknown[]): void {
    this.processLog({ process: 'main', module: this.module }, 'debug', message, meta);
  }

  /**
   * 关闭日志系统
   */
  public finish(): void {
    this.logger.end();
  }

  /**
   * 获取日志目录
   */
  public getLogsDir(): string {
    return this.logsDir;
  }
}

// 导出单例
export const loggerService = LoggerService.getInstance();

// 兼容旧 API
export function setupLogger() {
  // LoggerService 已在单例初始化时自动设置
  return loggerService;
}

export function createLogger(namespace: string) {
  return loggerService.withContext(namespace);
}

export function getLogPath(): string {
  return path.join(loggerService.getLogsDir(), 'app.log');
}

export async function openLogFolder() {
  const { shell } = await import('electron');
  await shell.openPath(loggerService.getLogsDir());
}

// 导出类型
export type { LogLevel, LogSource };
