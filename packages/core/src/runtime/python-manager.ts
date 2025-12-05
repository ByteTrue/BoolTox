/**
 * Python 运行时管理器
 * 从 packages/client/electron/services/python-manager.service.ts 迁移
 * 去除 Electron API，使用纯 Node.js 实现
 */

import { spawn, execSync, type ChildProcess } from 'child_process';
import { createHash } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { EventEmitter } from 'eventemitter3';

/**
 * Python 环境状态
 */
export interface PythonStatus {
  uvAvailable: boolean;
  uvVersion?: string;
  pythonInstalled: boolean;
  pythonVersion?: string;
  pythonPath?: string;
  venvExists: boolean;
  venvPath?: string;
}

/**
 * 脚本执行选项
 */
export interface RunScriptOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  onOutput?: (data: string, type: 'stdout' | 'stderr') => void;
  pythonPath?: string;
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

/**
 * Python 管理器配置
 */
export interface PythonManagerConfig {
  /** 数据根目录（默认：~/.booltox） */
  dataDir?: string;
  /** uv 可执行文件路径 */
  uvPath?: string;
  /** Python 版本 */
  pythonVersion?: string;
}

/**
 * Python 运行时管理器
 */
export class PythonManager extends EventEmitter {
  private uvPath: string;
  private pythonInstallDir: string;
  private venvDir: string;
  private pluginEnvsDir: string;
  private pythonVersion: string;
  private initialized: boolean = false;

  constructor(config: PythonManagerConfig = {}) {
    super();

    // 默认配置
    const dataDir = config.dataDir || path.join(process.env.HOME || process.env.USERPROFILE || '/tmp', '.booltox');
    this.pythonVersion = config.pythonVersion || '3.12';

    // 路径配置
    this.pythonInstallDir = path.join(dataDir, 'python');
    this.venvDir = path.join(dataDir, 'venv');
    this.pluginEnvsDir = path.join(dataDir, 'plugin-envs');

    // uv 路径
    if (config.uvPath) {
      this.uvPath = config.uvPath;
    } else {
      // 尝试从系统 PATH 查找
      this.uvPath = this.findUvInPath() || 'uv';
    }
  }

  /**
   * 查找系统 PATH 中的 uv
   */
  private findUvInPath(): string | null {
    try {
      const which = process.platform === 'win32' ? 'where' : 'which';
      const result = execSync(`${which} uv`, { encoding: 'utf-8' });
      return result.trim().split('\n')[0];
    } catch {
      return null;
    }
  }

  /**
   * 初始化（确保目录存在）
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // 创建目录
    await fs.mkdir(this.pythonInstallDir, { recursive: true });
    await fs.mkdir(this.venvDir, { recursive: true });
    await fs.mkdir(this.pluginEnvsDir, { recursive: true });

    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * 获取 Python 状态
   */
  async getStatus(): Promise<PythonStatus> {
    await this.initialize();

    // 检查 uv
    let uvAvailable = false;
    let uvVersion: string | undefined;
    try {
      const result = execSync(`"${this.uvPath}" --version`, { encoding: 'utf-8' });
      uvAvailable = true;
      uvVersion = result.trim();
    } catch {
      uvAvailable = false;
    }

    // 检查 Python
    const pythonPath = path.join(this.pythonInstallDir, 'bin', 'python3');
    const pythonInstalled = existsSync(pythonPath);
    let pythonVersion: string | undefined;

    if (pythonInstalled) {
      try {
        pythonVersion = execSync(`"${pythonPath}" --version`, { encoding: 'utf-8' }).trim();
      } catch {}
    }

    // 检查虚拟环境
    const venvExists = existsSync(this.venvDir);

    return {
      uvAvailable,
      uvVersion,
      pythonInstalled,
      pythonVersion,
      pythonPath: pythonInstalled ? pythonPath : undefined,
      venvExists,
      venvPath: venvExists ? this.venvDir : undefined,
    };
  }

  /**
   * 确保 Python 环境可用
   */
  async ensurePython(onProgress?: (message: string) => void): Promise<void> {
    await this.initialize();

    const status = await this.getStatus();

    // 安装 uv
    if (!status.uvAvailable) {
      onProgress?.('正在安装 uv...');
      await this.installUv();
    }

    // 安装 Python
    if (!status.pythonInstalled) {
      onProgress?.(`正在安装 Python ${this.pythonVersion}...`);
      await this.installPython();
    }

    // 创建虚拟环境
    if (!status.venvExists) {
      onProgress?.('正在创建虚拟环境...');
      await this.createVenv();
    }

    onProgress?.('Python 环境准备完成');
  }

  /**
   * 安装 uv
   */
  private async installUv(): Promise<void> {
    // TODO: 实现 uv 安装
    throw new Error('uv installation not implemented yet');
  }

  /**
   * 安装 Python
   */
  private async installPython(): Promise<void> {
    try {
      execSync(`"${this.uvPath}" python install ${this.pythonVersion}`, {
        cwd: this.pythonInstallDir,
        stdio: 'inherit',
      });
      this.emit('python-installed', { version: this.pythonVersion });
    } catch (error) {
      throw new Error(`Failed to install Python: ${error}`);
    }
  }

