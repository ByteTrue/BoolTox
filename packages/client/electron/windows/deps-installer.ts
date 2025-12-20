/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 通用依赖安装窗口
 * 支持多语言工具（Python、Node.js 等）的依赖安装
 */

import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import fs from 'fs';
import { spawn } from 'child_process';
import { pythonManager } from '../services/python-manager.service.js';
import { getPlatformWindowConfig } from '../utils/window-platform-config.js';

const logger = log.scope('deps-installer');

// 支持的语言类型
export type LanguageType = 'python' | 'node';

// 通用依赖安装选项
export interface DepsInstallerOptions {
  toolId: string;
  toolName: string;
  toolPath: string;
  language: LanguageType;
  // Python 特有
  requirementsPath?: string;
  // Node.js 特有
  packageJsonPath?: string;
}

export interface InstallResult {
  success: boolean;
  cancelled: boolean;
}

/**
 * 显示依赖安装窗口
 */
export async function showDepsInstaller(
  options: DepsInstallerOptions
): Promise<InstallResult> {
  const { toolId, toolName, toolPath, language } = options;

  return new Promise((resolve) => {
    // 创建窗口
    const win = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      resizable: true,
      minimizable: true,
      maximizable: true,
      frame: false,
      autoHideMenuBar: true,
      modal: true,
      show: false,
      title: `${toolName} - 依赖安装`,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
      ...getPlatformWindowConfig({ frameless: true }),
    });
    win.setMenuBarVisibility(false);
    win.setMenu(null);
    if (process.platform === 'darwin') {
      win.setWindowButtonVisibility(false);
    }

    // 读取依赖文件内容
    let depsContent = '';
    let envInfo = { hasEnv: false, envPath: '' };

    if (language === 'python' && options.requirementsPath) {
      const fullPath = path.isAbsolute(options.requirementsPath)
        ? options.requirementsPath
        : path.join(toolPath, options.requirementsPath);

      if (fs.existsSync(fullPath)) {
        depsContent = fs.readFileSync(fullPath, 'utf-8');
      }

      envInfo = {
        hasEnv: pythonManager.hasToolEnv(toolId),
        envPath: pythonManager.getToolEnvDir(toolId),
      };
    } else if (language === 'node' && options.packageJsonPath) {
      const fullPath = path.isAbsolute(options.packageJsonPath)
        ? options.packageJsonPath
        : path.join(toolPath, options.packageJsonPath);

      if (fs.existsSync(fullPath)) {
        const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
        const deps = pkg.dependencies || {};
        const devDeps = pkg.devDependencies || {};

        // 生成依赖列表显示
        const allDeps = [
          ...Object.entries(deps).map(([name, version]) => `${name}@${version}`),
          ...Object.entries(devDeps).map(([name, version]) => `${name}@${version} (dev)`),
        ];
        depsContent = allDeps.join('\n');
      }

      envInfo = {
        hasEnv: fs.existsSync(path.join(toolPath, 'node_modules')),
        envPath: path.join(toolPath, 'node_modules'),
      };
    }

    // 加载 HTML
    const htmlContent = generateInstallerHTML({
      toolId,
      toolName,
      language,
      depsContent,
      hasEnv: envInfo.hasEnv,
      envPath: envInfo.envPath,
    });

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    win.once('ready-to-show', () => {
      win.show();
    });

    // 处理用户操作
    let isInstalling = false;
    let isWindowDestroyed = false;
    let isResolved = false;

    const safeResolve = (result: InstallResult) => {
      if (isResolved) return;
      isResolved = true;
      resolve(result);
    };

    const safeSend = (channel: string, data: unknown) => {
      if (isWindowDestroyed || win.isDestroyed()) {
        return false;
      }
      try {
        win.webContents.send(channel, data);
        return true;
      } catch (e) {
        logger.warn('发送消息到窗口失败:', e);
        return false;
      }
    };

    // 取消按钮
    ipcMain.once(`deps:cancel:${toolId}`, () => {
      if (!isInstalling) {
        if (!win.isDestroyed()) {
          win.close();
        }
        safeResolve({ success: false, cancelled: true });
      }
    });

    // 开始安装
    ipcMain.once(`deps:install:${toolId}`, async (_event, data?: { indexUrl?: string }) => {
      isInstalling = true;

      const sendLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
        safeSend(`deps:log:${toolId}`, { message, type });
      };

      try {
        if (language === 'python') {
          await installPythonDeps(toolId, toolPath, options.requirementsPath!, data?.indexUrl, sendLog);
        } else if (language === 'node') {
          await installNodeDeps(toolId, toolPath, sendLog);
        }

        sendLog('✅ 依赖安装完成！', 'success');
        sendLog('🚀 即将启动工具...', 'info');

        await new Promise((r) => setTimeout(r, 1500));

        if (!win.isDestroyed()) {
          win.close();
        }
        safeResolve({ success: true, cancelled: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('依赖安装失败:', error);

        const sent = safeSend(`deps:log:${toolId}`, {
          message: `❌ 安装失败: ${errorMessage}`,
          type: 'error',
        });

        if (sent) {
          safeSend(`deps:log:${toolId}`, {
            message: '\n请检查网络连接或查看完整日志',
            type: 'error',
          });

          safeSend(`deps:install-failed:${toolId}`, {});
        } else {
          safeResolve({ success: false, cancelled: false });
        }
      }
    });

    // 窗口关闭
    win.once('closed', () => {
      isWindowDestroyed = true;
      ipcMain.removeAllListeners(`deps:cancel:${toolId}`);
      ipcMain.removeAllListeners(`deps:install:${toolId}`);
      if (!isInstalling) {
        safeResolve({ success: false, cancelled: true });
      } else {
        safeResolve({ success: false, cancelled: true });
      }
    });
  });
}

