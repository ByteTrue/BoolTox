# IPC 通道参考

BoolTox 使用 Electron 的 `ipcMain` / `ipcRenderer` 进行跨进程通信。所有 IPC 通道在 `ipc-registry.ts` 中集中注册，通过 `contextBridge` 暴露给渲染进程。

---

## 通道命名规范

```
Domain_Action
```

- **Domain**: 功能域（如 `Window`, `Tool`, `Python`）
- **Action**: 操作名称（如 `Control`, `Start`, `GetStatus`）

---

## 窗口管理 (Window)

### `window:control`

**用途**：控制窗口行为（最小化、最大化、关闭）

**请求参数**：
```typescript
action: 'minimize' | 'toggle-maximize' | 'close'
```

**返回值**：`void`

**使用示例**：
```typescript
// 渲染进程
await window.electron.ipcRenderer.invoke('window:control', 'minimize');
```

---

### `window:get-main-window-bounds`

**用途**：获取主窗口边界信息

**请求参数**：无

**返回值**：
```typescript
{ x: number; y: number; width: number; height: number } | null
```

**使用示例**：
```typescript
const bounds = await window.electron.ipcRenderer.invoke('window:get-main-window-bounds');
if (bounds) {
  console.log(`窗口位置: (${bounds.x}, ${bounds.y}), 大小: ${bounds.width}x${bounds.height}`);
}
```

---

### `window:get-all-windows-bounds`

**用途**：获取所有窗口（主窗口 + 分离窗口）边界信息

**请求参数**：无

**返回值**：
```typescript
Array<{
  windowId: string;
  bounds: { x: number; y: number; width: number; height: number };
}>
```

**使用示例**：
```typescript
const windows = await window.electron.ipcRenderer.invoke('window:get-all-windows-bounds');
windows.forEach(w => {
  console.log(`窗口 ${w.windowId}: (${w.bounds.x}, ${w.bounds.y})`);
});
```

---

### `window:get-cursor-screen-point`

**用途**：获取鼠标在屏幕上的坐标

**请求参数**：无

**返回值**：
```typescript
{ x: number; y: number }
```

**使用示例**：
```typescript
const point = await window.electron.ipcRenderer.invoke('window:get-cursor-screen-point');
console.log(`鼠标位置: (${point.x}, ${point.y})`);
```

---

### `window:focus-window`

**用途**：聚焦指定窗口

**请求参数**：
```typescript
windowId: string  // 'main' 或分离窗口 ID
```

**返回值**：
```typescript
{ success: boolean }
```

**使用示例**：
```typescript
await window.electron.ipcRenderer.invoke('window:focus-window', 'main');
```

---

## 应用设置 (AppSettings)

### `app-settings:get-auto-launch`

**用途**：获取开机自启动状态

**请求参数**：无

**返回值**：
```typescript
boolean
```

**使用示例**：
```typescript
const enabled = await window.electron.ipcRenderer.invoke('app-settings:get-auto-launch');
console.log(`开机自启动: ${enabled ? '已启用' : '已禁用'}`);
```

---

### `app-settings:set-auto-launch`

**用途**：设置开机自启动

**请求参数**：
```typescript
enabled: boolean
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('app-settings:set-auto-launch', true);
if (result.success) {
  console.log('开机自启动已启用');
}
```

---

### `app-settings:get-close-to-tray`

**用途**：获取关闭到托盘设置

**请求参数**：无

**返回值**：
```typescript
boolean
```

**使用示例**：
```typescript
const enabled = await window.electron.ipcRenderer.invoke('app-settings:get-close-to-tray');
```

---

### `app-settings:set-close-to-tray`

**用途**：设置关闭到托盘

**请求参数**：
```typescript
enabled: boolean
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

## 系统信息 (System)

### `get-system-info`

**用途**：获取系统信息（CPU、内存、磁盘、OS）

**请求参数**：无

**返回值**：
```typescript
{
  os: {
    platform: string;   // 'darwin' | 'win32' | 'linux'
    release: string;
    type: string;
    name: string;       // 格式化后的 OS 名称
    arch: string;       // 'x64' | 'arm64'
  };
  cpu: {
    model: string;
    cores: number;
    speed: number;      // MHz
    architecture: string;
    usage: number;      // 百分比（0-100）
  };
  memory: {
    total: number;      // 字节
    free: number;
    used: number;
  };
  disks: Array<{
    mount: string;
    free: number;
    total: number;
    used: number;
    percent: number;
  }>;
  uptime: number;       // 进程运行时间（秒）
}
```

**使用示例**：
```typescript
const info = await window.electron.ipcRenderer.invoke('get-system-info');
console.log(`CPU: ${info.cpu.model} (${info.cpu.cores} cores, ${info.cpu.usage}%)`);
console.log(`内存: ${(info.memory.used / 1024 ** 3).toFixed(2)} GB / ${(info.memory.total / 1024 ** 3).toFixed(2)} GB`);
```

---

## 模块存储 (ModuleStore)

### `module-store:get-all`

**用途**：获取所有已安装模块信息

**请求参数**：无

**返回值**：
```typescript
StoredModuleInfo[]

