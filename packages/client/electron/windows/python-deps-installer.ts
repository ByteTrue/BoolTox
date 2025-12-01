/**
 * Python 依赖安装窗口
 * 在启动 Python 插件前显示，让用户确认并查看依赖安装过程
 */

import { BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import log from 'electron-log';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { pythonManager } from '../services/python-manager.service.js';
import { getPlatformWindowConfig } from '../utils/window-platform-config.js';

const logger = log.scope('python-deps-installer');

// ES Module 兼容：获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PythonDepsInstallerOptions {
  pluginId: string;
  pluginName: string;
  pluginPath: string;
  requirementsPath: string;
}

export interface InstallResult {
  success: boolean;
  cancelled: boolean;
}

/**
 * 显示 Python 依赖安装窗口
 */
export async function showPythonDepsInstaller(
  options: PythonDepsInstallerOptions
): Promise<InstallResult> {
  const { pluginId, pluginName, pluginPath, requirementsPath } = options;

  return new Promise((resolve) => {
    // 创建窗口
    const win = new BrowserWindow({
      width: 900,
      height: 550,
      minWidth: 760,
      minHeight: 500,
      resizable: true,
      minimizable: true,
      maximizable: true,
      frame: false,
      autoHideMenuBar: true,
      modal: true,
      show: false,
      title: `${pluginName} - Python 依赖安装`,
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

    // 读取 requirements.txt 内容
    let requirementsContent = '';
    const fullRequirementsPath = path.isAbsolute(requirementsPath)
      ? requirementsPath
      : path.join(pluginPath, requirementsPath);

    if (fs.existsSync(fullRequirementsPath)) {
      requirementsContent = fs.readFileSync(fullRequirementsPath, 'utf-8');
    }

    // 检查虚拟环境状态
    const hasEnv = pythonManager.hasPluginEnv(pluginId);
    const envPath = pythonManager.getPluginEnvDir(pluginId);

    // 加载 HTML
    const htmlContent = generateInstallerHTML({
      pluginId,
      pluginName,
      requirementsContent,
      hasEnv,
      envPath,
    });

    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    win.once('ready-to-show', () => {
      win.show();
    });

    // 处理用户操作
    let isInstalling = false;

    // 取消按钮
    ipcMain.once(`python-deps:cancel:${pluginId}`, () => {
      if (!isInstalling) {
        win.close();
        resolve({ success: false, cancelled: true });
      }
    });

    // 开始安装
    ipcMain.once(`python-deps:install:${pluginId}`, async () => {
      isInstalling = true;

      try {
        // 发送日志到窗口
        const sendLog = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
          win.webContents.send(`python-deps:log:${pluginId}`, { message, type });
        };

        sendLog('🔧 开始准备 Python 环境...', 'info');

        // 确保 Python 环境
        await pythonManager.ensurePython((progress) => {
          sendLog(`[${progress.stage}] ${progress.message}`, 'info');
        });

        sendLog('✅ Python 环境就绪', 'success');
        sendLog('📦 开始安装依赖...', 'info');

        // 安装依赖
        await pythonManager.ensurePluginEnv(
          pluginId,
          fullRequirementsPath,
          (progress) => {
            sendLog(`[${progress.stage}] ${progress.message}`, 'info');
          }
        );

        sendLog('✅ 依赖安装完成！', 'success');
        sendLog('🚀 即将启动插件...', 'info');

        // 等待一下让用户看到成功消息
        await new Promise((r) => setTimeout(r, 1500));

        win.close();
        resolve({ success: true, cancelled: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('依赖安装失败:', error);

        win.webContents.send(`python-deps:log:${pluginId}`, {
          message: `❌ 安装失败: ${errorMessage}`,
          type: 'error',
        });

        win.webContents.send(`python-deps:log:${pluginId}`, {
          message: '\n请检查网络连接或查看完整日志',
          type: 'error',
        });

        // 启用关闭按钮
        win.webContents.send(`python-deps:install-failed:${pluginId}`);

        // 等待用户关闭窗口
        win.once('closed', () => {
          resolve({ success: false, cancelled: false });
        });
      }
    });

    // 窗口关闭
    win.once('closed', () => {
      ipcMain.removeAllListeners(`python-deps:cancel:${pluginId}`);
      ipcMain.removeAllListeners(`python-deps:install:${pluginId}`);
      if (!isInstalling) {
        resolve({ success: false, cancelled: true });
      }
    });
  });
}

/**
 * 生成安装窗口 HTML
 */
function generateInstallerHTML(options: {
  pluginId: string;
  pluginName: string;
  requirementsContent: string;
  hasEnv: boolean;
  envPath: string;
}): string {
  const { pluginId, pluginName, requirementsContent, hasEnv, envPath } = options;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Python 依赖安装</title>
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

    /* 标题区域 */
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

    /* 主内容区域 - 横向布局 */
    .main-content {
      flex: 1;
      display: flex;
      gap: 16px;
      min-height: 0;
    }

    /* 左侧信息面板 */
    .info-panel {
      width: 320px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* 右侧日志面板 */
    .log-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    /* 玻璃拟态卡片 */
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

    /* 状态徽章 */
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

    /* 环境路径 */
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

    /* Requirements 列表 */
    .requirements-box {
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

    .requirements-box::-webkit-scrollbar {
      width: 6px;
    }

    .requirements-box::-webkit-scrollbar-track {
      background: transparent;
    }

    .requirements-box::-webkit-scrollbar-thumb {
      background: rgba(100, 116, 139, 0.3);
      border-radius: 3px;
    }

    .requirements-box::-webkit-scrollbar-thumb:hover {
      background: rgba(100, 116, 139, 0.5);
    }

    /* 日志容器 */
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

    /* 按钮组 */
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

    /* 主按钮 - 玻璃拟态风格 */
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

    /* 次要按钮 - 玻璃拟态风格 */
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

    /* 加载动画 */
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

    /* GPU 加速优化 */
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
        <span class="titlebar-title">${pluginName}</span>
        <span class="titlebar-subtitle">Python 依赖安装</span>
      </div>
      <div class="titlebar-actions">
        <button class="titlebar-button" id="window-minimize" aria-label="最小化">&minus;</button>
        <button class="titlebar-button" id="window-maximize" aria-label="最大化">&#9633;</button>
        <button class="titlebar-button close" id="window-close" aria-label="关闭">&times;</button>
      </div>
    </div>
    <div class="container">
    <!-- 标题区域 -->
    <div class="header">
      <h1>🐍 ${pluginName}</h1>
      <div class="subtitle">Python 依赖环境检查</div>
    </div>

    <!-- 主内容区域 - 横向布局 -->
    <div class="main-content">
      <!-- 左侧信息面板 -->
      <div class="info-panel">
        <!-- 环境状态 -->
        <div class="section">
          <div class="section-title">📦 虚拟环境</div>
          ${
            hasEnv
              ? '<span class="status-badge success">✓ 已创建</span>'
              : '<span class="status-badge warning">⚠ 未创建</span>'
          }
          <div class="env-path">${envPath}</div>
        </div>

        <!-- Requirements -->
        <div class="section" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
          <div class="section-title">📋 依赖列表</div>
          <div class="requirements-box" style="flex: 1; max-height: none;">${requirementsContent || '(无依赖)'}</div>
        </div>
      </div>

      <!-- 右侧日志面板 -->
      <div class="log-panel">
        <div class="section log-section">
          <div class="section-title">📝 安装日志</div>
          <div class="log-container" id="log-container">
            <div class="log-line info">点击"开始安装"按钮开始安装依赖...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 按钮 -->
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
    const pluginId = '${pluginId}';

    const logContainer = document.getElementById('log-container');
    const installBtn = document.getElementById('install-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const installText = document.getElementById('install-text');
    const installSpinner = document.getElementById('install-spinner');

    let isInstalling = false;

    // 取消按钮
    cancelBtn.addEventListener('click', () => {
      if (!isInstalling) {
        ipcRenderer.send('python-deps:cancel:' + pluginId);
      }
    });

    // 安装按钮
    installBtn.addEventListener('click', () => {
      if (isInstalling) return;

      isInstalling = true;
      installBtn.disabled = true;
      cancelBtn.disabled = true;
      installText.textContent = '安装中...';
      installSpinner.classList.remove('hidden');

      logContainer.innerHTML = '';
      ipcRenderer.send('python-deps:install:' + pluginId);
    });

    // 接收日志
    ipcRenderer.on('python-deps:log:' + pluginId, (event, { message, type }) => {
      const line = document.createElement('div');
      line.className = \`log-line \${type}\`;
      line.textContent = message;
      logContainer.appendChild(line);
      logContainer.scrollTop = logContainer.scrollHeight;
    });

    // 安装失败
    ipcRenderer.on('python-deps:install-failed:' + pluginId, () => {
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