/**
 * 安装 Python 依赖
 */
async function installPythonDeps(
  toolId: string,
  toolPath: string,
  requirementsPath: string,
  indexUrl: string | undefined,
  sendLog: (msg: string, type?: 'info' | 'error' | 'success') => void
): Promise<void> {
  sendLog('🔧 开始准备 Python 环境...', 'info');
  if (indexUrl) {
    sendLog(`🌐 使用镜像源: ${indexUrl}`, 'info');
  }

  // 确保 Python 环境
  await pythonManager.ensurePython((progress) => {
    sendLog(`[${progress.stage}] ${progress.message}`, 'info');
  });

  sendLog('✅ Python 环境就绪', 'success');
  sendLog('📦 开始安装依赖...', 'info');

  const fullRequirementsPath = path.isAbsolute(requirementsPath)
    ? requirementsPath
    : path.join(toolPath, requirementsPath);

  // 安装依赖（传递镜像源）
  await pythonManager.ensureToolEnv(
    toolId,
    fullRequirementsPath,
    (progress) => {
      sendLog(`[${progress.stage}] ${progress.message}`, 'info');
    },
    indexUrl || undefined
  );
}

/**
 * 安装 Node.js 依赖
 */
async function installNodeDeps(
  toolId: string,
  toolPath: string,
  sendLog: (msg: string, type?: 'info' | 'error' | 'success') => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    sendLog('🔧 开始安装 Node.js 依赖...', 'info');
    sendLog('📦 运行 npm install...', 'info');

    const npmProcess = spawn('npm', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], {
      cwd: toolPath,
      shell: true,
      stdio: 'pipe',
    });

    let stderr = '';

    npmProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        sendLog(output, 'info');
      }
    });

    npmProcess.stderr?.on('data', (data) => {
      const output = data.toString().trim();
      stderr += output + '\n';
      if (output) {
        // npm 的一些信息也会输出到 stderr，不一定是错误
        sendLog(output, 'info');
      }
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        sendLog('✅ npm install 完成', 'success');
        resolve();
      } else {
        const error = `npm install 失败 (退出码: ${code})`;
        sendLog(error, 'error');
        if (stderr) {
          sendLog(`错误详情: ${stderr}`, 'error');
        }
        reject(new Error(error));
      }
    });

    npmProcess.on('error', (error) => {
      const msg = `无法启动 npm: ${error.message}`;
      sendLog(msg, 'error');
      reject(new Error(msg));
    });
  });
}

