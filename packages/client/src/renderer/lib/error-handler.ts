/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 统一的错误处理工具
 * 提供标准化的错误格式化、日志记录和用户提示 (遵循 DRY 原则)
 */

import { createLogger } from './logger';

const logger = createLogger('ErrorHandler');

/**
 * 格式化后的错误信息
 */
export interface FormattedError {
  message: string;
  stack?: string;
  code?: string;
  type: string;
  timestamp: number;
  context?: Record<string, unknown>;
}

/**
 * 错误严重程度
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * 格式化错误对象
 * 将任意类型的错误转换为标准格式
 */
export function formatError(error: unknown, context?: Record<string, unknown>): FormattedError {
  const timestamp = Date.now();

  // 处理 Error 实例
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: unknown };
    const code = typeof errorWithCode.code === 'string' ? errorWithCode.code : undefined;

    return {
      message: error.message,
      stack: error.stack,
      code,
      type: error.constructor.name,
      timestamp,
      context
    };
  }

  // 处理字符串错误
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'StringError',
      timestamp,
      context
    };
  }

  // 处理对象类型错误
  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;
    return {
      message: String(err.message || err.msg || 'Unknown error'),
      stack: String(err.stack || ''),
      code: String(err.code || err.errorCode || ''),
      type: String(err.type || err.name || 'ObjectError'),
      timestamp,
      context: {
        ...context,
        originalError: err
      }
    };
  }

  // 其他类型
  return {
    message: String(error),
    type: 'UnknownError',
    timestamp,
    context
  };
}

/**
 * 记录错误日志
 */
export function logError(
  error: unknown,
  severity: ErrorSeverity = 'error',
  context?: Record<string, unknown>
): FormattedError {
  const formattedError = formatError(error, context);

  // 根据严重程度选择日志级别
  switch (severity) {
    case 'critical':
      logger.error('[CRITICAL]', formattedError.message, formattedError);
      break;
    case 'error':
      logger.error(formattedError.message, formattedError);
      break;
    case 'warning':
      logger.warn(formattedError.message, formattedError);
      break;
    case 'info':
      logger.info(formattedError.message, formattedError);
      break;
  }

  return formattedError;
}

/**
 * 安全地执行函数并处理错误
 */
export async function safeExecute<T>(
  fn: () => T | Promise<T>,
  options?: {
    context?: Record<string, unknown>;
    fallback?: T;
    onError?: (error: FormattedError) => void;
    rethrow?: boolean;
  }
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error: unknown) {
    const formattedError = logError(error, 'error', options?.context);

    options?.onError?.(formattedError);

    if (options?.rethrow) {
      throw error instanceof Error ? error : new Error(String(error));
    }

    return options?.fallback;
  }
}

/**
 * 创建错误包装器
 */
export function wrapError(
  message: string,
  originalError: unknown,
  code?: string
): Error {
  const formatted = formatError(originalError);
  const error = new Error(`${message}: ${formatted.message}`) as Error & {
    code?: string;
    originalError?: unknown;
    formattedError?: FormattedError;
  };

  error.code = code || formatted.code;
  error.originalError = originalError;
  error.formattedError = formatted;
  return error;
}

/**
 * 判断错误是否可恢复
 */
export function isRecoverableError(error: unknown): boolean {
  const formatted = formatError(error);

  // 网络错误通常可以重试
  const networkErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
  if (formatted.code && networkErrors.includes(formatted.code)) {
    return true;
  }

  // 临时错误可以重试
  const recoverableMessages = [
    'timeout',
    'temporary',
    'rate limit',
    'too many requests',
    'service unavailable'
  ];

  const messageLower = formatted.message.toLowerCase();
  return recoverableMessages.some(msg => messageLower.includes(msg));
}

/**
 * 获取用户友好的错误消息
 */
export function getUserFriendlyMessage(error: unknown): string {
  const formatted = formatError(error);

  // 常见错误的用户友好消息
  const errorMessages: Record<string, string> = {
    'ECONNRESET': '网络连接已中断,请重试',
    'ETIMEDOUT': '请求超时,请检查网络连接',
    'ENOTFOUND': '无法连接到服务器,请检查网络',
    'ECONNREFUSED': '服务器拒绝连接,请稍后重试',
    'EACCES': '权限不足,请检查文件权限',
    'ENOENT': '文件或目录不存在',
    'EEXIST': '文件或目录已存在',
    'MODULE_NOT_FOUND': '模块未找到',
    'MODULE_ALREADY_INSTALLED': '模块已安装',
    'MODULE_MANIFEST_INVALID': '模块清单文件无效',
    'DOWNLOAD_FAILED': '下载失败,请重试',
    'NETWORK_ERROR': '网络错误,请检查连接',
    'PERMISSION_DENIED': '权限被拒绝'
  };

  // 根据错误代码返回友好消息
  if (formatted.code && errorMessages[formatted.code]) {
    return errorMessages[formatted.code];
  }

  // 根据错误类型返回友好消息
  if (formatted.type === 'TypeError') {
    return '数据类型错误,请检查输入';
  }

  if (formatted.type === 'SyntaxError') {
    return '语法错误,请检查配置文件';
  }

  // 返回原始消息 (截断过长的消息)
  const maxLength = 100;
  if (formatted.message.length > maxLength) {
    return formatted.message.substring(0, maxLength) + '...';
  }

  return formatted.message;
}

/**
 * 错误重试助手
 */
export async function retryOnError<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
    shouldRetry?: (error: unknown) => boolean;
    onRetry?: (attempt: number, error: FormattedError) => void;
  }
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? 3;
  const initialDelay = options?.delay ?? 1000;
  const backoff = options?.backoff ?? 2;
  const shouldRetry = options?.shouldRetry ?? isRecoverableError;

  let lastError: unknown;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const formatted = formatError(error);

      // 检查是否应该重试
      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // 记录重试
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms...`, formatted);
      options?.onRetry?.(attempt, formatted);

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoff;
    }
  }

  throw lastError;
}
