/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 平台检测和路径解析工具
 */

import os from 'os';
import path from 'path';
import type { PlatformSpecificEntry } from '@booltox/shared';
import { createLogger } from './logger.js';

const logger = createLogger('PlatformUtils');

/**
 * 获取当前平台标识
 * @returns 平台标识字符串，如 'darwin-arm64', 'win32-x64', 'linux-x64'
 */
export function getCurrentPlatform(): string {
  const platform = os.platform();
  const arch = os.arch();
  return `${platform}-${arch}`;
}

/**
 * 解析入口路径（支持平台特定配置）
 * @param entry 入口配置（字符串或平台特定对象）
 * @param basePath 基础路径
 * @returns 解析后的绝对路径
 */
export function resolveEntryPath(
  entry: string | PlatformSpecificEntry,
  basePath: string
): string {
  // 如果是字符串，直接处理
  if (typeof entry === 'string') {
    return path.isAbsolute(entry) ? entry : path.join(basePath, entry);
  }

  // 如果是对象，根据当前平台选择
  const platformKey = getCurrentPlatform();
  const platformEntry = entry[platformKey as keyof PlatformSpecificEntry];

  if (!platformEntry) {
    const availablePlatforms = Object.keys(entry).join(', ');
    throw new Error(
      `当前平台 ${platformKey} 无可用的二进制文件。` +
      `可用平台: ${availablePlatforms}`
    );
  }

  logger.info(`[PlatformUtils] 平台检测: ${platformKey}，使用: ${platformEntry}`);

  return path.isAbsolute(platformEntry)
    ? platformEntry
    : path.join(basePath, platformEntry);
}

/**
 * 检查平台是否支持
 * @param entry 平台特定配置
 * @returns 当前平台是否支持
 */
export function isPlatformSupported(entry: PlatformSpecificEntry): boolean {
  const platformKey = getCurrentPlatform();
  return platformKey in entry;
}

/**
 * 获取所有支持的平台
 * @param entry 平台特定配置
 * @returns 支持的平台列表
 */
export function getSupportedPlatforms(entry: PlatformSpecificEntry): string[] {
  return Object.keys(entry);
}
