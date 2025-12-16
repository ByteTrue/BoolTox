/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 配置管理服务
 * 封装 electron-store，提供类型安全的配置访问
 * 参考 Cherry Studio ConfigManager 设计
 */

import Store from 'electron-store';
import type { ToolSourcesConfig } from '@booltox/shared';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ConfigService');

// 配置 Schema
interface AppConfig {
  settings: {
    closeToTray: boolean;
    autoLaunch: boolean;
    language: string;
  };
  window: {
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    isMaximized?: boolean;
  };
  toolSources: ToolSourcesConfig; // 新增：工具源配置
}

class ConfigService {
  private static instance: ConfigService;
  private store: Store<AppConfig>;

  private constructor() {
    this.store = new Store<AppConfig>({
      name: 'config',
      defaults: {
        settings: {
          closeToTray: true,
          autoLaunch: false,
          language: 'zh-CN',
        },
        window: {},
        toolSources: {
          version: '1.0.0',
          sources: [
            {
              id: 'official',
              name: '官方工具库',
              enabled: true,
              type: 'remote',
              provider: 'github',
              owner: 'ByteTrue',
              repo: 'booltox-plugins',
              branch: 'main',
              priority: 0,
            },
          ],
          localToolRefs: [],  // 本地工具引用列表
        },
      },
    });

    logger.info('ConfigService 初始化完成');
  }

  /**
   * 获取单例
   */
  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  /**
   * 获取配置
   */
  public get<K extends keyof AppConfig>(key: K): AppConfig[K];
  public get<K extends keyof AppConfig, T extends keyof AppConfig[K]>(
    key: K,
    subKey: T
  ): AppConfig[K][T];
  public get<K extends keyof AppConfig, T extends keyof AppConfig[K]>(
    key: K,
    subKey?: T
  ): any {
    if (subKey) {
      return this.store.get(`${String(key)}.${String(subKey)}` as any);
    }
    return this.store.get(key);
  }

  /**
   * 设置配置
   */
  public set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void;
  public set<K extends keyof AppConfig, T extends keyof AppConfig[K]>(
    key: K,
    subKey: T,
    value: AppConfig[K][T]
  ): void;
  public set<K extends keyof AppConfig, T extends keyof AppConfig[K]>(
    key: K,
    subKeyOrValue: T | AppConfig[K],
    value?: AppConfig[K][T]
  ): void {
    if (value !== undefined) {
      this.store.set(`${String(key)}.${String(subKeyOrValue)}` as any, value);
    } else {
      this.store.set(key, subKeyOrValue as AppConfig[K]);
    }
  }

  /**
   * 删除配置
   */
  public delete<K extends keyof AppConfig>(key: K): void {
    this.store.delete(key);
  }

  /**
   * 清空所有配置
   */
  public clear(): void {
    this.store.clear();
    logger.warn('所有配置已清空');
  }

  /**
   * 获取配置文件路径
   */
  public getConfigPath(): string {
    return this.store.path;
  }

  /**
   * 获取底层 Store 实例（兼容旧代码）
   */
  public getStore(): Store<AppConfig> {
    return this.store;
  }
}

export const configService = ConfigService.getInstance();
