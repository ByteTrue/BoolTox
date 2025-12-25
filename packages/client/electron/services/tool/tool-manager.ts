/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import fsSync from 'fs';
import { BOOLTOX_PROTOCOL_VERSION, ToolManifest, ToolRuntime, ToolRuntimeConfig } from '@booltox/shared';
import { createLogger } from '../../utils/logger.js';
import { inferManifest, validateSimplifiedManifest } from './manifest-infer.service.js';
import { configService } from '../config.service.js';

const logger = createLogger('ToolManager');
const DEFAULT_PROTOCOL_RANGE = '^1.0.0';

export class ToolManager {
  private tools: Map<string, ToolRuntime> = new Map();
  private toolsDir: string;
  private devToolsDir?: string;

  constructor() {
    // Use userData/tools for installed tools
    this.toolsDir = path.join(app.getPath('userData'), 'tools');
    
    // 只在开发模式下加载开发目录的工具
    // 使用 app.isPackaged 判断更可靠,打包后为 true,开发时为 false
    if (!app.isPackaged) {
      this.devToolsDir = this.resolveDevToolsDir();
      if (this.devToolsDir) {
        logger.info(`[ToolManager] Dev tools dir resolved: ${this.devToolsDir}`);
      } else {
        logger.warn('[ToolManager] Dev tools dir not found, will only load installed tools');
      }
    }
  }

  async init() {
    logger.info(`[ToolManager] Initializing... Tools dir: ${this.toolsDir}`);
    if (this.devToolsDir) {
      logger.info(`[ToolManager] Dev tools dir: ${this.devToolsDir}`);
    }
    
    await this.ensureToolsDir();
    await this.loadTools();
  }

  private async ensureToolsDir() {
    try {
      await fs.access(this.toolsDir);
    } catch {
      await fs.mkdir(this.toolsDir, { recursive: true });
    }
  }

  async loadTools() {
    this.tools.clear();

    // 1. Load from userData (远程安装的工具)
    await this.scanDir(this.toolsDir, false);

    // 2. Load from dev dir (标记为 dev)
    if (this.devToolsDir) {
      await this.scanDir(this.devToolsDir, true);
    }

    // 3. Load from local tool references (本地工具源的工具，从配置恢复)
    await this.loadLocalToolReferences();

    // 开发模式：扫描 examples/ 目录
    if (!app.isPackaged) {
      const examplesDir = path.resolve(process.cwd(), 'examples');

      logger.info(`[ToolManager] Dev mode - checking examples directory:`);
      logger.info(`[ToolManager]   examplesDir: ${examplesDir}, exists: ${fsSync.existsSync(examplesDir)}`);

      // 扫描示例工具
      if (fsSync.existsSync(examplesDir) && examplesDir !== this.devToolsDir) {
        logger.info(`[ToolManager] Scanning examples dir: ${examplesDir}`);
        await this.scanDir(examplesDir, true);
      }
    }

    logger.info(`[ToolManager] Loaded ${this.tools.size} tools.`);
  }

  /**
   * 从配置中加载本地工具引用
   */
  private async loadLocalToolReferences() {
    try {
      const config = configService.get('toolSources');
      const localRefs = config.localToolRefs || [];

      for (const ref of localRefs) {
        try {
          // 检查路径是否仍然存在
          if (!fsSync.existsSync(ref.path)) {
            logger.warn(`[ToolManager] Local tool path not found: ${ref.path}, skipping`);
            continue;
          }

          await this.loadToolFromPath(ref.path, false);
          logger.info(`[ToolManager] Loaded local tool: ${ref.id} from ${ref.path}`);
        } catch (error) {
          logger.warn(`[ToolManager] Failed to load local tool ${ref.id}:`, error);
        }
      }

      logger.info(`[ToolManager] Loaded ${localRefs.length} local tool references`);
    } catch (error) {
      logger.error('[ToolManager] Failed to load local tool references:', error);
    }
  }