interface StoredModuleInfo {
  id: string;
  name: string;
  version: string;
  installedAt: string;    // ISO 8601 时间戳
  lastUsedAt?: string;
  installSource?: 'local' | 'git' | 'url';
  isFavorite?: boolean;
}
```

**使用示例**：
```typescript
const modules = await window.electron.ipcRenderer.invoke('module-store:get-all');
console.log(`已安装 ${modules.length} 个模块`);
```

---

### `module-store:get`

**用途**：获取指定模块信息

**请求参数**：
```typescript
id: string
```

**返回值**：
```typescript
StoredModuleInfo | null
```

---

### `module-store:add`

**用途**：添加模块信息到存储

**请求参数**：
```typescript
info: StoredModuleInfo
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

### `module-store:update`

**用途**：更新模块信息

**请求参数**：
```typescript
id: string
partialInfo: Partial<StoredModuleInfo>
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**使用示例**：
```typescript
// 标记为收藏
await window.electron.ipcRenderer.invoke('module-store:update', 'my-tool', { isFavorite: true });
```

---

### `module-store:remove`

**用途**：从存储中删除模块信息

**请求参数**：
```typescript
id: string
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

### `module-store:get-cache-path`

**用途**：获取模块缓存目录路径

**请求参数**：
```typescript
moduleId: string
```

**返回值**：
```typescript
string | null
```

---

### `module-store:remove-cache`

**用途**：删除模块缓存

**请求参数**：
```typescript
moduleId: string
```

**返回值**：
```typescript
boolean
```

---

## Git 操作 (GitOps)

### `git-ops:get-config`

**用途**：获取 Git 操作配置

**请求参数**：无

**返回值**：
```typescript
GitOpsConfig

interface GitOpsConfig {
  type: 'github' | 'gitee' | 'gitlab' | 'azure';
  owner: string;
  repo: string;
  branch?: string;
  baseUrl?: string;  // 自托管 URL
  token?: string;
}
```

---

### `git-ops:update-config`

**用途**：更新 Git 操作配置

**请求参数**：
```typescript
config: Partial<GitOpsConfig>
```

**返回值**：
```typescript
GitOpsConfig  // 更新后的完整配置
```

---

### `git-ops:get-tools`

**用途**：从工具源获取工具列表

**请求参数**：无

**返回值**：
```typescript
{ tools: ToolRegistryEntry[] }
```

---

## 工具源管理 (ToolSources)

### `tool-sources:list`

**用途**：获取所有工具源配置

**请求参数**：无

**返回值**：
```typescript
ToolSourceConfig[]

interface ToolSourceConfig {
  id: string;
  name: string;
  type: 'github' | 'gitee' | 'gitlab' | 'azure' | 'local';
  enabled: boolean;

  // Git 工具源
  owner?: string;
  repo?: string;
  branch?: string;
  baseUrl?: string;

  // 本地工具源
  localPath?: string;
}
```

**使用示例**：
```typescript
const sources = await window.electron.ipcRenderer.invoke('tool-sources:list');
sources.forEach(s => {
  console.log(`工具源: ${s.name} (${s.type})`);
});
```

---

### `tool-sources:add`

**用途**：添加新工具源

**请求参数**：
```typescript
repo: Omit<ToolSourceConfig, 'id'>
```

**返回值**：
```typescript
ToolSourceConfig  // 新增的工具源（包含生成的 id）
```

**使用示例**：
```typescript
const newSource = await window.electron.ipcRenderer.invoke('tool-sources:add', {
  name: '公司内部工具',
  type: 'github',
  enabled: true,
  owner: 'mycompany',
  repo: 'internal-tools',
  branch: 'main',
});
console.log(`已添加工具源: ${newSource.id}`);
```

---

### `tool-sources:update`

**用途**：更新工具源配置

**请求参数**：
```typescript
id: string
updates: Partial<ToolSourceConfig>
```

**返回值**：
```typescript
ToolSourceConfig  // 更新后的工具源
```

---

### `tool-sources:delete`

**用途**：删除工具源

**请求参数**：
```typescript
id: string
```

