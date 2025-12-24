/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 系统托盘服务
 *
 * 职责：
 * 1. 创建和管理系统托盘图标
 * 2. 构建托盘菜单（最近使用工具 + 快捷操作）
 * 3. 处理托盘事件（点击、菜单选择）
 */

import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron';
import type { NativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'node:url';
import * as fs from 'node:fs';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('TrayService');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export class TrayService {
  private tray: Tray | null = null;
  private mainWindow: BrowserWindow | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * 创建系统托盘
   */
  create(): void {
    try {
      // 获取托盘图标路径
      const iconPath = this.getTrayIconPath();

      // 创建托盘
      this.tray = new Tray(iconPath);
      this.tray.setToolTip('BoolTox - 一键运行开发者工具');

      // 单击托盘图标显示/隐藏窗口
      this.tray.on('click', () => {
        this.toggleWindow();
      });

      // 构建托盘菜单
      this.updateMenu();

      logger.info('System tray created successfully');
    } catch (error) {
      logger.error('Failed to create system tray:', error);
    }
  }

  /**
   * 更新托盘菜单
   */
  updateMenu(): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [
      {
        label: '打开 BoolTox',
        click: () => {
          this.showWindow();
        },
      },
      {
        label: '偏好设置',
        click: () => {
          this.showWindow();
          // TODO: 导航到设置页面
        },
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => {
          this.quit();
        },
      },
    ];

    const contextMenu = Menu.buildFromTemplate(menuItems);
    this.tray.setContextMenu(contextMenu);
  }

  /**
   * 显示/隐藏窗口切换
   */
  private toggleWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isVisible()) {
      this.mainWindow.hide();
    } else {
      this.showWindow();
    }
  }

  /**
   * 显示窗口
   */
  private showWindow(): void {
    if (!this.mainWindow) return;

    if (this.mainWindow.isMinimized()) {
      this.mainWindow.restore();
    }

    this.mainWindow.show();
    this.mainWindow.focus();
  }

  /**
   * 退出应用
   */
  private quit(): void {
    // 确保所有工具进程被清理
    app.quit();
  }

  /**
   * 获取托盘图标路径
   * 使用临时占位图标（稍后替换为品牌图标）
   */
  private getTrayIconPath(): string | NativeImage {
    // 根据平台和主题选择不同的图标
    const iconName = process.platform === 'darwin'
      ? 'tray-icon-template.png'  // macOS 使用模板图标（自动适应主题）
      : process.platform === 'win32'
      ? 'tray-icon.ico'            // Windows 使用 ICO 格式
      : 'tray-icon.png';            // Linux 使用 PNG

    // 图标路径（开发环境和生产环境）
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets', iconName)
      : path.join(__dirname, '../../resources', iconName);

    // 检查图标文件是否存在
    try {
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
      logger.warn('Tray icon file not found, using placeholder icon');
    } catch {
      logger.warn('Tray icon file not found, using placeholder icon');
    }

    // 如果图标文件不存在，创建占位图标
    return this.createPlaceholderIcon();
  }

  /**
   * 创建占位图标（临时方案）
   */
  private createPlaceholderIcon(): NativeImage {
    const fallbackIconDataUrl =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAACTSURBVHgBpZKBCYAgEEV/TeAIjuIIbdQIuUGt0CS1gW1iZ2jIVaTnhw+Cvs8/OYDJA4Y8kR3ZR2/kmazxJbpUEfQ/Dm/UG7wVwHkjlQdMFfDdJMFaACebnjJGyDWgcnZu1/lrCrl6NCoEHJBrDwEr5NrT6ko/UV8xdLAC2N49mlc5CylpYh8wCwqrvbBGLoKGvz8Bfq0QPWEUo/EAAAAASUVORK5CYII=';
    const icon = nativeImage.createFromDataURL(fallbackIconDataUrl);

    // macOS 需要模板图标（单色，系统自动适配主题）
    if (process.platform === 'darwin') {
      icon.setTemplateImage(true);
    }

    return icon;
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
      logger.info('System tray destroyed');
    }
  }

  /**
   * 设置徽章数字（显示运行中的工具数量）
   */
  setBadge(count: number): void {
    if (!this.tray) return;

    const tooltip = count > 0
      ? `BoolTox - ${count} 个工具运行中`
      : 'BoolTox - 一键运行开发者工具';

    this.tray.setToolTip(tooltip);
  }
}
