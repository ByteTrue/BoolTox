/**
 * 生产环境日志系统
 * 使用 electron-log 实现日志持久化
 */

import log from 'electron-log';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// 配置日志
export function setupLogger() {
  // 设置日志文件路径
  // 开发环境: logs/
  // 生产环境: %APPDATA%/Roaming/BoolTox/logs/ (Windows)
  const logPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'logs')
    : path.join(process.cwd(), 'logs');

  // 确保日志目录存在
  fs.mkdir(logPath, { recursive: true }).catch(err => {
    console.error('创建日志目录失败:', err);
  });

  log.transports.file.resolvePathFn = () => path.join(logPath, 'main.log');
  
  // 配置日志级别
  // 开发环境: debug
  // 生产环境: info
  log.transports.file.level = app.isPackaged ? 'info' : 'debug';
  log.transports.console.level = app.isPackaged ? 'info' : 'debug';
  
  // 设置日志格式
  log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';
  
  // 日志文件大小限制 (10MB)
  log.transports.file.maxSize = 10 * 1024 * 1024;
  
  // 开启日志文件归档
  log.transports.file.archiveLog = (_oldLogFile) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const archivePath = path.join(
      logPath,
      'archive',
      `main-${timestamp}.log`
    );
    return archivePath;
  };

  // 捕获未处理的错误
  log.catchErrors({
    showDialog: false,
    onError: (error) => {
      log.error('未捕获的错误:', error);
    },
  });

  // 重定向 console 到 log
  /* eslint-disable no-console */
  console.log = log.log.bind(log);
  console.info = log.info.bind(log);
  console.warn = log.warn.bind(log);
  console.error = log.error.bind(log);
  console.debug = log.debug.bind(log);
  /* eslint-enable no-console */

  log.info('='.repeat(80));
  log.info(`BoolTox 启动 - 版本 ${app.getVersion()}`);
  log.info(`环境: ${app.isPackaged ? '生产' : '开发'}`);
  log.info(`日志路径: ${logPath}`);
  log.info(`平台: ${process.platform} ${process.arch}`);
  log.info(`Electron: ${process.versions.electron}`);
  log.info(`Node: ${process.versions.node}`);
  log.info('='.repeat(80));
}

// 创建带命名空间的日志记录器
export function createLogger(namespace: string) {
  return {
    debug: (...args: unknown[]) => log.debug(`[${namespace}]`, ...args),
    info: (...args: unknown[]) => log.info(`[${namespace}]`, ...args),
    warn: (...args: unknown[]) => log.warn(`[${namespace}]`, ...args),
    error: (...args: unknown[]) => log.error(`[${namespace}]`, ...args),
  };
}

// 导出日志实例
export { log };

// 工具函数: 获取日志文件路径
export function getLogPath(): string {
  return app.isPackaged
    ? path.join(app.getPath('userData'), 'logs', 'main.log')
    : path.join(process.cwd(), 'logs', 'main.log');
}

// 工具函数: 打开日志目录
export async function openLogFolder() {
  const { shell } = await import('electron');
  const logDir = app.isPackaged
    ? path.join(app.getPath('userData'), 'logs')
    : path.join(process.cwd(), 'logs');
  
  await shell.openPath(logDir);
}
