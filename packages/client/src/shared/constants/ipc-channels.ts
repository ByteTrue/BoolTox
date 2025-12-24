/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * IPC 通道枚举
 * 命名规范：Domain_Action
 * 参考 Cherry Studio IpcChannel 设计
 */

export enum IpcChannel {
  // ==================== 窗口管理 ====================
  Window_Control = 'window:control',
  Window_CreateDetached = 'window:create-detached',
  Window_CloseDetached = 'window:close-detached',
  Window_MoveTab = 'window:move-tab',
  Window_GetMainWindowBounds = 'window:get-main-window-bounds',
  Window_GetAllWindowsBounds = 'window:get-all-windows-bounds',
  Window_GetCursorScreenPoint = 'window:get-cursor-screen-point',
  Window_GetDetachedBootState = 'window:get-detached-boot-state',
  Window_FocusWindow = 'window:focus-window',
  Window_RendererReady = 'window:renderer-ready', // 渲染进程准备就绪握手信号

  // ==================== 应用设置 ====================
  AppSettings_GetAutoLaunch = 'app-settings:get-auto-launch',
  AppSettings_SetAutoLaunch = 'app-settings:set-auto-launch',
  AppSettings_GetCloseToTray = 'app-settings:get-close-to-tray',
  AppSettings_SetCloseToTray = 'app-settings:set-close-to-tray',

  // ==================== 系统信息 ====================
  System_GetInfo = 'get-system-info',

  // ==================== 模块存储 ====================
  ModuleStore_GetAll = 'module-store:get-all',
  ModuleStore_Get = 'module-store:get',
  ModuleStore_Add = 'module-store:add',
  ModuleStore_Update = 'module-store:update',
  ModuleStore_Remove = 'module-store:remove',
  ModuleStore_GetCachePath = 'module-store:get-cache-path',
  ModuleStore_RemoveCache = 'module-store:remove-cache',
  ModuleStore_GetConfigPath = 'module-store:get-config-path',

  // ==================== Git 操作 ====================
  GitOps_GetConfig = 'git-ops:get-config',
  GitOps_UpdateConfig = 'git-ops:update-config',
  GitOps_GetAnnouncements = 'git-ops:get-announcements',
  GitOps_GetTools = 'git-ops:get-tools',

  // ==================== 工具源管理 ====================
  ToolSources_List = 'tool-sources:list',
  ToolSources_Add = 'tool-sources:add',
  ToolSources_Update = 'tool-sources:update',
  ToolSources_Delete = 'tool-sources:delete',
  ToolSources_Test = 'tool-sources:test',

  // ==================== 日志系统 ====================
  Logger_GetLogPath = 'logger:get-log-path',
  Logger_OpenLogFolder = 'logger:open-log-folder',
  App_LogToMain = 'app:log-to-main',

  // ==================== 工具管理 ====================
  Tool_GetAll = 'tool:get-all',
  Tool_Start = 'tool:start',
  Tool_Stop = 'tool:stop',
  Tool_Focus = 'tool:focus',
  Tool_Install = 'tool:install',
  Tool_Uninstall = 'tool:uninstall',
  Tool_CancelInstall = 'tool:cancel-install',
  Tool_CheckUpdates = 'tool:check-updates',
  Tool_Update = 'tool:update',
  Tool_UpdateAll = 'tool:update-all',
  Tool_AddLocalBinaryTool = 'tool:add-local-binary-tool',

  // ==================== 对话框 ====================
  Dialog_OpenFile = 'dialog:openFile',

  // ==================== Python 环境 ====================
  Python_Status = 'python:status',
  Python_Ensure = 'python:ensure',
  Python_InstallGlobal = 'python:install-global',
  Python_ListGlobal = 'python:list-global',
  Python_RunCode = 'python:run-code',
  Python_RunScript = 'python:run-script',

  // ==================== 自动更新 ====================
  AutoUpdate_Check = 'auto-update:check',
  AutoUpdate_Download = 'auto-update:download',
  AutoUpdate_GetStatus = 'auto-update:get-status',
  AutoUpdate_QuitAndInstall = 'auto-update:quit-and-install',

  // ==================== 渲染进程日志（已废弃，使用 App_LogToMain） ====================
  RendererConsoleLog = 'renderer:console-log',
}

// 兼容旧 API
export const IPC_CHANNELS = {
  RENDERER_CONSOLE_LOG: IpcChannel.RendererConsoleLog,
} as const;

// 类型定义
export type RendererConsoleLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

export interface RendererConsolePayload {
  level: RendererConsoleLevel;
  args: unknown[];
}
