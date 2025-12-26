/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 跨平台终端启动器
 * 在系统默认终端中启动命令（支持 macOS/Windows/Linux）
 */

import { spawn, type ChildProcess } from 'child_process';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('TerminalLauncher');

export interface TerminalLaunchOptions {
  /** 要执行的命令 */
  command: string;
  /** 命令参数 */
  args: string[];
  /** 工作目录 */
  cwd: string;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 终端窗口标题 */
  title?: string;
  /** 是否在命令退出后保持终端窗口打开 */
  keepOpen?: boolean;
}

/**
 * 终端启动器
 */
export class TerminalLauncher {
  /**
   * 在系统终端中启动命令
   */
  static launch(options: TerminalLaunchOptions): ChildProcess {
    const platform = os.platform();

    logger.info(`[TerminalLauncher] 启动终端命令: ${options.command} ${options.args.join(' ')}`);
    logger.info(`[TerminalLauncher] 平台: ${platform}`);

    switch (platform) {
      case 'darwin':
        return this.launchMacOS(options);
      case 'win32':
        return this.launchWindows(options);
      case 'linux':
        return this.launchLinux(options);
      default:
        throw new Error(`不支持的平台: ${platform}`);
    }
  }

  /**
   * macOS: 使用 Terminal.app
   */
  private static launchMacOS(options: TerminalLaunchOptions): ChildProcess {
    const { command, args, cwd, title } = options;

    // 转义 AppleScript 字符串中的特殊字符
    const escapeAppleScript = (str: string) => str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

    // 对所有路径用引号包裹（处理空格）
    const quotedCommand = `\\"${escapeAppleScript(command)}\\"`;
    const quotedArgs = args.map(arg => `\\"${escapeAppleScript(arg)}\\"`).join(' ');
    const fullCommand = quotedArgs ? `${quotedCommand} ${quotedArgs}` : quotedCommand;
    const escapedCwd = escapeAppleScript(cwd);
    const cdCommand = `cd \\"${escapedCwd}\\"`;

    // 直接运行工具（对于交互式 TUI，让工具自己显示界面）
    const execCommand = `${fullCommand}`;

    const script = `
tell application "Terminal"
  activate
  do script "${cdCommand} && ${execCommand}"
  ${title ? `set custom title of front window to "${escapeAppleScript(title)}"` : ''}
end tell
    `.trim();

    logger.info(`[TerminalLauncher] macOS AppleScript:\n${script}`);

    const process = spawn('osascript', ['-e', script], {
      stdio: 'pipe',
    });

    // 捕获错误输出（调试用）
    process.stderr?.on('data', (data) => {
      logger.error(`[TerminalLauncher] osascript stderr: ${data.toString()}`);
    });

    process.on('exit', (code) => {
      if (code !== 0) {
        logger.error(`[TerminalLauncher] osascript 退出失败，code: ${code}`);
      }
    });

    return process;
  }

  /**
   * Windows: 使用 cmd.exe + 临时批处理文件
   */
  private static launchWindows(options: TerminalLaunchOptions): ChildProcess {
    const { command, args, cwd, title } = options;
    const windowTitle = title || 'BoolTox CLI Tool';

    logger.info(`[TerminalLauncher] Windows 命令: ${command}`);
    logger.info(`[TerminalLauncher] Windows 参数:`, args);

    // 在批处理文件中，所有参数都用引号包裹（避免特殊字符问题）
    // 路径中的 @ 等字符在批处理中是安全的（在引号内）
    const quotedCommand = `"${command}"`;
    const quotedArgs = args.map(arg => `"${arg}"`).join(' ');
    const fullCommand = quotedArgs ? `${quotedCommand} ${quotedArgs}` : quotedCommand;

    // 使用临时批处理文件
    const batchContent = `@echo off
chcp 65001 >nul
cd /d "${cwd}"
${fullCommand}
`;

    // 创建临时批处理文件
    const tempDir = os.tmpdir();
    const batchFile = path.join(tempDir, `booltox-${Date.now()}.bat`);

    try {
      fs.writeFileSync(batchFile, batchContent, { encoding: 'utf8' });
      logger.info(`[TerminalLauncher] 已创建临时批处理文件: ${batchFile}`);
      logger.info(`[TerminalLauncher] 批处理文件内容:\n${batchContent}`);
    } catch (error) {
      logger.error(`[TerminalLauncher] 创建批处理文件失败:`, error);
      throw error;
    }

    // 启动新的 cmd 窗口执行批处理文件
    // start "标题" "批处理文件路径"
    const launchCmd = `start "${windowTitle}" "${batchFile}"`;

    logger.info(`[TerminalLauncher] Windows 启动命令: ${launchCmd}`);

    const process = spawn('cmd', ['/c', launchCmd], {
      stdio: 'ignore',
      shell: true,
      detached: true,
    });

    // 清理临时文件（延迟删除，确保批处理启动后才删除）
    setTimeout(() => {
      try {
        if (fs.existsSync(batchFile)) {
          fs.unlinkSync(batchFile);
          logger.info(`[TerminalLauncher] 已清理临时批处理文件: ${batchFile}`);
        }
      } catch (error) {
        logger.warn(`[TerminalLauncher] 清理批处理文件失败（忽略）:`, error);
      }
    }, 5000); // 5秒后删除

    return process;
  }

  /**
   * Linux: 使用 gnome-terminal 或 xterm（自动检测）
   */
  private static launchLinux(options: TerminalLaunchOptions): ChildProcess {
    const { command, args, cwd, title } = options;

    const fullCommand = [command, ...args].map(arg => `"${arg}"`).join(' ');
    const windowTitle = title || 'BoolTox CLI Tool';

    // 直接运行工具
    const bashCommand = `cd "${cwd}" && ${fullCommand}`;

    logger.info(`[TerminalLauncher] Linux 命令: ${bashCommand}`);

    // 尝试 gnome-terminal（Ubuntu/GNOME）
    try {
      return spawn('gnome-terminal', [
        '--title', windowTitle,
        '--',
        'bash',
        '-c',
        bashCommand,
      ], {
        stdio: 'ignore',
      });
    } catch (error) {
      logger.warn(`[TerminalLauncher] gnome-terminal 启动失败，尝试 xterm`, error);

      // 回退到 xterm（通用）
      try {
        return spawn('xterm', [
          '-title', windowTitle,
          '-e', bashCommand,
        ], {
          stdio: 'ignore',
        });
      } catch (error2) {
        logger.warn(`[TerminalLauncher] xterm 启动失败，尝试 x-terminal-emulator`, error2);

        // 最后尝试 x-terminal-emulator（Debian/Ubuntu 默认）
        return spawn('x-terminal-emulator', [
          '-e', bashCommand,
        ], {
          stdio: 'ignore',
        });
      }
    }
  }
}