  private async scanDir(dir: string, isDev = false) {
    try {
      // Check if dir exists first
      try {
        await fs.access(dir);
      } catch {
        return;
      }

      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        // 跳过scripts等非工具目录
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'scripts' && entry.name !== 'node_modules') {
          await this.loadToolFromPath(path.join(dir, entry.name), isDev);
        }
      }
    } catch (error) {
      logger.error(`[ToolManager] Failed to scan tools directory ${dir}:`, error);
    }
  }

  async loadToolFromPath(toolPath: string, isDev = false) {
    try {
      const manifestPath = path.join(toolPath, 'booltox.json');
      const manifestContent = await fs.readFile(manifestPath, 'utf-8');
      const rawManifest = JSON.parse(manifestContent) as ToolManifest;

      // 验证简化配置
      const validation = validateSimplifiedManifest(rawManifest);
      if (!validation.valid) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}:`);
        validation.errors.forEach(err => {
          logger.error(`  ✗ ${err.message}`);
          if (err.field && err.field !== 'unknown') {
            logger.error(`    字段: ${err.field}`);
          }
          if (err.suggestedFix) {
            logger.info(`    💡 建议: ${err.suggestedFix}`);
          }
        });
        return;
      }

      // 推断完整配置（如果使用简化配置）
      const inferredManifest = inferManifest(rawManifest, toolPath);

      // 标准化 manifest
      const manifest = this.normalizeManifest(inferredManifest, toolPath);

      if (!manifest) {
        return;
      }

      // Basic validation
      if (!manifest.id) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}: Missing id`);
        return;
      }

      const runtime: ToolRuntime = {
        id: manifest.id,
        manifest,
        path: toolPath,
        status: 'stopped',
        isDev,
      };

      this.tools.set(manifest.id, runtime);
      logger.info(`[ToolManager] Loaded tool: ${manifest.name} (${manifest.id})${isDev ? ' [DEV]' : ''}`);
    } catch (error) {
      logger.error(`[ToolManager] Failed to load tool at ${toolPath}:`, error);
    }
  }

  getAllTools(): ToolRuntime[] {
    return Array.from(this.tools.values());
  }

  getTool(id: string): ToolRuntime | undefined {
    return this.tools.get(id);
  }
  
  getToolsDir(): string {
    return this.toolsDir;
  }

  private normalizeManifest(manifest: ToolManifest, toolPath: string): ToolManifest | null {
    const normalizedPermissions = manifest.permissions ?? [];
    const protocolRange = manifest.protocol ?? DEFAULT_PROTOCOL_RANGE;

    if (!this.satisfiesProtocol(protocolRange, BOOLTOX_PROTOCOL_VERSION)) {
      logger.error(
        `[ToolManager] 工具 ${manifest.id ?? toolPath} 需要协议版本 ${protocolRange}，但当前版本是 ${BOOLTOX_PROTOCOL_VERSION}`,
      );
      return null;
    }

    const runtime = this.resolveRuntimeConfig(manifest, toolPath);
    if (!runtime) {
      return null;
    }

    const normalizedMain =
      runtime.type === 'standalone'
        ? manifest.main ?? runtime.entry
        : runtime.type === 'binary'
          ? runtime.command
          : runtime.type === 'http-service'
            ? undefined // http-service 不需要 main entry
            : undefined; // 不再支持 webview

    return {
      ...manifest,
      permissions: normalizedPermissions,
      protocol: protocolRange,
      main: normalizedMain,
      runtime,
    };
  }

  private satisfiesProtocol(range: string, version: string): boolean {
    if (!range) {
      return true;
    }

    const compare = (a: string, b: string): number => {
      const parse = (input: string) => {
        const core = input.split('-')[0];
        const parts = core.split('.').map((part) => Number.parseInt(part, 10));
        if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
          return null;
        }
        return { major: parts[0], minor: parts[1], patch: parts[2] };
      };

      const left = parse(a);
      const right = parse(b);
      if (!left || !right) {
        return 0;
      }

      if (left.major !== right.major) return left.major - right.major;
      if (left.minor !== right.minor) return left.minor - right.minor;
      if (left.patch !== right.patch) return left.patch - right.patch;
      return 0;
    };

    if (range.startsWith('^')) {
      const base = range.slice(1);
      const baseParts = base.split('-')[0].split('.');
      const versionParts = version.split('-')[0].split('.');
      if (baseParts[0] !== versionParts[0]) {
        return false;
      }
      return compare(version, base) >= 0;
    }

    if (range.startsWith('>=')) {
      const base = range.slice(2);
      return compare(version, base) >= 0;
    }

    if (range.startsWith('=')) {
      const target = range.slice(1);
      return compare(version, target) === 0;
    }

    return compare(version, range) === 0;
  }

  private resolveRuntimeConfig(manifest: ToolManifest, toolPath: string): ToolRuntimeConfig | null {
    const runtime = manifest.runtime;

    if (runtime && runtime.type === 'standalone') {
      if (!runtime.entry) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}: standalone runtime missing entry`);
        return null;
      }
      return {
        type: 'standalone',
        entry: runtime.entry,
        args: runtime.args,
        env: runtime.env,
        requirements: runtime.requirements,
      };
    }

    // 处理二进制工具
    if (runtime && runtime.type === 'binary') {
      if (!runtime.command) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}: binary runtime missing command`);
        return null;
      }
      return {
        type: 'binary',
        command: runtime.command,
        args: runtime.args,
        env: runtime.env,
        cwd: runtime.cwd,
        localExecutablePath: runtime.localExecutablePath,
      };
    }

    // 处理 HTTP 服务工具
    if (runtime && runtime.type === 'http-service') {
      if (!runtime.backend || !runtime.backend.port) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}: http-service runtime missing backend.port`);
        return null;
      }
      return {
        type: 'http-service',
        backend: runtime.backend,
        path: runtime.path,
        readyTimeout: runtime.readyTimeout,
      };
    }

    // 处理 CLI 工具
    if (runtime && runtime.type === 'cli') {
      if (!runtime.backend || !runtime.backend.entry) {
        logger.error(`[ToolManager] Invalid manifest at ${toolPath}: cli runtime missing backend.entry`);
        return null;
      }
      return {
        type: 'cli',
        backend: runtime.backend,
        cwd: runtime.cwd,
        title: runtime.title,
        keepOpen: runtime.keepOpen,
      };
    }

    // 不再支持 webview 类型
    logger.error(`[ToolManager] Invalid manifest at ${toolPath}: Unsupported runtime type. Only standalone, binary, http-service, and cli are supported.`);
    return null;
  }

  private resolveDevToolsDir(): string | undefined {
    if (app.isPackaged) {
      return undefined;
    }

    const override = process.env.BOOLTOX_DEV_TOOLS_DIR;
    if (override && fsSync.existsSync(override)) {
      return override;
    }

    const candidates = [
      path.resolve(process.cwd(), 'examples'),
      path.resolve(process.cwd(), 'tools'),
      path.resolve(app.getAppPath(), 'examples'),
      path.resolve(app.getAppPath(), '../examples'),
      path.resolve(app.getAppPath(), '../tools'),
    ];

    for (const dir of candidates) {
      if (fsSync.existsSync(dir)) {
        return dir;
      }
    }

    // 最后兜底返回默认路径（即使不存在，也让 scanDir 尝试一次）
    return candidates[0];
  }
}

export const toolManager = new ToolManager();