**返回值**：`void`

**注意**：官方工具源（id='official'）不可删除。

---

### `tool-sources:test`

**用途**：测试工具源连接

**请求参数**：
```typescript
repo: ToolSourceConfig
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  toolCount?: number;         // 成功时返回工具数量
  tools?: Array<{             // 成功时返回前 5 个工具
    id: string;
    name: string;
  }>;
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('tool-sources:test', sourceConfig);
if (result.success) {
  console.log(`连接成功！发现 ${result.toolCount} 个工具`);
} else {
  console.error(`连接失败: ${result.error}`);
}
```

---

## 日志系统 (Logger)

### `logger:get-log-path`

**用途**：获取日志文件路径

**请求参数**：无

**返回值**：
```typescript
string
```

**使用示例**：
```typescript
const logPath = await window.electron.ipcRenderer.invoke('logger:get-log-path');
console.log(`日志路径: ${logPath}`);
```

---

### `logger:open-log-folder`

**用途**：在文件管理器中打开日志文件夹

**请求参数**：无

**返回值**：
```typescript
{ success: boolean }
```

---

### `app:log-to-main`

**用途**：从渲染进程发送日志到主进程

**请求参数**：
```typescript
{
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  args: unknown[];
}
```

**返回值**：`void`

**使用示例**：
```typescript
window.electron.ipcRenderer.send('app:log-to-main', {
  level: 'error',
  args: ['工具启动失败', error],
});
```

---

## 工具管理 (Tool)

### `tool:get-all`

**用途**：获取所有已加载的工具列表

**请求参数**：无

**返回值**：
```typescript
ToolRuntime[]

interface ToolRuntime {
  id: string;
  manifest: ToolManifest;    // 完整的 booltox.json
  path: string;              // 工具目录路径
  status: 'stopped' | 'starting' | 'running' | 'error';
  isDev: boolean;            // 是否来自 examples/ 目录
}
```

**使用示例**：
```typescript
const tools = await window.electron.ipcRenderer.invoke('tool:get-all');
console.log(`已加载 ${tools.length} 个工具`);
```

---

### `tool:start`

**用途**：启动工具

**请求参数**：
```typescript
id: string
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  port?: number;             // http-service 模式返回端口
  url?: string;              // http-service 模式返回完整 URL
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('tool:start', 'my-tool');
if (result.success) {
  console.log(`工具已启动: ${result.url}`);
} else {
  console.error(`启动失败: ${result.error}`);
}
```

---

### `tool:stop`

**用途**：停止工具

**请求参数**：
```typescript
id: string
```

**返回值**：`void`

**使用示例**：
```typescript
await window.electron.ipcRenderer.invoke('tool:stop', 'my-tool');
```

---

### `tool:focus`

**用途**：聚焦工具窗口（如果工具在分离窗口中）

**请求参数**：
```typescript
id: string
```

**返回值**：`void`

---

### `tool:install`

**用途**：安装工具

**请求参数**：
```typescript
entry: ToolRegistryEntry

interface ToolRegistryEntry {
  id: string;
  name: string;
  version: string;
  description?: string;

  // 安装源（三选一）
  gitPath?: string;          // Git 仓库路径（如 'owner/repo/tools/my-tool'）
  downloadUrl?: string;      // ZIP 下载 URL
  localPath?: string;        // 本地路径
}
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  path?: string;             // 成功时返回安装路径
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('tool:install', {
  id: 'example-tool',
  name: 'Example Tool',
  version: '1.0.0',
  gitPath: 'ByteTrue/booltox-tools/tools/example-tool',
});
if (result.success) {
  console.log(`工具已安装到: ${result.path}`);
}
```

**进度事件**：
```typescript
// 监听安装进度
window.electron.ipcRenderer.on('tool:install-progress', (event, progress) => {
  console.log(`下载进度: ${progress.percent}%`);
});
```

---

### `tool:uninstall`

**用途**：卸载工具

**请求参数**：
```typescript
toolId: string
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**注意**：
- 会自动停止正在运行的工具
- 删除工具目录和虚拟环境
- 开发模式工具（来自 `examples/`）不可卸载

---

### `tool:cancel-install`

**用途**：取消正在进行的工具下载

**请求参数**：
```typescript
toolId: string
```

**返回值**：
```typescript
{ success: boolean }
```

---

### `tool:check-updates`

**用途**：检查所有已安装工具的更新

**请求参数**：无

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  updates: Array<{
    toolId: string;
    currentVersion: string;
    latestVersion: string;
  }>;
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('tool:check-updates');
if (result.success && result.updates.length > 0) {
  console.log(`发现 ${result.updates.length} 个工具有更新`);
}
```

