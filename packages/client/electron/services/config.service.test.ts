/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * ConfigService 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { configService } from './config.service';

describe('ConfigService', () => {
  describe('单例模式', () => {
    it('应该返回同一个实例', () => {
      const instance1 = configService;
      const instance2 = configService;

      expect(instance1).toBe(instance2);
    });
  });

  describe('配置读写', () => {
    beforeEach(() => {
      // 清空配置
      configService.clear();
    });

    it('应该能设置和获取配置', () => {
      configService.set('settings', 'closeToTray', true);

      const value = configService.get('settings', 'closeToTray');

      expect(value).toBe(true);
    });

    it('应该能获取嵌套配置', () => {
      configService.set('window', {
        bounds: { x: 100, y: 100, width: 800, height: 600 },
        isMaximized: false,
      });

      const bounds = configService.get('window', 'bounds');

      expect(bounds).toEqual({ x: 100, y: 100, width: 800, height: 600 });
    });

    it('应该支持删除配置', () => {
      configService.set('settings', 'autoLaunch', true);
      configService.delete('settings');

      const value = configService.get('settings');

      expect(value).toEqual({
        closeToTray: true,
        autoLaunch: false,
        language: 'zh-CN',
      }); // 恢复默认值
    });
  });

  describe('配置文件路径', () => {
    it('应该返回配置文件路径', () => {
      const configPath = configService.getConfigPath();

      expect(configPath).toBeDefined();
      expect(typeof configPath).toBe('string');
      expect(configPath).toContain('config.json');
    });
  });
});
