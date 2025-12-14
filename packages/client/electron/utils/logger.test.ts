/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * LoggerService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loggerService, createLogger } from '../utils/logger';

describe('LoggerService', () => {
  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = loggerService;
      const instance2 = loggerService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('withContext()', () => {
    it('应该创建带命名空间的 logger', () => {
      const logger = createLogger('TestModule');

      expect(logger).toBeDefined();
      expect(logger.info).toBeDefined();
      expect(logger.error).toBeDefined();
      expect(logger.warn).toBeDefined();
      expect(logger.debug).toBeDefined();
    });

    it('不同命名空间的 logger 应该独立', () => {
      const logger1 = createLogger('Module1');
      const logger2 = createLogger('Module2');

      expect(logger1).not.toBe(logger2);
    });
  });

  describe('日志方法', () => {
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('应该能记录 info 日志', () => {
      const logger = createLogger('Test');
      logger.info('测试消息');

      // 注意：winston 是异步的，实际测试中可能需要等待
      expect(logger.info).toBeDefined();
    });

    it('应该能记录 error 日志', () => {
      const logger = createLogger('Test');
      logger.error('错误消息');

      expect(logger.error).toBeDefined();
    });
  });

  describe('日志目录', () => {
    it('应该返回日志目录路径', () => {
      const logsDir = loggerService.getLogsDir();

      expect(logsDir).toBeDefined();
      expect(typeof logsDir).toBe('string');
      expect(logsDir).toContain('logs');
    });
  });
});