  /**
   * 创建虚拟环境
   */
  private async createVenv(): Promise<void> {
    try {
      execSync(`"${this.uvPath}" venv "${this.venvDir}"`, {
        stdio: 'inherit',
      });
      this.emit('venv-created', { path: this.venvDir });
    } catch (error) {
      throw new Error(`Failed to create venv: ${error}`);
    }
  }

  /**
   * 为插件安装依赖
   */
  async installPluginRequirements(
    pluginId: string,
    requirementsPath: string,
    onProgress?: (message: string) => void
  ): Promise<void> {
    await this.ensurePython();

    const pluginVenvPath = path.join(this.pluginEnvsDir, pluginId);

    // 创建插件专用虚拟环境
    if (!existsSync(pluginVenvPath)) {
      onProgress?.('创建插件虚拟环境...');
      execSync(`"${this.uvPath}" venv "${pluginVenvPath}"`, { stdio: 'inherit' });
    }

    // 安装依赖
    onProgress?.('安装 Python 依赖...');
    execSync(
      `"${this.uvPath}" pip install -r "${requirementsPath}"`,
      {
        cwd: pluginVenvPath,
        stdio: 'inherit',
      }
    );

    // 保存元数据
    const requirementsHash = await this.hashFile(requirementsPath);
    const metadata: any = {
      pythonVersion: this.pythonVersion,
      requirementsHash,
      updatedAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(pluginVenvPath, '.booltox-metadata.json'),
      JSON.stringify(metadata, null, 2)
    );

    onProgress?.('依赖安装完成');
    this.emit('plugin-requirements-installed', { pluginId });
  }

  /**
   * 检查插件依赖是否需要更新
   */
  async needsPluginRequirementsSetup(
    pluginId: string,
    requirementsPath: string
  ): Promise<boolean> {
    const pluginVenvPath = path.join(this.pluginEnvsDir, pluginId);
    const metadataPath = path.join(pluginVenvPath, '.booltox-metadata.json');

    if (!existsSync(pluginVenvPath) || !existsSync(metadataPath)) {
      return true;
    }

    try {
      const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
      const currentHash = await this.hashFile(requirementsPath);
      return metadata.requirementsHash !== currentHash;
    } catch {
      return true;
    }
  }

  /**
   * 运行 Python 脚本
   */
  async runScript(scriptPath: string, args: string[] = [], options: RunScriptOptions = {}): Promise<RunScriptResult> {
    await this.ensurePython();

    const pythonPath = options.pythonPath || path.join(this.venvDir, 'bin', 'python3');

    return new Promise((resolve) => {
      const child = spawn(pythonPath, [scriptPath, ...args], {
        cwd: options.cwd,
        env: {
          ...process.env,
          ...options.env,
          VIRTUAL_ENV: options.venvPath || this.venvDir,
        },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        options.onOutput?.(text, 'stdout');
      });

      child.stderr?.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        options.onOutput?.(text, 'stderr');
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          code,
          stdout,
          stderr,
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          code: null,
          stdout,
          stderr,
          error: error.message,
        });
      });

      // 超时处理
      if (options.timeout) {
        setTimeout(() => {
          child.kill();
          resolve({
            success: false,
            code: null,
            stdout,
            stderr,
            error: 'Script execution timeout',
          });
        }, options.timeout);
      }
    });
  }

  /**
   * Spawn Python 进程（返回 ChildProcess）
   */
  spawnPython(scriptPath: string, args: string[] = [], options: RunScriptOptions = {}): ChildProcess {
    const pythonPath = options.pythonPath || path.join(this.venvDir, 'bin', 'python3');

    return spawn(pythonPath, [scriptPath, ...args], {
      cwd: options.cwd,
      env: {
        ...process.env,
        ...options.env,
        VIRTUAL_ENV: options.venvPath || this.venvDir,
      },
      stdio: 'pipe',
    });
  }

  /**
   * 获取插件 Python 环境信息
   */
  async resolveBackendEnvironment(config: {
    pluginId: string;
    pluginPath: string;
    requirementsPath?: string;
  }): Promise<{
    pythonPath: string;
    venvPath: string;
    additionalPythonPaths: string[];
  }> {
    const pluginVenvPath = path.join(this.pluginEnvsDir, config.pluginId);

    // 如果插件有依赖且需要安装
    if (config.requirementsPath) {
      const needsSetup = await this.needsPluginRequirementsSetup(
        config.pluginId,
        config.requirementsPath
      );
      if (needsSetup) {
        throw new Error('Plugin requirements not installed. Call installPluginRequirements first.');
      }
    }

    return {
      pythonPath: path.join(pluginVenvPath, 'bin', 'python3'),
      venvPath: pluginVenvPath,
      additionalPythonPaths: [pluginVenvPath],
    };
  }

  /**
   * 计算文件哈希
   */
  private async hashFile(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath);
    return createHash('sha256').update(content).digest('hex');
  }
}

/**
 * 创建 Python 管理器单例
 */
let _pythonManager: PythonManager | null = null;

export function getPythonManager(config?: PythonManagerConfig): PythonManager {
  if (!_pythonManager) {
    _pythonManager = new PythonManager(config);
  }
  return _pythonManager;
}
