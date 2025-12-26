/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * python-manager.service.ts
 * Python 运行时管理服务
 * 
 * 基于 uv 实现跨平台 Python 环境管理：
 * - 自动安装 Python 3.12 到用户数据目录
 * - 管理全局共享虚拟环境
 * - 支持按工具隔离的依赖安装
 * - 提供脚本执行（同步/流式）
 */

import { app } from 'electron';
import { spawn, execSync, ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs';
import log from 'electron-log';
import { fileURLToPath } from 'url';

// ES Module 兼容：获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志配置
const logger = log.scope('python-manager');

// Python 版本配置
const PYTHON_VERSION = '3.12';

/**
 * Python 环境状态
 */
export interface PythonStatus {
  /** uv 是否可用 */
  uvAvailable: boolean;
  /** uv 版本 */
  uvVersion?: string;
  /** Python 是否已安装 */
  pythonInstalled: boolean;
  /** Python 版本 */
  pythonVersion?: string;
  /** Python 可执行文件路径 */
  pythonPath?: string;
  /** 虚拟环境是否存在 */
  venvExists: boolean;
  /** 虚拟环境路径 */
  venvPath?: string;
}

/**
 * 进度回调类型
 */
export type ProgressCallback = (progress: {
  stage: 'download' | 'install' | 'venv' | 'deps';
  message: string;
  percent?: number;
}) => void;

type ProgressStage = Parameters<ProgressCallback>[0]['stage'];

function emitProgressLog(
  onProgress: ProgressCallback | undefined,
  stage: ProgressStage,
  chunk: Buffer | string
) {
  if (!onProgress) return;
  const text = chunk.toString();
  text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .forEach((line) => onProgress({ stage, message: line }));
}

/**
 * 脚本执行选项
 */
export interface RunScriptOptions {
  /** 工作目录 */
  cwd?: string;
  /** 环境变量 */
  env?: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout?: number;
  /** 输出回调（流式输出） */
  onOutput?: (data: string, type: 'stdout' | 'stderr') => void;
  /** 自定义 Python 可执行路径（默认全局虚拟环境） */
  pythonPath?: string;
  /** 关联的虚拟环境路径（用于注入 VIRTUAL_ENV） */
  venvPath?: string;
}

/**
 * 脚本执行结果
 */
export interface RunScriptResult {
  success: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

interface ToolEnvMetadata {
  pythonVersion: string;
  requirementsHash?: string;
  updatedAt: string;
}

/**
 * Python 运行时管理器
 */
class PythonManager {
  /** uv 可执行文件路径 */
  private uvPath: string;
  /** Python 安装目录 */
  private pythonInstallDir: string;
  /** 虚拟环境目录 */
  private venvDir: string;
  /** 工具依赖目录 (legacy) */
  private toolPackagesDir: string;
  /** 工具独立虚拟环境目录 */
  private toolEnvsDir: string;
  /** 是否已初始化 */
  private initialized: boolean = false;

  constructor() {
    // 根据打包状态确定 uv 路径
    // 打包后: process.resourcesPath/uv/uv.exe
    // 开发时: packages/client/resources/uv/{platform}/uv.exe
    let uvDir: string;
    
    if (app.isPackaged) {
      uvDir = path.join(process.resourcesPath, 'uv');
    } else {
      // 开发模式：从 dist-electron/ 向上找到 resources/uv/{platform}/
      const platform = process.platform === 'win32' 
        ? 'win-x64' 
        : process.platform === 'darwin' 
          ? (process.arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64')
          : 'linux-x64';
      uvDir = path.join(__dirname, '../resources/uv', platform);
    }

    // uv 可执行文件
    const uvExecutable = process.platform === 'win32' ? 'uv.exe' : 'uv';
    this.uvPath = path.join(uvDir, uvExecutable);

    // 用户数据目录下的 Python 相关路径
    const userDataPath = app.getPath('userData');
    this.pythonInstallDir = path.join(userDataPath, 'python-runtime');
    this.venvDir = path.join(userDataPath, 'python-venv');
    this.toolPackagesDir = path.join(userDataPath, 'tool-packages');
    this.toolEnvsDir = path.join(userDataPath, 'tool-envs');

    logger.info('PythonManager 初始化', {
      uvPath: this.uvPath,
      pythonInstallDir: this.pythonInstallDir,
      venvDir: this.venvDir,
      toolPackagesDir: this.toolPackagesDir,
      toolEnvsDir: this.toolEnvsDir
    });
  }

  /**
   * 获取 uv 路径
   */
  getUvPath(): string {
    return this.uvPath;
  }

  /**
   * 获取 Python 可执行文件路径
   */
  getPythonPath(): string {
    if (process.platform === 'win32') {
      return path.join(this.venvDir, 'Scripts', 'python.exe');
    } else {
      return path.join(this.venvDir, 'bin', 'python');
    }
  }

  /**
   * 获取 pip 可执行文件路径
   */
  getPipPath(): string {
    if (process.platform === 'win32') {
      return path.join(this.venvDir, 'Scripts', 'pip.exe');
    } else {
      return path.join(this.venvDir, 'bin', 'pip');
    }
  }

  /**
   * 获取工具依赖目录
   */
  getToolPackagesDir(toolId: string): string {
    return path.join(this.toolPackagesDir, toolId);
  }

  /**
   * 检查 uv 是否可用
   */
  async checkUvAvailable(): Promise<{ available: boolean; version?: string }> {
    try {
      if (!fs.existsSync(this.uvPath)) {
        logger.warn('uv 可执行文件不存在', this.uvPath);
        return { available: false };
      }

      const result = execSync(`"${this.uvPath}" --version`, {
        encoding: 'utf-8',
        timeout: 5000
      }).trim();

      // 格式: "uv 0.5.14 (commit hash)"
      const version = result.split(' ')[1];
      logger.info('uv 版本:', version);
      return { available: true, version };
    } catch (error) {
      logger.error('检查 uv 失败', error);
      return { available: false };
    }
  }

  /**
   * 检查 Python 是否已安装
   */
  async checkPythonInstalled(): Promise<{ installed: boolean; version?: string; path?: string }> {
    try {
      const pythonPath = this.getPythonPath();
      
      if (!fs.existsSync(pythonPath)) {
        return { installed: false };
      }

      const result = execSync(`"${pythonPath}" --version`, {
        encoding: 'utf-8',
        timeout: 5000
      }).trim();

      // 格式: "Python 3.12.x"
      const version = result.split(' ')[1];
      return { installed: true, version, path: pythonPath };
    } catch (error) {
      logger.error('检查 Python 失败', error);
      return { installed: false };
    }
  }

  /**
   * 获取完整环境状态
   */
  async getStatus(): Promise<PythonStatus> {
    const uvCheck = await this.checkUvAvailable();
    const pythonCheck = await this.checkPythonInstalled();
    const venvExists = fs.existsSync(this.venvDir);

    return {
      uvAvailable: uvCheck.available,
      uvVersion: uvCheck.version,
      pythonInstalled: pythonCheck.installed,
      pythonVersion: pythonCheck.version,
      pythonPath: pythonCheck.path,
      venvExists,
      venvPath: venvExists ? this.venvDir : undefined
    };
  }

  /**
   * 确保 Python 环境就绪（安装 Python + 创建 venv）
   */
  async ensurePython(onProgress?: ProgressCallback): Promise<void> {
    logger.info('开始确保 Python 环境就绪...');

    // 1. 检查 uv
    const uvCheck = await this.checkUvAvailable();
    if (!uvCheck.available) {
      throw new Error('uv 运行时不可用，请确保应用已正确安装');
    }

    // 2. 安装 Python（如果不存在）
    const pythonCheck = await this.checkPythonInstalled();
    if (!pythonCheck.installed) {
      await this.installPython(onProgress);
    } else {
      logger.info('Python 已安装:', pythonCheck.version);
      onProgress?.({
        stage: 'install',
        message: `Python ${pythonCheck.version} 已就绪`,
        percent: 100
      });
    }

    // 3. 创建虚拟环境（如果不存在）
    if (!fs.existsSync(this.venvDir)) {
      await this.createVenv(onProgress);
    } else {
      logger.info('虚拟环境已存在:', this.venvDir);
      onProgress?.({
        stage: 'venv',
        message: '虚拟环境已就绪',
        percent: 100
      });
    }

    this.initialized = true;
    logger.info('Python 环境初始化完成');
  }

  /**
   * 安装 Python
   */
  private async installPython(onProgress?: ProgressCallback): Promise<void> {
    logger.info(`开始安装 Python ${PYTHON_VERSION}...`);
    
    onProgress?.({
      stage: 'download',
      message: `正在下载 Python ${PYTHON_VERSION}...`,
      percent: 0
    });

    // 确保安装目录存在
    fs.mkdirSync(this.pythonInstallDir, { recursive: true });

    const env = {
      ...process.env,
      UV_PYTHON_INSTALL_DIR: this.pythonInstallDir
    };

    return new Promise((resolve, reject) => {
      const args = ['python', 'install', PYTHON_VERSION];
      logger.info('执行命令:', this.uvPath, args.join(' '));

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        logger.debug('[uv stdout]', text.trim());
        emitProgressLog(onProgress, 'install', text);
        
        // 解析进度（uv 会输出下载进度）
        if (text.includes('Downloading')) {
          onProgress?.({
            stage: 'download',
            message: '正在下载 Python...',
            percent: 30
          });
        } else if (text.includes('Installing')) {
          onProgress?.({
            stage: 'install',
            message: '正在安装 Python...',
            percent: 70
          });
        }
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        logger.debug('[uv stderr]', text.trim());
        emitProgressLog(onProgress, 'install', text);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info('Python 安装成功');
          onProgress?.({
            stage: 'install',
            message: 'Python 安装完成',
            percent: 100
          });
          resolve();
        } else {
          const error = new Error(`Python 安装失败 (code: ${code}): ${stderr}`);
          logger.error(error);
          reject(error);
        }
      });

      proc.on('error', (error) => {
        logger.error('Python 安装进程错误', error);
        reject(error);
      });
    });
  }

  /**
   * 创建虚拟环境
   */
  private async createVenv(onProgress?: ProgressCallback): Promise<void> {
    logger.info('创建虚拟环境:', this.venvDir);

    onProgress?.({
      stage: 'venv',
      message: '正在创建虚拟环境...',
      percent: 0
    });

    const env = {
      ...process.env,
      UV_PYTHON_INSTALL_DIR: this.pythonInstallDir
    };

    return new Promise((resolve, reject) => {
      const args = ['venv', this.venvDir, '--python', PYTHON_VERSION];
      logger.info('执行命令:', this.uvPath, args.join(' '));

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        emitProgressLog(onProgress, 'venv', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info('虚拟环境创建成功');
          onProgress?.({
            stage: 'venv',
            message: '虚拟环境创建完成',
            percent: 100
          });
          resolve();
        } else {
          const error = new Error(`虚拟环境创建失败 (code: ${code}): ${stderr}`);
          logger.error(error);
          reject(error);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 安装依赖包到全局虚拟环境
   */
  async installGlobalPackages(
    packages: string[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (!this.initialized) {
      await this.ensurePython(onProgress);
    }

    logger.info('安装全局依赖:', packages);

    onProgress?.({
      stage: 'deps',
      message: `正在安装: ${packages.join(', ')}`,
      percent: 0
    });

    const env = {
      ...process.env,
      VIRTUAL_ENV: this.venvDir
    };

    return new Promise((resolve, reject) => {
      // 添加 --verbose 确保在非 TTY 环境下也能输出详细进度
      const args = ['pip', 'install', '--verbose', ...packages];

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        logger.debug('[pip stdout]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        logger.debug('[pip stderr]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info('依赖安装成功');
          onProgress?.({
            stage: 'deps',
            message: '依赖安装完成',
            percent: 100
          });
          resolve();
        } else {
          const error = new Error(`依赖安装失败 (code: ${code}): ${stderr}`);
          logger.error(error);
          reject(error);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 安装依赖包到工具隔离目录
   */
  async installToolPackages(
    toolId: string,
    packages: string[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (!this.initialized) {
      await this.ensurePython(onProgress);
    }

    const targetDir = this.getToolPackagesDir(toolId);
    fs.mkdirSync(targetDir, { recursive: true });

    logger.info(`安装工具 ${toolId} 依赖到 ${targetDir}:`, packages);

    onProgress?.({
      stage: 'deps',
      message: `正在为工具 ${toolId} 安装: ${packages.join(', ')}`,
      percent: 0
    });

    const env = {
      ...process.env,
      VIRTUAL_ENV: this.venvDir
    };

    return new Promise((resolve, reject) => {
      // 添加 --verbose 确保在非 TTY 环境下也能输出详细进度
      const args = ['pip', 'install', '--verbose', '--target', targetDir, ...packages];

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        logger.debug('[pip stdout]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info('工具依赖安装成功');
          onProgress?.({
            stage: 'deps',
            message: '依赖安装完成',
            percent: 100
          });
          resolve();
        } else {
          const error = new Error(`工具依赖安装失败 (code: ${code}): ${stderr}`);
          logger.error(error);
          reject(error);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 从 requirements.txt 安装工具依赖
   */
  async installToolRequirements(
    toolId: string,
    requirementsPath: string,
    onProgress?: ProgressCallback
  ): Promise<void> {
    if (!this.initialized) {
      await this.ensurePython(onProgress);
    }

    const targetDir = this.getToolPackagesDir(toolId);
    fs.mkdirSync(targetDir, { recursive: true });

    logger.info(`从 ${requirementsPath} 安装工具 ${toolId} 依赖`);

    onProgress?.({
      stage: 'deps',
      message: '正在安装 requirements.txt 中的依赖...',
      percent: 0
    });

    const env = {
      ...process.env,
      VIRTUAL_ENV: this.venvDir
    };

    return new Promise((resolve, reject) => {
      // 添加 --verbose 确保在非 TTY 环境下也能输出详细进度
      const args = ['pip', 'install', '--verbose', '--target', targetDir, '-r', requirementsPath];

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        logger.debug('[pip stdout]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        logger.debug('[pip stderr]', text.trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          onProgress?.({
            stage: 'deps',
            message: 'requirements.txt 依赖安装完成',
            percent: 100
          });
          resolve();
        } else {
          reject(new Error(`依赖安装失败 (code: ${code}): ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 执行 Python 脚本（等待完成）
   */
  async runScript(
    scriptPath: string,
    args: string[] = [],
    options: RunScriptOptions = {}
  ): Promise<RunScriptResult> {
    if (!this.initialized) {
      await this.ensurePython();
    }

    const pythonPath = this.getPythonPath();
    logger.info('执行脚本:', scriptPath, args);

    return new Promise((resolve) => {
      // 构建 PYTHONPATH，包含工具依赖目录
      const pythonPathEnv = options.env?.PYTHONPATH || '';
      
      const env = {
        ...process.env,
        ...options.env,
        PYTHONPATH: pythonPathEnv,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      };

      const proc = spawn(pythonPath, [scriptPath, ...args], {
        cwd: options.cwd,
        env,
        windowsHide: true,
        timeout: options.timeout
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        options.onOutput?.(text, 'stdout');
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        options.onOutput?.(text, 'stderr');
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          code: null,
          stdout,
          stderr,
          error: error.message
        });
      });
    });
  }

  /**
   * 执行 Python 代码字符串
   */
  async runCode(
    code: string,
    options: RunScriptOptions = {}
  ): Promise<RunScriptResult> {
    if (!this.initialized) {
      await this.ensurePython();
    }

    const pythonPath = this.getPythonPath();
    logger.info('执行代码:', code.substring(0, 100) + '...');

    return new Promise((resolve) => {
      const env = {
        ...process.env,
        ...options.env,
        PYTHONIOENCODING: 'utf-8',
        PYTHONUNBUFFERED: '1'
      };

      const proc = spawn(pythonPath, ['-c', code], {
        cwd: options.cwd,
        env,
        windowsHide: true,
        timeout: options.timeout
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        options.onOutput?.(text, 'stdout');
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        options.onOutput?.(text, 'stderr');
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          code: null,
          stdout,
          stderr,
          error: error.message
        });
      });
    });
  }

  /**
   * 启动长时间运行的 Python 进程（返回进程实例）
   */
  spawnPython(
    scriptPath: string,
    args: string[] = [],
    options: RunScriptOptions = {}
  ): ChildProcess {
    const pythonPath = options.pythonPath ?? this.getPythonPath();
    
    const env = {
      ...process.env,
      ...options.env,
      ...(options.venvPath ? { VIRTUAL_ENV: options.venvPath } : {}),
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    };

    const proc = spawn(pythonPath, [scriptPath, ...args], {
      cwd: options.cwd,
      env,
      windowsHide: true
    });

    logger.info('启动 Python 进程:', scriptPath, 'PID:', proc.pid);

    return proc;
  }

  /**
   * 列出已安装的全局包
   */
  async listGlobalPackages(): Promise<string[]> {
    if (!this.initialized) {
      await this.ensurePython();
    }

    const env = {
      ...process.env,
      VIRTUAL_ENV: this.venvDir
    };

    try {
      const result = execSync(`"${this.uvPath}" pip list --format=freeze`, {
        encoding: 'utf-8',
        env,
        timeout: 30000
      });

      return result.trim().split('\n').filter(Boolean);
    } catch (error) {
      logger.error('列出包失败', error);
      return [];
    }
  }

  /**
   * 列出工具已安装的包
   */
  listToolPackages(toolId: string): string[] {
    const targetDir = this.getToolPackagesDir(toolId);

    if (!fs.existsSync(targetDir)) {
      return [];
    }

    // 读取 .dist-info 目录获取已安装包列表
    const items = fs.readdirSync(targetDir);
    const packages: string[] = [];

    for (const item of items) {
      if (item.endsWith('.dist-info')) {
        // 格式: package_name-version.dist-info
        const match = item.match(/^(.+?)-[\d.]+\.dist-info$/);
        if (match) {
          packages.push(match[1].replace(/_/g, '-'));
        }
      }
    }

    return packages;
  }

// ============================================================================
// 工具独立虚拟环境支持 (新增)
// ============================================================================

  private getToolEnvMetadataPath(toolId: string): string {
    return path.join(this.getToolEnvDir(toolId), 'meta.json');
  }

  private readToolEnvMetadata(toolId: string): ToolEnvMetadata | null {
    const metadataPath = this.getToolEnvMetadataPath(toolId);
    if (!fs.existsSync(metadataPath)) {
      return null;
    }
    try {
      const raw = fs.readFileSync(metadataPath, 'utf-8');
      return JSON.parse(raw) as ToolEnvMetadata;
    } catch (error) {
      logger.warn(`读取工具 ${toolId} 虚拟环境 metadata 失败`, error);
      return null;
    }
  }

  private writeToolEnvMetadata(toolId: string, metadata: ToolEnvMetadata): void {
    const metadataPath = this.getToolEnvMetadataPath(toolId);
    try {
      fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      logger.warn(`写入工具 ${toolId} 虚拟环境 metadata 失败`, error);
    }
  }

  private computeFileHash(filePath?: string): string | undefined {
    if (!filePath || !fs.existsSync(filePath)) {
      return undefined;
    }
    const fileBuffer = fs.readFileSync(filePath);
    return createHash('sha256').update(fileBuffer).digest('hex');
  }

  /**
   * 判断工具是否需要重新安装 requirements（新建环境或依赖变更）
   */
  needsToolRequirementsSetup(toolId: string, requirementsPath?: string): boolean {
    if (!requirementsPath || !fs.existsSync(requirementsPath)) {
      return false;
    }
    const hasEnv = this.hasToolEnv(toolId);
    if (!hasEnv) {
      return true;
    }
    const metadata = this.readToolEnvMetadata(toolId);
    if (!metadata) {
      return true;
    }
    if (metadata.pythonVersion && metadata.pythonVersion !== PYTHON_VERSION) {
      return true;
    }
    const requirementsHash = this.computeFileHash(requirementsPath);
    if (!requirementsHash) {
      return false;
    }
    return metadata.requirementsHash !== requirementsHash;
  }

  /**
   * 获取工具独立虚拟环境目录
   */
  getToolEnvDir(toolId: string): string {
    return path.join(this.toolEnvsDir, toolId);
  }

  /**
   * 获取工具独立虚拟环境的 Python 路径
   */
  getToolPythonPath(toolId: string): string {
    const envDir = this.getToolEnvDir(toolId);
    if (process.platform === 'win32') {
      return path.join(envDir, '.venv', 'Scripts', 'python.exe');
    } else {
      return path.join(envDir, '.venv', 'bin', 'python');
    }
  }

  /**
   * 检查工具是否有独立虚拟环境
   */
  hasToolEnv(toolId: string): boolean {
    const pythonPath = this.getToolPythonPath(toolId);
    return fs.existsSync(pythonPath);
  }

  /**
   * 为工具创建独立虚拟环境
   * @param toolId 工具 ID
   * @param requirementsPath requirements.txt 路径
   * @param onProgress 进度回调
   * @param indexUrl PyPI 镜像源 URL（可选）
   */
  async ensureToolEnv(
    toolId: string,
    requirementsPath?: string,
    onProgress?: ProgressCallback,
    indexUrl?: string
  ): Promise<string> {
    if (!this.initialized) {
      await this.ensurePython(onProgress);
    }

    const envDir = this.getToolEnvDir(toolId);
    const venvPath = path.join(envDir, '.venv');
    const pythonPath = this.getToolPythonPath(toolId);
    const resolvedRequirements =
      requirementsPath && fs.existsSync(requirementsPath) ? requirementsPath : undefined;
    if (requirementsPath && !resolvedRequirements) {
      logger.warn(`工具 ${toolId} 未找到 requirements 文件: ${requirementsPath}`);
    }

    const requirementsHash = this.computeFileHash(resolvedRequirements);
    const metadata = this.readToolEnvMetadata(toolId);
    let venvExists = fs.existsSync(pythonPath);
    const versionMismatch = metadata?.pythonVersion && metadata.pythonVersion !== PYTHON_VERSION;
    let recreated = false;

    if (!venvExists || versionMismatch) {
      if (venvExists && versionMismatch) {
        logger.info(`工具 ${toolId} 虚拟环境 Python 版本变更，重新创建`);
        fs.rmSync(envDir, { recursive: true, force: true });
      }

      logger.info(`为工具 ${toolId} 创建独立虚拟环境: ${venvPath}`);
      onProgress?.({
        stage: 'venv',
        message: `正在为工具 ${toolId} 创建虚拟环境...`,
        percent: 0
      });

      fs.mkdirSync(envDir, { recursive: true });

      const env = {
        ...process.env,
        UV_PYTHON_INSTALL_DIR: this.pythonInstallDir
      };

      await new Promise<void>((resolve, reject) => {
        const args = ['venv', venvPath, '--python', PYTHON_VERSION];
        logger.info('执行命令:', this.uvPath, args.join(' '));

        const proc = spawn(this.uvPath, args, {
          env,
          windowsHide: true
        });

        let stderr = '';

        proc.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        proc.on('close', (code) => {
          if (code === 0) {
            logger.info(`工具 ${toolId} 虚拟环境创建成功`);
            onProgress?.({
              stage: 'venv',
              message: '虚拟环境创建完成',
              percent: 50
            });
            resolve();
          } else {
            const error = new Error(`虚拟环境创建失败 (code: ${code}): ${stderr}`);
            logger.error(error);
            reject(error);
          }
        });

        proc.on('error', reject);
      });

      recreated = true;
    }

    if (resolvedRequirements) {
      const needsInstall =
        recreated ||
        !metadata ||
        metadata.requirementsHash !== requirementsHash ||
        metadata.pythonVersion !== PYTHON_VERSION;

      if (needsInstall && venvExists && !recreated) {
        logger.info(`工具 ${toolId} 依赖发生变化，删除旧虚拟环境重新安装`);
        try {
          fs.rmSync(envDir, { recursive: true, force: true });
        } catch (error) {
          logger.warn(`删除工具 ${toolId} 虚拟环境失败`, error);
        }
        return this.ensureToolEnv(toolId, resolvedRequirements, onProgress, indexUrl);
      }

      if (needsInstall) {
        await this.installToolEnvRequirements(toolId, resolvedRequirements, onProgress, indexUrl);
      } else {
        logger.info(`工具 ${toolId} requirements 未变化，跳过安装`);
      }
    }

    this.writeToolEnvMetadata(toolId, {
      pythonVersion: PYTHON_VERSION,
      requirementsHash,
      updatedAt: new Date().toISOString()
    });

    return venvPath;
  }

  /**
   * 在工具独立虚拟环境中安装依赖
   */
  async installToolEnvPackages(
    toolId: string,
    packages: string[],
    onProgress?: ProgressCallback
  ): Promise<void> {
    const venvPath = path.join(this.getToolEnvDir(toolId), '.venv');

    if (!fs.existsSync(venvPath)) {
      await this.ensureToolEnv(toolId, undefined, onProgress);
    }

    logger.info(`在工具 ${toolId} 虚拟环境中安装依赖:`, packages);

    onProgress?.({
      stage: 'deps',
      message: `正在安装: ${packages.join(', ')}`,
      percent: 0
    });

    const env = {
      ...process.env,
      VIRTUAL_ENV: venvPath
    };

    return new Promise((resolve, reject) => {
      // 添加 --verbose 确保在非 TTY 环境下也能输出详细进度
      const args = ['pip', 'install', '--verbose', ...packages];

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        logger.debug('[pip stdout]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        logger.debug('[pip stderr]', text.trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info(`工具 ${toolId} 依赖安装成功`);
          onProgress?.({
            stage: 'deps',
            message: '依赖安装完成',
            percent: 100
          });
          resolve();
        } else {
          const error = new Error(`依赖安装失败 (code: ${code}): ${stderr}`);
          logger.error(error);
          reject(error);
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 从 requirements.txt 安装依赖到工具独立虚拟环境
   * @param toolId 工具 ID
   * @param requirementsPath requirements.txt 路径
   * @param onProgress 进度回调
   * @param indexUrl PyPI 镜像源 URL（可选）
   */
  async installToolEnvRequirements(
    toolId: string,
    requirementsPath: string,
    onProgress?: ProgressCallback,
    indexUrl?: string
  ): Promise<void> {
    const venvPath = path.join(this.getToolEnvDir(toolId), '.venv');

    if (!fs.existsSync(venvPath)) {
      await this.ensureToolEnv(toolId, undefined, onProgress);
    }

    logger.info(`从 ${requirementsPath} 安装依赖到工具 ${toolId} 虚拟环境`);
    if (indexUrl) {
      logger.info(`使用镜像源: ${indexUrl}`);
    }

    onProgress?.({
      stage: 'deps',
      message: '正在安装 requirements.txt 中的依赖...',
      percent: 0
    });

    const env = {
      ...process.env,
      VIRTUAL_ENV: venvPath
    };

    return new Promise((resolve, reject) => {
      // 添加 --verbose 确保在非 TTY 环境下也能输出详细进度
      const args = ['pip', 'install', '--verbose', '-r', requirementsPath];
      // 如果指定了镜像源，添加 --index-url 参数
      if (indexUrl) {
        args.push('--index-url', indexUrl);
      }

      const proc = spawn(this.uvPath, args, {
        env,
        windowsHide: true
      });

      let stderr = '';

      proc.stdout.on('data', (data) => {
        logger.debug('[pip stdout]', data.toString().trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        logger.debug('[pip stderr]', text.trim());
        emitProgressLog(onProgress, 'deps', data);
      });

      proc.on('close', (code) => {
        if (code === 0) {
          logger.info(`工具 ${toolId} requirements.txt 依赖安装成功`);
          onProgress?.({
            stage: 'deps',
            message: 'requirements.txt 依赖安装完成',
            percent: 100
          });
          resolve();
        } else {
          reject(new Error(`依赖安装失败 (code: ${code}): ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  /**
   * 使用工具独立虚拟环境启动 Python 进程
   */
  spawnToolPython(
    toolId: string,
    scriptPath: string,
    args: string[] = [],
    options: RunScriptOptions = {}
  ): ChildProcess {
    const pythonPath = this.getToolPythonPath(toolId);

    // 如果工具没有独立环境，回退到全局环境
    const actualPythonPath = fs.existsSync(pythonPath)
      ? pythonPath
      : this.getPythonPath();

    const env = {
      ...process.env,
      ...options.env,
      PYTHONIOENCODING: 'utf-8',
      PYTHONUNBUFFERED: '1'
    };

    const proc = spawn(actualPythonPath, [scriptPath, ...args], {
      cwd: options.cwd,
      env,
      windowsHide: true
    });

    logger.info(`启动工具 ${toolId} Python 进程:`, scriptPath, 'PID:', proc.pid);

    return proc;
  }

  /**
   * 删除工具独立虚拟环境
   */
  async removeToolEnv(toolId: string): Promise<void> {
    const envDir = this.getToolEnvDir(toolId);

    if (fs.existsSync(envDir)) {
      logger.info(`删除工具 ${toolId} 虚拟环境: ${envDir}`);
      fs.rmSync(envDir, { recursive: true, force: true });
    }
  }

  /**
   * 列出所有工具虚拟环境
   */
  listToolEnvs(): string[] {
    if (!fs.existsSync(this.toolEnvsDir)) {
      return [];
    }

    return fs.readdirSync(this.toolEnvsDir).filter(name => {
      const envDir = path.join(this.toolEnvsDir, name, '.venv');
      return fs.existsSync(envDir);
    });
  }

  /**
   * 解析工具后端运行所需的 Python 环境（共享或独立）
   */
  async resolveBackendEnvironment(options: {
    toolId: string;
    toolPath: string;
    requirementsPath?: string;
  }): Promise<{ pythonPath: string; venvPath?: string; additionalPythonPaths: string[] }> {
    const { toolId, toolPath, requirementsPath } = options;
    let resolvedRequirements: string | undefined;
    if (requirementsPath) {
      resolvedRequirements = path.isAbsolute(requirementsPath)
        ? requirementsPath
        : path.join(toolPath, requirementsPath);
    }

    if (resolvedRequirements && fs.existsSync(resolvedRequirements)) {
      const venvPath = await this.ensureToolEnv(toolId, resolvedRequirements);
      return {
        pythonPath: this.getToolPythonPath(toolId),
        venvPath,
        additionalPythonPaths: []
      };
    }

    await this.ensurePython();
    const toolPackagesDir = this.getToolPackagesDir(toolId);
    fs.mkdirSync(toolPackagesDir, { recursive: true });
    return {
      pythonPath: this.getPythonPath(),
      venvPath: this.venvDir,
      additionalPythonPaths: [toolPackagesDir]
    };
  }

  // ============================================================================
  // SDK 路径管理
  // ============================================================================

  /**
   * 获取 Python SDK 路径
   */
  getPythonSdkPath(): string {
    if (app.isPackaged) {
      return path.join(process.resourcesPath, 'python-sdk');
    }
    // 开发模式：使用新的 sdks/python 目录
    const rootSdkPath = path.resolve(app.getAppPath(), '../../sdks/python');
    if (fs.existsSync(path.join(rootSdkPath, 'booltox_sdk.py'))) {
      return rootSdkPath;
    }
    // 备选：从 cwd 查找
    const cwdSdkPath = path.resolve(process.cwd(), 'sdks/python');
    if (fs.existsSync(path.join(cwdSdkPath, 'booltox_sdk.py'))) {
      return cwdSdkPath;
    }
    // 最后回退到 app resources
    return path.join(app.getAppPath(), 'resources', 'python-sdk');
  }
}

// 导出单例
export const pythonManager = new PythonManager();
