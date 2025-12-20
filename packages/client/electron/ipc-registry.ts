/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * IPC 注册中心
 * 集中管理所有 IPC handlers
 * 参考 Cherry Studio ipc.ts 设计
 */

import { ipcMain, BrowserWindow, app, dialog } from 'electron';
import type { FileFilter, OpenDialogOptions } from 'electron';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import os from 'os';
import { IpcChannel } from '../src/shared/constants/ipc-channels.js';
import type { StoredModuleInfo } from '../src/shared/types/module-store.types.js';
import type { ToolRegistryEntry, ToolManifest, ToolSourceConfig, LocalToolRef } from '@booltox/shared';
import type { GitOpsConfig } from './services/git-ops.service.js';
import { GitOpsService, gitOpsService } from './services/git-ops.service.js';
import { moduleStoreService } from './services/module-store.service.js';
import { configService } from './services/config.service.js';
import { toolManager } from './services/tool/tool-manager.js';
import { toolRunner } from './services/tool/tool-runner.js';
import { toolInstaller } from './services/tool/tool-installer.js';
import { toolUpdater } from './services/tool/tool-updater.service.js';
import { pythonManager } from './services/python-manager.service.js';
import { getAllDisksInfo, formatOSName } from './utils/system-info.js';
import { getLogPath, openLogFolder } from './utils/logger.js';
import { createLogger } from './utils/logger.js';

const logger = createLogger('IPC');

// CPU 使用率计算
let previousCpuUsage = {
  idle: 0,
  total: 0,
};

function getCpuUsage(): number {
  const cpus = os.cpus();

  let idle = 0;
  let total = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      total += cpu.times[type as keyof typeof cpu.times];
    }
    idle += cpu.times.idle;
  }

  const idleDiff = idle - previousCpuUsage.idle;
  const totalDiff = total - previousCpuUsage.total;

  previousCpuUsage = { idle, total };

  if (totalDiff === 0) return 0;

  const usage = 100 - (100 * idleDiff / totalDiff);
  return Math.max(0, Math.min(100, Math.round(usage * 10) / 10));
}

/**
 * 扫描本地工具源，返回工具引用列表
 */
async function scanLocalToolSource(source: ToolSourceConfig): Promise<LocalToolRef[]> {
  if (!source.localPath) return [];

  const refs: LocalToolRef[] = [];

  // 尝试多工具模式（booltox-index.json）
  const indexPath = path.join(source.localPath, 'booltox-index.json');
  try {
    const indexContent = await fsPromises.readFile(indexPath, 'utf-8');
    const index = JSON.parse(indexContent) as { tools: Array<{ id: string; path: string }> };

    for (const tool of index.tools) {
      const toolPath = path.join(source.localPath, tool.path);
      const booltoxPath = path.join(toolPath, 'booltox.json');

      try {
        const booltoxContent = await fsPromises.readFile(booltoxPath, 'utf-8');
        const booltox = JSON.parse(booltoxContent) as { id: string };

        refs.push({
          id: booltox.id,
          path: toolPath,
          sourceId: source.id,
        });
      } catch (error) {
        logger.warn(`[IPC] Failed to read ${tool.path}/booltox.json:`, error);
      }
    }

    return refs;
  } catch {
    logger.debug(`[IPC] No booltox-index.json, trying single tool mode`);
  }

  // 尝试单工具模式（booltox.json）
  try {
    const booltoxPath = path.join(source.localPath, 'booltox.json');
    const booltoxContent = await fsPromises.readFile(booltoxPath, 'utf-8');
    const booltox = JSON.parse(booltoxContent) as { id: string };

    refs.push({
      id: booltox.id,
      path: source.localPath,
      sourceId: source.id,
    });

    return refs;
  } catch (error) {
    logger.error(`[IPC] Failed to read booltox.json from ${source.localPath}:`, error);
    return [];
  }
}

/**
 * 注册所有 IPC handlers
 * @param mainWindow - 主窗口引用（部分 handler 需要）
 */
