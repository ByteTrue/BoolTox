/**
 * Host API 参数类型定义
 * 消除 any 类型，提供完整的类型安全喵～
 * 
 * 用于替换 api-handlers.ts 中的 any 类型参数
 */

type FileEncoding = NodeJS.BufferEncoding;
type NodePlatform = NodeJS.Platform;

// === 系统信息 ===

export interface SystemInfo {
  platform: NodePlatform;
  version: string;
  arch: string;
  hostname: string;
  uptime: number;
  totalMemory: number;
  freeMemory: number;
  cpuCount: number;
  userInfo?: {
    username: string;
    homedir: string;
  };
}

// === Toast 通知 ===

export interface ToastParams {
  message: string;
  duration?: number;
  type?: 'info' | 'success' | 'warning' | 'error';
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  closable?: boolean;
}

// === 系统通知 ===

export interface NotificationParams {
  title: string;
  body: string;
  icon?: string;
  silent?: boolean;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationResult {
  id: string;
  clicked: boolean;
  actionClicked?: string;
}

// === 模态框 ===

export interface ModalParams {
  title: string;
  content: string;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  width?: number | string;
  customClass?: string;
}

export interface ModalResult {
  confirmed: boolean;
  cancelled: boolean;
  inputValue?: string;
}

// === 存储操作 ===

export interface StorageGetParams {
  key: string;
  defaultValue?: unknown;
}

export interface StorageGetResult<T = unknown> {
  value: T | null;
  exists: boolean;
}

export interface StorageSetParams {
  key: string;
  value: unknown;
  ttl?: number; // 过期时间（毫秒）
}

export interface StorageRemoveParams {
  key: string;
}

export interface StorageListParams {
  prefix?: string;
  limit?: number;
  offset?: number;
}

export interface StorageListResult {
  keys: string[];
  total: number;
  hasMore: boolean;
}

// === 剪贴板操作 ===

export interface ClipboardReadResult {
  text: string;
  html?: string;
  rtf?: string;
  image?: {
    dataUrl: string;
    width: number;
    height: number;
  };
}

export interface ClipboardWriteParams {
  text?: string;
  html?: string;
  rtf?: string;
  image?: string; // Base64 data URL
}

export interface ClipboardWriteResult {
  success: boolean;
  error?: string;
}

// === 文件操作 ===

export interface FileReadParams {
  path: string;
  encoding?: FileEncoding;
  maxSize?: number; // 最大文件大小（字节）
}

export interface FileReadResult {
  content: string | ArrayBuffer;
  size: number;
  encoding: FileEncoding | 'binary';
  mimeType?: string;
}

export interface FileWriteParams {
  path: string;
  content: string | ArrayBuffer;
  encoding?: FileEncoding;
  append?: boolean;
  createDirectory?: boolean;
}

export interface FileWriteResult {
  success: boolean;
  bytesWritten: number;
  path: string;
}

export interface FileListParams {
  path: string;
  recursive?: boolean;
  filter?: {
    extensions?: string[];
    pattern?: string;
    excludeHidden?: boolean;
  };
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  isDirectory: boolean;
  isFile: boolean;
  createdAt: number;
  modifiedAt: number;
  extension?: string;
  mimeType?: string;
}

export interface FileListResult {
  files: FileInfo[];
  directories: FileInfo[];
  total: number;
}

// === 网络请求 ===

export interface NetworkRequestParams {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: string | Record<string, unknown> | FormData;
  timeout?: number;
  credentials?: 'include' | 'omit' | 'same-origin';
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer';
}

export interface NetworkRequestResult<T = unknown> {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: T;
  ok: boolean;
  redirected: boolean;
  url: string;
}

// === 对话框 ===

export interface DialogOpenParams {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
  properties?: Array<
    | 'openFile'
    | 'openDirectory'
    | 'multiSelections'
    | 'showHiddenFiles'
    | 'createDirectory'
  >;
}

export interface DialogSaveParams {
  title?: string;
  defaultPath?: string;
  buttonLabel?: string;
  filters?: Array<{
    name: string;
    extensions: string[];
  }>;
}

export interface DialogOpenResult {
  canceled: boolean;
  filePaths: string[];
}

export interface DialogSaveResult {
  canceled: boolean;
  filePath?: string;
}

// === 主题 ===

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface ThemeParams {
  mode: ThemeMode;
}

export interface ThemeResult {
  mode: ThemeMode;
  systemTheme: 'light' | 'dark';
  currentTheme: 'light' | 'dark';
}

// === 导航 ===

export interface NavigateParams {
  path: string;
  query?: Record<string, string>;
  state?: Record<string, unknown>;
  replace?: boolean;
}

export interface NavigateResult {
  success: boolean;
  path: string;
}

// === 窗口操作 ===

export interface WindowParams {
  action: 'minimize' | 'maximize' | 'close' | 'restore' | 'fullscreen';
}

export interface WindowResult {
  success: boolean;
  state: 'minimized' | 'maximized' | 'normal' | 'fullscreen';
}

// === 快捷键 ===

export interface ShortcutRegisterParams {
  accelerator: string;
  callback: () => void;
  description?: string;
  global?: boolean;
}

export interface ShortcutUnregisterParams {
  accelerator: string;
}

export interface ShortcutResult {
  success: boolean;
  registered: string[];
}

// === 拖放 ===

export interface DragStartParams {
  data: {
    text?: string;
    html?: string;
    files?: string[];
    custom?: Record<string, unknown>;
  };
  effectAllowed?: 'none' | 'copy' | 'move' | 'link' | 'copyMove' | 'copyLink' | 'linkMove' | 'all';
}

export interface DropResult {
  data: {
    text?: string;
    html?: string;
    files?: string[];
    custom?: Record<string, unknown>;
  };
  dropEffect: 'none' | 'copy' | 'move' | 'link';
}

// === 应用信息 ===

export interface AppInfo {
  name: string;
  version: string;
  electron: string;
  chrome: string;
  node: string;
  v8: string;
  platform: NodePlatform;
  arch: string;
}

// === 权限相关 ===

export interface PermissionCheckParams {
  permission: string;
}

export interface PermissionCheckResult {
  granted: boolean;
  reason?: string;
}

export interface PermissionRequestParams {
  permission: string;
  reason?: string;
}

export interface PermissionRequestResult {
  granted: boolean;
  permanent: boolean;
  reason?: string;
}

// === 命令执行 ===

export interface CommandExecuteParams {
  command?: 'pytest' | 'python' | 'python3';
  args?: string[];
  cwd?: string;
  timeoutMs?: number;
}

export interface CommandExecuteResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
  truncated: boolean;
}
