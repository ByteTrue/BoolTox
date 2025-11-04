/**
 * 错误恢复和重试机制工具
 * 
 * 提供统一的错误处理、重试策略和降级方案
 */

import { createLogger } from './logger';

const logger = createLogger('ErrorRecovery');

/**
 * 重试配置选项
 */
export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 初始延迟时间（毫秒） */
  initialDelay?: number;
  /** 延迟倍增因子 */
  backoffMultiplier?: number;
  /** 最大延迟时间（毫秒） */
  maxDelay?: number;
  /** 是否在重试前记录日志 */
  logRetries?: boolean;
  /** 自定义重试条件判断 */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

/**
 * 错误恢复结果
 */
export interface RecoveryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * 默认重试配置
 */
const DEFAULT_RETRY_OPTIONS: Required<Omit<RetryOptions, 'shouldRetry'>> = {
  maxRetries: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  logRetries: true,
};

/**
 * 延迟函数
 */
const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * 计算指数退避延迟
 */
const calculateDelay = (
  attempt: number,
  initialDelay: number,
  backoffMultiplier: number,
  maxDelay: number
): number => {
  const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
  return Math.min(delay, maxDelay);
};

/**
 * 默认重试条件：网络错误和超时错误重试
 */
const defaultShouldRetry = (error: Error, attempt: number): boolean => {
  // 超过最大重试次数不再重试
  if (attempt >= DEFAULT_RETRY_OPTIONS.maxRetries) {
    return false;
  }

  // 网络错误重试
  if (error.message.includes('network') || 
      error.message.includes('fetch') ||
      error.message.includes('timeout') ||
      error.message.includes('ECONNREFUSED')) {
    return true;
  }

  // 临时性错误重试
  if (error.message.includes('temporary') || 
      error.message.includes('busy') ||
      error.message.includes('locked')) {
    return true;
  }

  return false;
};

/**
 * 带重试机制的异步函数执行
 * 
 * @param fn - 要执行的异步函数
 * @param options - 重试配置选项
 * @returns 执行结果
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   async () => fetch('/api/data'),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * 
 * if (result.success) {
 *   console.log('Data:', result.data);
 * } else {
 *   console.error('Failed after retries:', result.error);
 * }
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RecoveryResult<T>> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  const shouldRetry = options.shouldRetry || defaultShouldRetry;

  let lastError: Error | undefined;
  let attempt = 0;

  while (attempt <= config.maxRetries) {
    try {
      const result = await fn();
      
      if (attempt > 0 && config.logRetries) {
        logger.info(`Operation succeeded after ${attempt} retries`);
      }

      return {
        success: true,
        data: result,
        attempts: attempt + 1,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 检查是否应该重试
      if (!shouldRetry(lastError, attempt)) {
        if (config.logRetries) {
          logger.warn(`Operation failed, not retrying:`, lastError.message);
        }
        break;
      }

      // 还有重试机会
      if (attempt < config.maxRetries) {
        const delayTime = calculateDelay(
          attempt,
          config.initialDelay,
          config.backoffMultiplier,
          config.maxDelay
        );

        if (config.logRetries) {
          logger.warn(
            `Attempt ${attempt + 1}/${config.maxRetries + 1} failed: ${lastError.message}. ` +
            `Retrying in ${delayTime}ms...`
          );
        }

        await delay(delayTime);
      }

      attempt++;
    }
  }

  return {
    success: false,
    error: lastError,
    attempts: attempt + 1,
  };
}

/**
 * 带降级方案的函数执行
 * 
 * @param fn - 主要函数
 * @param fallbackFn - 降级函数
 * @param options - 重试配置
 * @returns 执行结果
 * 
 * @example
 * ```ts
 * const data = await withFallback(
 *   async () => fetchFromAPI(),
 *   async () => fetchFromCache(),
 *   { maxRetries: 2 }
 * );
 * ```
 */
export async function withFallback<T>(
  fn: () => Promise<T>,
  fallbackFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(fn, options);

  if (result.success && result.data !== undefined) {
    return result.data;
  }

  logger.warn('Primary operation failed, using fallback:', result.error?.message);
  
  try {
    return await fallbackFn();
  } catch (fallbackError) {
    logger.error('Fallback operation also failed:', fallbackError);
    throw fallbackError;
  }
}

/**
 * 错误边界包装器
 * 捕获错误并转换为安全的默认值
 * 
 * @param fn - 函数
 * @param defaultValue - 默认值
 * @returns 结果或默认值
 * 
 * @example
 * ```ts
 * const modules = await withDefault(
 *   async () => loadModules(),
 *   []
 * );
 * ```
 */
export async function withDefault<T>(
  fn: () => Promise<T>,
  defaultValue: T
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    logger.warn('Operation failed, returning default value:', error);
    return defaultValue;
  }
}

/**
 * 超时包装器
 * 
 * @param fn - 函数
 * @param timeoutMs - 超时时间（毫秒）
 * @returns 执行结果
 * 
 * @example
 * ```ts
 * const data = await withTimeout(
 *   async () => fetch('/api/data'),
 *   5000 // 5秒超时
 * );
 * ```
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

/**
 * 电路断路器状态
 */
type CircuitState = 'closed' | 'open' | 'half-open';

/**
 * 电路断路器配置
 */
export interface CircuitBreakerOptions {
  /** 失败阈值 */
  failureThreshold?: number;
  /** 重置超时（毫秒） */
  resetTimeout?: number;
  /** 半开状态允许的请求数 */
  halfOpenRequests?: number;
}

/**
 * 电路断路器
 * 防止级联失败，在服务不可用时快速失败
 * 
 * @example
 * ```ts
 * const breaker = new CircuitBreaker({
 *   failureThreshold: 5,
 *   resetTimeout: 60000
 * });
 * 
 * const result = await breaker.execute(async () => {
 *   return await fetch('/api/data');
 * });
 * ```
 */
export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime?: number;
  private options: Required<CircuitBreakerOptions>;

  constructor(options: CircuitBreakerOptions = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,
      halfOpenRequests: options.halfOpenRequests || 3,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // 检查是否应该从 open 转换到 half-open
    if (this.state === 'open') {
      const now = Date.now();
      if (this.lastFailureTime && now - this.lastFailureTime >= this.options.resetTimeout) {
        this.state = 'half-open';
        this.successCount = 0;
        logger.info('Circuit breaker: open -> half-open');
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await fn();

      // 成功处理
      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= this.options.halfOpenRequests) {
          this.state = 'closed';
          this.failureCount = 0;
          logger.info('Circuit breaker: half-open -> closed');
        }
      } else if (this.state === 'closed') {
        this.failureCount = 0; // 重置失败计数
      }

      return result;
    } catch (error) {
      // 失败处理
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.state === 'half-open') {
        this.state = 'open';
        logger.warn('Circuit breaker: half-open -> open');
      } else if (this.failureCount >= this.options.failureThreshold) {
        this.state = 'open';
        logger.warn(`Circuit breaker: closed -> open (${this.failureCount} failures)`);
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = undefined;
  }
}