/**
 * 生成安装窗口 HTML（通用版本）
 */
function generateInstallerHTML(options: {
  toolId: string;
  toolName: string;
  language: LanguageType;
  depsContent: string;
  hasEnv: boolean;
  envPath: string;
}): string {
  const { toolId, toolName, language, depsContent, hasEnv, envPath } = options;

  // 语言特定配置
  const langConfig = {
    python: {
      icon: '🐍',
      title: 'Python 依赖安装',
      envLabel: '虚拟环境',
      depsLabel: '依赖列表 (requirements.txt)',
      showMirror: true,
      mirrorOptions: [
        { value: '', label: '默认 (PyPI 官方)' },
        { value: 'https://pypi.tuna.tsinghua.edu.cn/simple', label: '清华大学' },
        { value: 'https://mirrors.aliyun.com/pypi/simple', label: '阿里云' },
        { value: 'https://pypi.mirrors.ustc.edu.cn/simple', label: '中科大' },
        { value: 'https://mirrors.cloud.tencent.com/pypi/simple', label: '腾讯云' },
      ],
    },
    node: {
      icon: '📦',
      title: 'Node.js 依赖安装',
      envLabel: '依赖目录',
      depsLabel: '依赖列表 (package.json)',
      showMirror: true,
      mirrorOptions: [
        { value: '', label: '默认 (npm 官方)' },
        { value: 'https://registry.npmmirror.com', label: '淘宝镜像' },
        { value: 'https://registry.npm.taobao.org', label: '淘宝镜像（旧）' },
      ],
    },
  };

  const config = langConfig[language];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${config.title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      color: #0f172a;
      padding: 0;
      overflow: hidden;
      height: 100vh;
      width: 100vw;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .window {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }

    .titlebar {
      height: 44px;
      padding: 0 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(248, 250, 252, 0.65);
      border-bottom: 1px solid rgba(148, 163, 184, 0.3);
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.6);
      -webkit-app-region: drag;
      position: relative;
      z-index: 5;
    }

    .titlebar-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
      color: #334155;
    }

    .titlebar-title {
      font-size: 15px;
      font-weight: 600;
    }

    .titlebar-subtitle {
      font-size: 12px;
      color: #94a3b8;
      font-weight: 500;
    }

    .titlebar-actions {
      display: flex;
      gap: 8px;
      -webkit-app-region: no-drag;
    }

    .titlebar-button {
      width: 32px;
      height: 24px;
      border-radius: 6px;
      border: 1px solid rgba(148, 163, 184, 0.3);
      background: rgba(255, 255, 255, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #475569;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .titlebar-button:hover {
      background: rgba(148, 163, 184, 0.2);
    }

    .titlebar-button.close {
      color: #dc2626;
      border-color: rgba(248, 113, 113, 0.4);
    }

    .titlebar-button.close:hover {
      background: rgba(248, 113, 113, 0.15);
    }

    .container {
      flex: 1;
      width: 100%;
      min-height: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
    }

    .header {
      flex-shrink: 0;
    }

    h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      color: #0f172a;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 13px;
      color: #64748b;
      margin: 4px 0 0 0;
      font-weight: 500;
    }

    .main-content {
      flex: 1;
      display: flex;
      gap: 16px;
      min-height: 0;
    }

    .info-panel {
      width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .log-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .section {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(12px) saturate(180%);
      -webkit-backdrop-filter: blur(12px) saturate(180%);
      border: 1px solid rgba(226, 232, 240, 0.8);
      border-radius: 12px;
      padding: 16px;
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.04),
        0 4px 8px rgba(15, 23, 42, 0.02),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .section.log-section {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      color: #475569;
      display: flex;
      align-items: center;
      gap: 8px;
      letter-spacing: -0.01em;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      letter-spacing: -0.01em;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .status-badge.success {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
      color: #166534;
      border: 1px solid rgba(22, 163, 74, 0.2);
    }

    .status-badge.warning {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
      border: 1px solid rgba(217, 119, 6, 0.2);
    }

    .mirror-select {
      width: 100%;
      padding: 10px 14px;
      border-radius: 8px;
      border: 1px solid rgba(226, 232, 240, 0.8);
      background: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M2 4l4 4 4-4'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
    }

    .mirror-select:hover {
      border-color: rgba(99, 102, 241, 0.5);
    }

    .mirror-select:focus {
      outline: none;
      border-color: rgba(99, 102, 241, 0.8);
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
    }

    .mirror-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .env-path {
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      color: #64748b;
      background: rgba(241, 245, 249, 0.8);
      backdrop-filter: blur(8px);
      padding: 10px 14px;
      border-radius: 8px;
      word-break: break-all;
      margin-top: 10px;
      border: 1px solid rgba(226, 232, 240, 0.6);
      line-height: 1.6;
    }

    .deps-box {
      background: rgba(248, 250, 252, 0.9);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(226, 232, 240, 0.6);
      border-radius: 10px;
      padding: 14px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      color: #334155;
      max-height: 120px;
      overflow-y: auto;
      white-space: pre-wrap;
      line-height: 1.6;
      scrollbar-width: thin;
      scrollbar-color: rgba(100, 116, 139, 0.3) transparent;
    }

    .deps-box::-webkit-scrollbar {
      width: 6px;
    }

    .deps-box::-webkit-scrollbar-track {
      background: transparent;
    }

    .deps-box::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.3);
      border-radius: 3px;
    }

    .deps-box::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 116, 139, 0.5);
    }

    .log-container {
      flex: 1;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      border: 1px solid rgba(30, 41, 59, 0.8);
      border-radius: 10px;
      padding: 14px;
      font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
      font-size: 12px;
      color: #e2e8f0;
      overflow-y: auto;
      min-height: 0;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
      scrollbar-width: thin;
      scrollbar-color: rgba(101, 187, 233, 0.3) transparent;
    }

    .log-container::-webkit-scrollbar {
      width: 6px;
    }

    .log-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .log-container::-webkit-scrollbar-thumb {
      background: rgba(101, 187, 233, 0.3);
      border-radius: 3px;
      transition: background 0.2s;
    }

    .log-container::-webkit-scrollbar-thumb:hover {
      background: rgba(101, 187, 233, 0.5);
    }

    .log-line {
      margin-bottom: 4px;
      line-height: 1.6;
      animation: fadeIn 0.2s ease-out;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-2px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .log-line.info {
      color: #94a3b8;
    }

    .log-line.success {
      color: #4ade80;
      font-weight: 500;
    }

    .log-line.error {
      color: #f87171;
      font-weight: 500;
    }

    .button-group {
      display: flex;
      gap: 12px;
      flex-shrink: 0;
    }

    button {
      flex: 1;
      padding: 12px 24px;
      border: 1px solid transparent;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      letter-spacing: -0.01em;
      position: relative;
      overflow: hidden;
    }

    .btn-primary {
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.9) 0%, rgba(6, 182, 212, 0.9) 100%);
      color: white;
      border: 1px solid rgba(59, 130, 246, 0.4);
      box-shadow:
        0 2px 8px rgba(59, 130, 246, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(8px);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow:
        0 4px 16px rgba(59, 130, 246, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
      box-shadow:
        0 2px 8px rgba(59, 130, 246, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .btn-secondary {
      background: rgba(241, 245, 249, 0.8);
      backdrop-filter: blur(8px);
      color: #475569;
      border: 1px solid rgba(226, 232, 240, 0.8);
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.04),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .btn-secondary:hover:not(:disabled) {
      background: rgba(226, 232, 240, 0.9);
      box-shadow:
        0 2px 8px rgba(15, 23, 42, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    .btn-secondary:active:not(:disabled) {
      background: rgba(203, 213, 225, 0.9);
      box-shadow:
        0 1px 3px rgba(15, 23, 42, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-left: 8px;
    }

    .spinner.hidden {
      display: none !important;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .section,
    button,
    .log-line {
      transform: translateZ(0);
      backface-visibility: hidden;
    }
  </style>
</head>
<body>
  <div class="window">
    <div class="titlebar">
      <div class="titlebar-info">
        <span class="titlebar-title">${toolName}</span>
        <span class="titlebar-subtitle">${config.title}</span>
      </div>
      <div class="titlebar-actions">
        <button class="titlebar-button" id="window-minimize" aria-label="最小化">&minus;</button>
        <button class="titlebar-button" id="window-maximize" aria-label="最大化">&#9633;</button>
        <button class="titlebar-button close" id="window-close" aria-label="关闭">&times;</button>
      </div>
    </div>
    <div class="container">
    <div class="header">
      <h1>${config.icon} ${toolName}</h1>
      <div class="subtitle">${config.title}</div>
    </div>

    <div class="main-content">
      <div class="info-panel">
        <!-- 环境状态 -->
        <div class="section">
          <div class="section-title">📦 ${config.envLabel}</div>
          ${
            hasEnv
              ? '<span class="status-badge success">✓ 已创建</span>'
              : '<span class="status-badge warning">⚠ 未创建</span>'
          }
          <div class="env-path">${envPath}</div>
        </div>

        ${config.showMirror ? `
        <!-- 镜像源选择 -->
        <div class="section">
          <div class="section-title">🌐 镜像源</div>
          <select id="mirror-select" class="mirror-select">
            ${config.mirrorOptions.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join('')}
          </select>
        </div>
        ` : ''}

        <!-- 依赖列表 -->
        <div class="section" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div class="section-title">📋 ${config.depsLabel}</div>
          <div class="deps-box" style="flex: 1; max-height: none;">${depsContent || '(无依赖)'}</div>
        </div>
      </div>

      <div class="log-panel">
        <div class="section log-section">
          <div class="section-title">📝 安装日志</div>
          <div class="log-container" id="log-container">
            <div class="log-line info">点击"开始安装"按钮开始安装依赖...</div>
          </div>
        </div>
      </div>
    </div>

    <div class="button-group">
      <button class="btn-secondary" id="cancel-btn">取消</button>
      <button class="btn-primary" id="install-btn">
        <span id="install-text">开始安装</span>
        <span id="install-spinner" class="spinner hidden"></span>
      </button>
    </div>
    </div>
  </div>

  <script>
    const { ipcRenderer } = require('electron');
    const toolId = '${toolId}';

    const logContainer = document.getElementById('log-container');
    const installBtn = document.getElementById('install-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const installText = document.getElementById('install-text');
    const installSpinner = document.getElementById('install-spinner');
    const mirrorSelect = document.getElementById('mirror-select');

    let isInstalling = false;

    cancelBtn.addEventListener('click', () => {
      if (!isInstalling) {
        ipcRenderer.send('deps:cancel:' + toolId);
      }
    });

    installBtn.addEventListener('click', () => {
      if (isInstalling) return;

      isInstalling = true;
      installBtn.disabled = true;
      cancelBtn.disabled = true;
      if (mirrorSelect) {
        mirrorSelect.disabled = true;
      }
      installText.textContent = '安装中...';
      installSpinner.classList.remove('hidden');

      logContainer.innerHTML = '';
      const indexUrl = mirrorSelect?.value || '';
      ipcRenderer.send('deps:install:' + toolId, { indexUrl });
    });

    // 接收日志
    ipcRenderer.on('deps:log:' + toolId, (event, { message, type }) => {
      const line = document.createElement('div');
      line.className = \`log-line \${type}\`;
      line.textContent = message;
      logContainer.appendChild(line);
      logContainer.scrollTop = logContainer.scrollHeight;
    });

    // 安装失败
    ipcRenderer.on('deps:install-failed:' + toolId, () => {
      installBtn.disabled = true;
      cancelBtn.disabled = false;
      cancelBtn.textContent = '关闭';
      installText.textContent = '安装失败';
      installSpinner.classList.add('hidden');
    });

    function bindWindowControl(id, action) {
      const button = document.getElementById(id);
      if (!button) return;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        ipcRenderer.invoke('window:control', action);
      });
    }

    bindWindowControl('window-minimize', 'minimize');
    bindWindowControl('window-maximize', 'toggle-maximize');
    bindWindowControl('window-close', 'close');
  </script>
</body>
</html>
  `;
}
