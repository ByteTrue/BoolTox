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
      this.tray.setToolTip('BoolTox - 工具箱');

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
   * @param recentTools 最近使用的工具列表
   */
  updateMenu(recentTools?: Array<{ id: string; name: string; icon?: string }>): void {
    if (!this.tray) return;

    const menuItems: Electron.MenuItemConstructorOptions[] = [];

    // 最近使用的工具
    if (recentTools && recentTools.length > 0) {
      const toolMenuItems: Electron.MenuItemConstructorOptions[] = recentTools.slice(0, 5).map(tool => ({
        label: `${tool.icon || '🔧'} ${tool.name}`,
        click: () => {
          this.launchTool(tool.id);
        },
      }));

      menuItems.push(
        {
          label: '最近使用',
          enabled: false,
        },
        ...toolMenuItems,
        { type: 'separator' }
      );
    }

    // 快捷操作
    menuItems.push(
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
      }
    );

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
   * 启动工具
   */
  private launchTool(toolId: string): void {
    if (!this.mainWindow) return;

    // 显示窗口
    this.showWindow();

    // 发送启动工具的消息到渲染进程
    this.mainWindow.webContents.send('tool:launch-from-tray', toolId);
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
      const fs = require('fs');
      if (fs.existsSync(iconPath)) {
        return iconPath;
      }
    } catch (error) {
      logger.warn('Tray icon file not found, using placeholder icon');
    }

    // 如果图标文件不存在，创建占位图标
    return this.createPlaceholderIcon();
  }

  /**
   * 创建占位图标（临时方案）
   */
  private createPlaceholderIcon(): NativeImage {
    // 创建一个简单的 16x16 图标（蓝色方块 + "B" 字母）
    const size = 16;
    const canvas = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <!-- 背景圆角矩形 -->
        <rect x="0" y="0" width="${size}" height="${size}" rx="3" fill="#65BBE9"/>
        <!-- 字母 B -->
        <text x="${size / 2}" y="${size / 2 + 5}"
              font-family="Arial" font-size="12" font-weight="bold"
              text-anchor="middle" fill="white">B</text>
      </svg>
    `;

    // 创建 nativeImage
    const icon = nativeImage.createFromBuffer(Buffer.from(canvas));

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
   * macOS 和 Linux 支持
   */
  setBadge(count: number): void {
    if (!this.tray) return;

    // Windows 不支持徽章，可以修改图标或 tooltip
    if (process.platform === 'win32') {
      if (count > 0) {
        this.tray.setToolTip(`BoolTox - ${count} 个工具运行中`);
      } else {
        this.tray.setToolTip('BoolTox - 工具箱');
      }
    } else {
      // macOS/Linux 可以使用 overlay icon
      // 这里简化实现，只更新 tooltip
      if (count > 0) {
        this.tray.setToolTip(`BoolTox - ${count} 个工具运行中`);
      } else {
        this.tray.setToolTip('BoolTox - 工具箱');
      }
    }
  }
}