---

### `tool:update`

**用途**：更新单个工具

**请求参数**：
```typescript
toolId: string
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

### `tool:update-all`

**用途**：批量更新工具

**请求参数**：
```typescript
toolIds: string[]
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  updated: string[];         // 成功更新的工具 ID
  failed: string[];          // 更新失败的工具 ID
}
```

---

### `tool:add-local-binary-tool`

**用途**：添加本地二进制工具（从可执行文件）

**请求参数**：
```typescript
{
  name: string;              // 工具名称
  exePath: string;           // 可执行文件路径
  description?: string;      // 描述
  args?: string[];           // 启动参数
}
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  id?: string;               // 成功时返回生成的工具 ID
  path?: string;             // 成功时返回工具目录
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('tool:add-local-binary-tool', {
  name: 'My App',
  exePath: '/Users/me/Applications/MyApp.app',
  description: '我的自定义应用',
});
if (result.success) {
  console.log(`工具已添加: ${result.id}`);
}
```

---

## 对话框 (Dialog)

### `dialog:openFile`

**用途**：打开文件选择对话框

**请求参数**：
```typescript
{
  properties?: string[];     // 如 ['openFile', 'multiSelections']
  filters?: Array<{          // 文件类型过滤
    name: string;
    extensions: string[];
  }>;
  defaultPath?: string;      // 默认路径
}
```

**返回值**：
```typescript
string | null  // 选中的文件路径，取消时返回 null
```

**使用示例**：
```typescript
const filePath = await window.electron.ipcRenderer.invoke('dialog:openFile', {
  filters: [
    { name: '可执行文件', extensions: ['exe', 'app', 'bin'] },
    { name: '所有文件', extensions: ['*'] },
  ],
});
if (filePath) {
  console.log(`选中文件: ${filePath}`);
}
```

---

## 文件系统 (FS)

### `fs:detectToolConfig`

**用途**：检测目录中的工具配置文件

**请求参数**：
```typescript
localPath: string
```

**返回值**：
```typescript
{
  hasBooltoxJson: boolean;
  hasBooltoxIndex: boolean;
  booltoxData?: object;      // 解析后的 booltox.json
  indexData?: object;        // 解析后的 booltox-index.json
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('fs:detectToolConfig', '/path/to/tool');
if (result.hasBooltoxJson) {
  console.log('发现单工具配置');
} else if (result.hasBooltoxIndex) {
  console.log('发现多工具索引');
}
```

---

### `fs:writeToolConfig`

**用途**：写入工具配置文件（booltox.json）

**请求参数**：
```typescript
localPath: string          // 工具目录路径
config: object             // booltox.json 内容
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**安全限制**：只能写入到允许的目录（`userData`, `temp`, `documents`）

---

### `fs:writeToolIndex`

**用途**：写入工具索引文件（booltox-index.json）

**请求参数**：
```typescript
localPath: string
indexData: {
  tools: Array<{
    id: string;
    path: string;
  }>;
}
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

## Python 环境 (Python)

### `python:status`

**用途**：获取 Python 环境状态

**请求参数**：无

**返回值**：
```typescript
{
  installed: boolean;
  version: string | null;
  executablePath: string | null;
  uvAvailable?: boolean;      // uv 是否可用
  uvVersion?: string;
}
```

**使用示例**：
```typescript
const status = await window.electron.ipcRenderer.invoke('python:status');
if (status.installed) {
  console.log(`Python ${status.version} 已安装`);
} else {
  console.log('Python 未安装');
}
```

---

### `python:ensure`

**用途**：确保 Python 环境存在（不存在则自动下载）

**请求参数**：无

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('python:ensure');
if (result.success) {
  console.log('Python 环境已就绪');
}
```

---

### `python:install-global`

**用途**：安装全局 Python 包

**请求参数**：
```typescript
packages: string[]         // 包名列表（如 ['requests', 'flask==2.0.1']）
```

**返回值**：
```typescript
{ success: boolean; error?: string }
```

**使用示例**：
```typescript
await window.electron.ipcRenderer.invoke('python:install-global', ['requests', 'beautifulsoup4']);
```

---

### `python:list-global`

**用途**：列出全局已安装的 Python 包

**请求参数**：无

**返回值**：
```typescript
string[]  // 包名列表
```

---

### `python:run-code`

**用途**：运行 Python 代码片段

**请求参数**：
```typescript
code: string               // Python 代码
options?: {
  cwd?: string;            // 工作目录
  timeout?: number;        // 超时时间（毫秒）
}
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  stdout: string;
  stderr: string;
}
```

**使用示例**：
```typescript
const result = await window.electron.ipcRenderer.invoke('python:run-code', `
import sys
print(f"Python {sys.version}")
`, { timeout: 5000 });
console.log(result.stdout);
```

---

### `python:run-script`

**用途**：运行 Python 脚本文件

**请求参数**：
```typescript
scriptPath: string         // 脚本路径
args?: string[]            // 脚本参数
options?: {
  cwd?: string;
  timeout?: number;
}
```

**返回值**：
```typescript
{
  success: boolean;
  error?: string;
  stdout: string;
  stderr: string;
}
```

---

## 自动更新 (AutoUpdate)

### `auto-update:check`

**用途**：检查 BoolTox 应用更新

**请求参数**：无

**返回值**：
```typescript
{
  available: boolean;
  version?: string;          // 最新版本号
  releaseNotes?: string;     // 更新说明
}
```

---

### `auto-update:download`

**用途**：下载更新

**请求参数**：无

**返回值**：
```typescript
{ success: boolean; error?: string }
```

---

### `auto-update:get-status`

**用途**：获取更新下载状态

**请求参数**：无

**返回值**：
```typescript
{
  status: 'idle' | 'checking' | 'downloading' | 'downloaded' | 'error';
  progress?: number;         // 下载进度（0-100）
  error?: string;
}
```

---

### `auto-update:quit-and-install`

**用途**：退出并安装更新

**请求参数**：无

**返回值**：`void`

**注意**：调用后应用会立即退出并安装更新。

---

## 事件推送（Main → Renderer）

主进程可以通过 `webContents.send()` 向渲染进程推送事件：

### `tool:install-progress`

**用途**：工具安装进度通知

**数据格式**：
```typescript
{
  toolId: string;
  status: 'downloading' | 'extracting' | 'installing' | 'done';
  percent?: number;          // 0-100
  message?: string;
}
```

**监听示例**：
```typescript
window.electron.ipcRenderer.on('tool:install-progress', (event, progress) => {
  console.log(`${progress.toolId}: ${progress.status} ${progress.percent}%`);
});
```

---

### `tool:state`

**用途**：工具状态变化通知

**数据格式**：
```typescript
{
  id: string;
  status: 'stopped' | 'starting' | 'running' | 'error';
  error?: string;
}
```

---

### `tool:open-in-tab`

**用途**：通知渲染进程在标签页中打开工具

**数据格式**：
```typescript
{
  toolId: string;
  url: string;               // http-service 的 URL
}
```

---

## 安全限制

### 文件系统访问

写入文件（`fs:writeToolConfig`, `fs:writeToolIndex`）只允许在以下目录：

- `userData`: `~/Library/Application Support/BoolTox` (macOS)
- `temp`: 系统临时目录
- `documents`: 用户文档目录

任何尝试写入其他目录会抛出 `Access denied` 错误。

### IPC 权限

- 所有 IPC 通道通过 `contextBridge` 暴露，渲染进程无法直接访问 Node.js API
- `ipcRenderer.send` 和 `ipcRenderer.invoke` 已被封装，只能调用白名单中的通道

---

## 调试技巧

### 查看所有注册的 IPC 通道

```typescript
// 主进程日志
console.log(`已注册 ${Object.keys(IpcChannel).length} 个 IPC handlers`);
```

### 监控 IPC 调用

```typescript
// 在 ipc-registry.ts 中添加日志
ipcMain.handle('tool:start', async (_event, id: string) => {
  logger.info(`[IPC] tool:start called with id: ${id}`);
  // ...
});
```

### 渲染进程日志

```typescript
window.electron.ipcRenderer.send('app:log-to-main', {
  level: 'info',
  args: ['IPC 调用成功', result],
});
```

---

## 完整 TypeScript 类型定义

```typescript
// packages/client/src/shared/constants/ipc-channels.ts
export enum IpcChannel {
  Window_Control = 'window:control',
  Tool_GetAll = 'tool:get-all',
  Python_Status = 'python:status',
  // ... 完整枚举见源文件
}

// 使用示例
import { IpcChannel } from '@/shared/constants/ipc-channels';

await window.electron.ipcRenderer.invoke(IpcChannel.Tool_GetAll);
```

---

## 参考资料

- **IPC 注册中心**：`packages/client/electron/ipc-registry.ts`
- **通道枚举**：`packages/client/src/shared/constants/ipc-channels.ts`
- **Preload 脚本**：`packages/client/electron/preload.ts`
- **Electron IPC 文档**：https://www.electronjs.org/docs/latest/api/ipc-main