export function registerAllIpcHandlers(mainWindow: BrowserWindow | null) {
  logger.info('注册所有 IPC handlers...');

  // ==================== 窗口管理 ====================
  ipcMain.handle(IpcChannel.Window_Control, (event, action: string) => {
    const senderWindow = BrowserWindow.fromWebContents(event.sender);
    if (!senderWindow) return;

    switch (action) {
      case 'minimize':
        senderWindow.minimize();
        break;
      case 'toggle-maximize':
        if (senderWindow.isMaximized()) {
          senderWindow.unmaximize();
        } else {
          senderWindow.maximize();
        }
        break;
      case 'close':
        senderWindow.close();
        break;
    }
  });

  // ==================== 应用设置 ====================
  ipcMain.handle(IpcChannel.AppSettings_GetAutoLaunch, () => {
    try {
      return app.getLoginItemSettings().openAtLogin;
    } catch (error) {
      logger.error('获取自动启动状态失败:', error);
      return false;
    }
  });

  ipcMain.handle(IpcChannel.AppSettings_SetAutoLaunch, (_event, enabled: boolean) => {
    try {
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: false,
      });
      logger.info(`自动启动 ${enabled ? '已启用' : '已禁用'}`);
      return { success: true };
    } catch (error) {
      logger.error('设置自动启动失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.AppSettings_GetCloseToTray, () => {
    try {
      const store = moduleStoreService.getStore();
      return store.get('settings.closeToTray', true) as boolean;
    } catch (error) {
      logger.error('获取关闭到托盘设置失败:', error);
      return true;
    }
  });

  ipcMain.handle(IpcChannel.AppSettings_SetCloseToTray, (_event, enabled: boolean) => {
    try {
      const store = moduleStoreService.getStore();
      store.set('settings.closeToTray', enabled);
      logger.info(`关闭到托盘 ${enabled ? '已启用' : '已禁用'}`);
      return { success: true };
    } catch (error) {
      logger.error('设置关闭到托盘失败:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== 系统信息 ====================
  ipcMain.handle(IpcChannel.System_GetInfo, async () => {
    try {
      const cpus = os.cpus();
      const disks = await getAllDisksInfo();
      const cpuUsage = getCpuUsage();

      return {
        os: {
          platform: os.platform(),
          release: os.release(),
          type: os.type(),
          name: formatOSName(),
          arch: os.arch(),
        },
        cpu: {
          model: cpus[0]?.model || 'Unknown',
          cores: cpus.length,
          speed: cpus[0]?.speed || 0,
          architecture: os.arch(),
          usage: cpuUsage,
        },
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
        },
        disks,
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error('获取系统信息失败:', error);
      return {
        os: { platform: 'unknown', release: '', type: '', name: 'Unknown', arch: '' },
        cpu: { model: 'Unknown', cores: 0, speed: 0, architecture: '', usage: 0 },
        memory: { total: 0, free: 0, used: 0 },
        disks: [],
        uptime: 0,
      };
    }
  });

  // ==================== 模块存储 ====================
  ipcMain.handle(IpcChannel.ModuleStore_GetAll, () => {
    try {
      return moduleStoreService.getInstalledModules();
    } catch (error) {
      logger.error('获取已安装模块失败:', error);
      return [];
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_Get, (_event, id: string) => {
    try {
      return moduleStoreService.getModuleInfo(id) || null;
    } catch (error) {
      logger.error('获取模块信息失败:', error);
      return null;
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_Add, (_event, info: StoredModuleInfo) => {
    try {
      moduleStoreService.addModule(info);
      return { success: true };
    } catch (error) {
      logger.error('添加模块失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_Update, (_event, id: string, partialInfo: Partial<StoredModuleInfo>) => {
    try {
      moduleStoreService.updateModuleInfo(id, partialInfo);
      return { success: true };
    } catch (error) {
      logger.error('更新模块信息失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_Remove, (_event, id: string) => {
    try {
      moduleStoreService.removeModule(id);
      return { success: true };
    } catch (error) {
      logger.error('删除模块失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_GetCachePath, (_event, moduleId: string) => {
    try {
      return moduleStoreService.getModuleCachePath(moduleId);
    } catch (error) {
      logger.error('获取缓存路径失败:', error);
      return null;
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_RemoveCache, (_event, moduleId: string) => {
    try {
      return moduleStoreService.removeModuleCache(moduleId);
    } catch (error) {
      logger.error('删除模块缓存失败:', error);
      return false;
    }
  });

  ipcMain.handle(IpcChannel.ModuleStore_GetConfigPath, () => {
    try {
      return moduleStoreService.getConfigPath();
    } catch (error) {
      logger.error('获取配置路径失败:', error);
      return null;
    }
  });

  // ==================== Git 操作 ====================
  ipcMain.handle(IpcChannel.GitOps_GetConfig, () => {
    return gitOpsService.getConfig();
  });

  ipcMain.handle(IpcChannel.GitOps_UpdateConfig, (_event, config: Partial<GitOpsConfig>) => {
    gitOpsService.updateConfig(config);
    return gitOpsService.getConfig();
  });

  ipcMain.handle(IpcChannel.GitOps_GetAnnouncements, async () => {
    return await gitOpsService.getAnnouncements();
  });

  ipcMain.handle(IpcChannel.GitOps_GetTools, async () => {
    return await gitOpsService.getPluginRegistry();
  });

  // ==================== 仓库管理 ====================
  ipcMain.handle(IpcChannel.ToolSources_List, () => {
    return configService.get('toolSources', 'sources');
  });

  ipcMain.handle(IpcChannel.ToolSources_Add, async (_event, repo: Omit<ToolSourceConfig, 'id'>) => {
    const config = configService.get('toolSources');
    const newRepo: ToolSourceConfig = {
      ...repo,
      id: crypto.randomUUID(),
    };
    config.sources.push(newRepo);

    // 如果是本地工具源，扫描工具并保存引用
    if (newRepo.type === 'local' && newRepo.localPath) {
      try {
        // 确保 localToolRefs 已初始化
        if (!config.localToolRefs) {
          config.localToolRefs = [];
        }

        const newRefs = await scanLocalToolSource(newRepo);
        config.localToolRefs.push(...newRefs);
        logger.info(`[IPC] Added ${newRefs.length} local tool references from ${newRepo.name}`);
      } catch (error) {
        logger.error(`[IPC] Failed to scan local tool source:`, error);
      }
    }

    configService.set('toolSources', config);
    logger.info(`[IPC] Added tool source: ${newRepo.id}`);

    // 清除缓存，强制重新加载工具列表
    gitOpsService['cache']?.clear();

    // 刷新 ToolManager
    await toolManager.loadTools();

    return newRepo;
  });

  ipcMain.handle(IpcChannel.ToolSources_Update, async (_event, id: string, updates: Partial<ToolSourceConfig>) => {
    const config = configService.get('toolSources');
    const index = config.sources.findIndex(r => r.id === id);

    if (index < 0) {
      throw new Error(`仓库 ${id} 不存在`);
    }

    config.sources[index] = { ...config.sources[index], ...updates };
    configService.set('toolSources', config);
    logger.info(`[IPC] Updated tool source: ${config.sources[index].name}`);

    // 清除缓存
    gitOpsService['cache']?.clear();

    // 刷新 ToolManager
    await toolManager.loadTools();

    return config.sources[index];
  });

  ipcMain.handle(IpcChannel.ToolSources_Delete, async (_event, id: string) => {
    if (id === 'official') {
      throw new Error('官方仓库不能删除');
    }

    const config = configService.get('toolSources');

    // 删除工具源
    config.sources = config.sources.filter(r => r.id !== id);

    // 删除该工具源的所有本地工具引用
    config.localToolRefs = config.localToolRefs.filter(ref => ref.sourceId !== id);

    configService.set('toolSources', config);
    logger.info(`[IPC] Deleted tool source: ${id}`);

    // 清除缓存
    gitOpsService['cache']?.clear();

    // 刷新 ToolManager
    await toolManager.loadTools();
  });

  ipcMain.handle(IpcChannel.ToolSources_Test, async (_event, repo: ToolSourceConfig) => {
    try {
      logger.info(`[IPC] Testing repository connection: ${repo.name}`);
      const gitOps = new GitOpsService();
      gitOps.updateConfig(repo);

      const registry = await gitOps.getPluginRegistry();

      return {
        success: true,
        pluginCount: registry.plugins.length,
        plugins: registry.plugins.slice(0, 5).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })),
      };
    } catch (error) {
      logger.error(`[IPC] Failed to test repository ${repo.name}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // ==================== 日志系统 ====================
  ipcMain.handle(IpcChannel.Logger_GetLogPath, () => {
    return getLogPath();
  });

  ipcMain.handle(IpcChannel.Logger_OpenLogFolder, async () => {
    await openLogFolder();
    return { success: true };
  });

  // App_LogToMain 已在 LoggerService 中注册

  // ==================== 工具管理 ====================
  ipcMain.handle(IpcChannel.Tool_GetAll, () => {
    return toolManager.getAllTools();
  });

  ipcMain.handle(IpcChannel.Tool_Start, async (_event, id: string) => {
    if (!mainWindow) throw new Error('主窗口未找到');
    return await toolRunner.startTool(id, mainWindow);
  });

  ipcMain.handle(IpcChannel.Tool_Stop, (_event, id: string) => {
    if (!mainWindow) return;
    toolRunner.stopTool(id, mainWindow);
  });

  ipcMain.handle(IpcChannel.Tool_Focus, (_event, id: string) => {
    toolRunner.focusTool(id);
  });

  ipcMain.handle(IpcChannel.Tool_Install, async (_event, entry: ToolRegistryEntry) => {
    try {
      const toolDir = await toolInstaller.installTool(
        entry,
        (progress) => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('tool:install-progress', progress);
          }
        },
        mainWindow || undefined
      );

      await toolManager.loadTools();

      return { success: true, path: toolDir };
    } catch (error) {
      logger.error('工具安装失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(IpcChannel.Tool_Uninstall, async (_event, pluginId: string) => {
    try {
      if (mainWindow) {
        toolRunner.stopTool(pluginId, mainWindow);
      }

      await toolInstaller.uninstallTool(pluginId);
      await toolManager.loadTools();

      return { success: true };
    } catch (error) {
      logger.error('工具卸载失败:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(IpcChannel.Tool_CancelInstall, (_event, pluginId: string) => {
    toolInstaller.cancelDownload(pluginId);
    return { success: true };
  });

  ipcMain.handle(IpcChannel.Tool_CheckUpdates, async () => {
    try {
      const updates = await toolUpdater.checkUpdates();
      return { success: true, updates };
    } catch (error) {
      logger.error('检查更新失败:', error);
      return { success: false, error: String(error), updates: [] };
    }
  });

  ipcMain.handle(IpcChannel.Tool_Update, async (_event, toolId: string) => {
    try {
      await toolUpdater.updateTool(toolId);
      await toolManager.loadTools();
      return { success: true };
    } catch (error) {
      logger.error(`更新工具 ${toolId} 失败:`, error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.Tool_UpdateAll, async (_event, toolIds: string[]) => {
    try {
      const result = await toolUpdater.updateAllTools(toolIds);
      await toolManager.loadTools();
      return { success: true, updated: result.success, failed: result.failed };
    } catch (error) {
      logger.error('批量更新工具失败:', error);
      return { success: false, updated: [], failed: [], error: String(error) };
    }
  });

  ipcMain.handle(
    IpcChannel.Tool_AddLocalBinaryTool,
    async (_event, params: { name: string; exePath: string; description?: string; args?: string[] }) => {
      try {
        const { name, exePath, description, args } = params;

        // 验证文件存在
        if (!fs.existsSync(exePath)) {
          throw new Error('文件不存在');
        }

        // 生成工具 ID
        const baseName = path.basename(exePath, path.extname(exePath));
        const id = `local.${baseName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}`;

        // 创建工具目录
        const pluginsDir = path.join(app.getPath('userData'), 'plugins');
        const toolDir = path.join(pluginsDir, id);
        await fs.promises.mkdir(toolDir, { recursive: true });

        // 生成 booltox.json
        const manifest: ToolManifest = {
          id,
          version: '1.0.0',
          name,
          description: description ?? `本地工具：${name}`,
          protocol: '^2.0.0',
          runtime: {
            type: 'binary',
            command: exePath,
            localExecutablePath: exePath,
            args: args ?? [],
          },
        };

        // 写入 manifest
        await fs.promises.writeFile(
          path.join(toolDir, 'booltox.json'),
          JSON.stringify(manifest, null, 2)
        );

        // 重新加载工具列表
        await toolManager.loadTools();

        return { success: true, id, path: toolDir };
      } catch (error) {
        logger.error('添加本地工具失败:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  // ==================== 对话框 ====================
  ipcMain.handle(IpcChannel.Dialog_OpenFile, async (_event, options?: OpenDialogOptions) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', ...(options?.properties || [])],
      filters: options?.filters as FileFilter[] | undefined,
      defaultPath: options?.defaultPath,
    });

    return result.filePaths[0] || null;
  });

  // ==================== 文件系统（工具配置）====================

  /**
   * 检测工具配置文件
   * 检查目录中是否存在 booltox.json 或 booltox-index.json
   */
  ipcMain.handle('fs:detectToolConfig', async (_event, localPath: string) => {
    try {
      const booltoxPath = path.join(localPath, 'booltox.json');
      const indexPath = path.join(localPath, 'booltox-index.json');

      const [hasBooltoxJson, hasBooltoxIndex] = await Promise.all([
        fsPromises.access(booltoxPath).then(() => true).catch(() => false),
        fsPromises.access(indexPath).then(() => true).catch(() => false),
      ]);

      let booltoxData = null;
      let indexData = null;

      if (hasBooltoxJson) {
        try {
          const content = await fsPromises.readFile(booltoxPath, 'utf-8');
          booltoxData = JSON.parse(content);
        } catch (error) {
          logger.warn(`Failed to parse booltox.json: ${error}`);
        }
      }

      if (hasBooltoxIndex) {
        try {
          const content = await fsPromises.readFile(indexPath, 'utf-8');
          indexData = JSON.parse(content);
        } catch (error) {
          logger.warn(`Failed to parse booltox-index.json: ${error}`);
        }
      }

      return {
        hasBooltoxJson,
        hasBooltoxIndex,
        booltoxData,
        indexData,
      };
    } catch (error) {
      logger.error('Failed to detect tool config:', error);
      return {
        hasBooltoxJson: false,
        hasBooltoxIndex: false,
      };
    }
  });

  /**
   * 写入工具配置文件（booltox.json）
   */
  ipcMain.handle('fs:writeToolConfig', async (_event, localPath: string, config: unknown) => {
    try {
      const configPath = path.join(localPath, 'booltox.json');
      await fsPromises.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      logger.info(`Generated booltox.json at: ${configPath}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to write tool config:', error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  });

  /**
   * 写入工具索引文件（booltox-index.json）
   */
  ipcMain.handle('fs:writeToolIndex', async (_event, localPath: string, indexData: { tools: Array<{ id: string; path: string }> }) => {
    try {
      const indexPath = path.join(localPath, 'booltox-index.json');
      await fsPromises.writeFile(indexPath, JSON.stringify(indexData, null, 2), 'utf-8');
      logger.info(`Generated booltox-index.json at: ${indexPath}`);
      return { success: true };
    } catch (error) {
      logger.error('Failed to write tool index:', error);
      throw new Error(error instanceof Error ? error.message : String(error));
    }
  });

  // ==================== Python 环境 ====================
  ipcMain.handle(IpcChannel.Python_Status, async () => {
    try {
      return await pythonManager.getStatus();
    } catch (error) {
      logger.error('获取 Python 状态失败:', error);
      return {
        installed: false,
        version: null,
        executablePath: null,
      };
    }
  });

  ipcMain.handle(IpcChannel.Python_Ensure, async () => {
    try {
      await pythonManager.ensurePython();
      return { success: true };
    } catch (error) {
      logger.error('确保 Python 环境失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.Python_InstallGlobal, async (_event, packages: string[]) => {
    try {
      await pythonManager.installGlobalPackages(packages);
      return { success: true };
    } catch (error) {
      logger.error('安装全局 Python 包失败:', error);
      return { success: false, error: String(error) };
    }
  });

  ipcMain.handle(IpcChannel.Python_ListGlobal, async () => {
    try {
      return await pythonManager.listGlobalPackages();
    } catch (error) {
      logger.error('列出全局 Python 包失败:', error);
      return [];
    }
  });

  ipcMain.handle(IpcChannel.Python_RunCode, async (_event, code: string, options?: { cwd?: string; timeout?: number }) => {
    try {
      return await pythonManager.runCode(code, options);
    } catch (error) {
      logger.error('运行 Python 代码失败:', error);
      return {
        success: false,
        error: String(error),
        stdout: '',
        stderr: error instanceof Error ? error.message : String(error),
      };
    }
  });

  ipcMain.handle(
    IpcChannel.Python_RunScript,
    async (_event, scriptPath: string, args?: string[], options?: { cwd?: string; timeout?: number }) => {
      try {
        return await pythonManager.runScript(scriptPath, args, options);
      } catch (error) {
        logger.error('运行 Python 脚本失败:', error);
        return {
          success: false,
          error: String(error),
          stdout: '',
          stderr: error instanceof Error ? error.message : String(error),
        };
      }
    }
  );

  logger.info(`已注册 ${Object.keys(IpcChannel).length} 个 IPC handlers`);
}
