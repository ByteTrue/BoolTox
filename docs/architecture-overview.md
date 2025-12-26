# 架构概览

BoolTox 是一个基于 Electron 的桌面工具启动器，采用三层架构（Main / Preload / Renderer），核心理念是「启动器而非容器」。

---

## 设计哲学

### 核心原则

1. **工具解耦**：工具运行在独立进程，崩溃不影响主程序
2. **环境隔离**：每个工具独立 Python venv / Node.js node_modules
3. **简化配置**：自动推断运行时类型，最少字段即可运行
4. **零破坏性**：工具不依赖 BoolTox API，可独立运行

### 启动器 vs 容器

| 维度 | 容器模式（VS Code） | 启动器模式（BoolTox） |
|------|---------------------|------------------------|
| **工具运行位置** | 主进程内（WebView / IFrame） | 独立进程 |
| **API 耦合** | 强耦合（Extension API） | 零耦合（HTTP / CLI / GUI） |
| **崩溃影响** | 可能拖垮主进程 | 仅工具自身崩溃 |
| **调试** | 需要主程序调试工具 | 直接用浏览器 DevTools / 终端 |
| **性能** | 共享资源 | 独立资源，互不干扰 |

**设计取舍**：牺牲了紧密集成（如工具之间互相调用），换取了简单性和健壮性。

---

## 三层架构

```
┌───────────────────────────────────────────────────────────────┐
│                    Renderer Process (React)                   │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  ModuleContext  │  │  ToolTabContext │  │  ToastContext│ │
│  │  (工具状态管理)  │  │  (标签页管理)   │  │  (通知系统)  │ │
│  └────────┬────────┘  └────────┬────────┘  └──────────────┘ │
│           │                    │                             │
│  ┌────────▼────────────────────▼──────────────────────────┐  │
│  │  UI Components (React Router 7)                        │  │
│  │  HomePage / ToolsPage / SettingsPage / ModuleCenter   │  │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────┘
                            │ IPC (contextBridge)
┌───────────────────────────▼───────────────────────────────────┐
│                      Main Process (Electron)                  │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │ ToolManager  │  │  ToolRunner  │  │  ToolInstaller     │ │
│  │ (工具发现)    │  │  (生命周期)  │  │  (安装/卸载)       │ │
│  └──────┬───────┘  └──────┬───────┘  └─────────┬──────────┘ │
│         │                 │                     │            │
│  ┌──────▼─────────────────▼─────────────────────▼──────────┐ │
│  │  IPC Registry (集中式 IPC 通道管理)                    │ │
│  │  tool:* / window:* / python:* / system:*               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PythonManager (Python 环境管理)                         │ │
│  │  - uv 自动下载 Python                                    │ │
│  │  - 为每个工具创建独立 venv                               │ │
│  │  - 哈希检测依赖变化                                      │ │
│  └──────────────────────────────────────────────────────────┘ │
└───────────────────────────┬───────────────────────────────────┘
                            │ spawn / exec
┌───────────────────────────▼───────────────────────────────────┐
│                   Tool Processes (独立进程)                   │
│                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Python venv     │  │ Node.js project │  │ Binary       │ │
│  │ Flask/FastAPI   │  │ Express/Koa     │  │ Go/Rust/C++  │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└───────────────────────────────────────────────────────────────┘
```

---

## 核心模块

### 1. ToolManager（工具发现与加载）

**职责**：
- 扫描工具目录（`userData/tools` + `examples/`）
- 解析 `booltox.json` 配置
- 简化配置推断（`start` + `port` → `http-service`）
- 协议版本校验（`^2.0.0`）

**关键代码**：`packages/client/electron/services/tool/tool-manager.ts`

**工具发现流程**：
```
1. 扫描 toolsDir (userData/tools)
   ↓
2. 读取每个子目录的 booltox.json
   ↓
3. validateSimplifiedManifest (验证基本字段)
   ↓
4. inferManifest (简化配置 → 完整配置)
   ↓
5. normalizeManifest (协议版本校验、runtime 解析)
   ↓
6. 存入 Map<toolId, ToolRuntime>
```

**简化配置推断**（`manifest-infer.service.ts`）：
```typescript
// 用户写
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}

// 自动推断为
{
  "name": "我的工具",
  "version": "1.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8001
    }
  }
}
```

---

### 2. ToolRunner（工具生命周期管理）

**职责**：
- 启动工具进程（spawn）
- 引用计数管理（refCount，防止误杀）
- 健康检查（http-service 轮询端口）
- 进程树清理（Windows: `taskkill /T`，Unix: `SIGTERM`）

**关键代码**：`packages/client/electron/services/tool/tool-runner.ts`

**状态管理**：
```typescript
interface ToolState {
  runtime: ToolRuntime;
  process?: ChildProcess;
  refCount: number;           // 引用计数（多窗口共享）
  loadingPromise?: Promise<number>;
  destroyTimer?: NodeJS.Timeout; // 延迟销毁（1秒）
  parentWindow?: BrowserWindow;
}
```

**启动流程（http-service）**：
```
1. 检查工具状态 (refCount++)
   ↓
2. 依赖检查 (ensureDependencies)
   - requirements.txt 变化？→ 弹窗安装
   ↓
3. 启动后端进程 (pythonManager.spawnPython)
   - 设置环境变量: VIRTUAL_ENV, PYTHONPATH
   ↓
4. 健康检查 (轮询 HTTP 端口，每 500ms)
   - 超时 30s → 抛出错误
   ↓
5. 通知渲染进程 (tool:open-in-tab)
   - 创建标签页，加载 URL
   ↓
6. 状态更新 (status = 'running')
```

**停止流程**：
```
1. refCount--
   ↓
2. refCount === 0?
   - 否：保持运行（其他窗口仍在使用）
   - 是：延迟 1 秒销毁（避免频繁重启）
       ↓
       3. 杀死进程树 (SIGTERM / taskkill)
       ↓
       4. 清理后端通道 (backendRunner.disposeAllForTool)
       ↓
       5. 删除状态 (states.delete)
```

---

### 3. PythonManager（Python 环境管理）

**职责**：
- 使用 `uv` 自动下载 Python（无需用户预装）
- 为每个工具创建独立 venv（`~/.booltox/tool-envs/{toolId}/`）
- 哈希检测依赖变化（`requirements.txt.hash`）
- 注入 BoolTox SDK（`booltox_sdk.py`）

**关键代码**：`packages/client/electron/services/python-manager.service.ts`

**目录结构**：
```
~/.booltox/
├── python/                    # uv 下载的 Python
│   └── python-3.12.1/
├── python-sdk/                # BoolTox SDK
│   └── booltox_sdk.py
└── tool-envs/{toolId}/        # 每个工具独立 venv
    ├── .venv/
    ├── requirements.txt       # 原始依赖文件
    └── requirements.txt.hash  # SHA256 哈希（依赖变化检测）
```

**依赖安装判断**：
```typescript
needsToolRequirementsSetup(toolId: string, requirementsPath: string): boolean {
  // 1. venv 不存在 → 需要安装
  if (!venvExists) return true;

  // 2. 读取新旧哈希
  const currentHash = sha256(requirements.txt);
  const savedHash = readFile('requirements.txt.hash');

  // 3. 哈希不匹配 → 需要安装
  return currentHash !== savedHash;
}
```

---

### 4. ToolInstaller（工具安装）

**职责**：
- 从 Git 仓库下载工具（GitHub / Gitee / 自托管）
- 从本地路径创建符号链接（本地工具源）
- 解压 ZIP 包（在线商店）
- 校验 checksum（可选）

**关键代码**：`packages/client/electron/services/tool/tool-installer.ts`

**安装流程（Git 模式）**：
```
1. 判断安装源
   - entry.gitPath 存在 → installFromGitOps()
   - entry.downloadUrl 存在 → installFromZip()
   ↓
2. GitOps 安装
   a. 本地工具源 (source.type === 'local')
      → fs.symlink() 创建符号链接（不复制文件）
   b. 远程工具源
      → gitOpsService.downloadToolSource(gitPath, toolDir)
      → 使用 jsDelivr CDN 加速（或 raw.githubusercontent.com）
   ↓
3. 重新加载工具列表
   toolManager.loadTools()
   ↓
4. 结果: 工具目录 ~/userData/tools/{toolId}
```

---

## 数据流

### 工具加载数据流

```
ToolManifest (booltox.json)
    ↓ [ToolManager.normalizeManifest]
ToolRuntime (Main Process)
    ↓ [IPC: tool:get-all]
ModuleDefinition (Renderer Context)
    ↓ [ModuleContext.syncTools]
ModuleInstance (UI State)
    ↓ [React Component]
工具卡片渲染
```

**数据结构转换**：
```typescript
// 1. ToolManifest (磁盘文件)
{
  "id": "my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}

// 2. ToolRuntime (Main Process)
{
  id: "my-tool",
  manifest: { /* 完整配置 */ },
  path: "/path/to/tool",
  status: "stopped",
  isDev: false
}

// 3. ModuleInstance (Renderer)
{
  id: "my-tool",
  definition: { /* UI 显示信息 */ },
  runtime: {
    launchState: "idle",
    loading: false,
    installed: true
  },
  isFavorite: false
}
```

---

## 工具运行时模式

BoolTox 支持 4 种工具运行时类型，每种有不同的启动和停止行为。

### 1. HTTP Service（推荐）

**适用场景**：Web 应用（Flask / Express / FastAPI）

**配置示例**：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8001
    }
  }
}
```

**启动行为**：
1. 启动后端进程（`python main.py`）
2. 轮询健康检查（`http://127.0.0.1:8001`）
3. 端口就绪后，在 BoolTox 内嵌标签页打开
4. 标签页关闭时，自动停止后端进程

**进程管理**：BoolTox 管理（refCount 机制）

---

### 2. CLI

**适用场景**：命令行工具（交互式脚本）

**配置示例**：
```json
{
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "python",
      "entry": "cli.py"
    }
  }
}
```

**启动行为**：
1. 在系统终端中启动（Windows: `cmd.exe`，macOS/Linux: `Terminal.app` / `xterm`）
2. BoolTox 不监控进程（用户手动关闭终端）
3. 500ms 后清理状态（允许重复启动）

**进程管理**：系统管理（BoolTox 不干预）

---

### 3. Standalone

**适用场景**：Python GUI 应用（Tkinter / PyQt）

**配置示例**：
```json
{
  "runtime": {
    "type": "standalone",
    "entry": "gui.py"
  }
}
```

**启动行为**：
1. 启动 Python 进程（`python gui.py`）
2. 工具在独立窗口运行
3. 用户关闭窗口时，进程自动退出

**进程管理**：BoolTox 监控（但不强制杀死）

---

### 4. Binary

**适用场景**：原生可执行文件（Go / Rust / C++）

**配置示例**：
```json
{
  "runtime": {
    "type": "binary",
    "command": "bin/my-tool.exe",
    "args": ["--verbose"]
  }
}
```

**启动行为**：
1. spawn detached 进程（`child.unref()`）
2. BoolTox 不监控生命周期
3. 500ms 后清理状态（允许重复启动）

**进程管理**：系统管理（BoolTox 不干预）

---

## IPC 通信

BoolTox 使用 Electron 的 `ipcMain` / `ipcRenderer` 进行跨进程通信。

### 集中式 IPC 注册

所有 IPC 通道在 `ipc-registry.ts` 中集中注册：

```typescript
export function registerAllIpcHandlers(mainWindow: BrowserWindow | null) {
  // 工具管理
  ipcMain.handle('tool:get-all', () => toolManager.getAllTools());
  ipcMain.handle('tool:start', (_, id) => toolRunner.startTool(id, mainWindow!));
  ipcMain.handle('tool:stop', (_, id) => toolRunner.stopTool(id, mainWindow!));

  // 窗口管理
  ipcMain.handle('window:control', (event, action) => { /* ... */ });

  // Python 环境
  ipcMain.handle('python:status', () => pythonManager.getStatus());

  // ... 总共 50+ 个通道
}
```

### Preload 安全桥接

`preload.ts` 使用 `contextBridge` 暴露安全的 API：

```typescript
contextBridge.exposeInMainWorld('tool', {
  start: (id) => ipcRenderer.invoke('tool:start', id),
  stop: (id) => ipcRenderer.invoke('tool:stop', id),
  // ...
});
```

### 渲染进程调用

```typescript
// React Component
const result = await window.tool.start(toolId);
```

**IPC 完整参考**：[api/ipc-reference.md](api/ipc-reference.md)

---

## 关键设计决策

### 1. 引用计数 vs 直接停止

**问题**：用户在多个窗口打开同一工具时，关闭一个窗口是否应停止工具？

**方案**：引用计数（refCount）
- 启动时 `refCount++`
- 停止时 `refCount--`
- `refCount === 0` 时才真正停止进程

**权衡**：
- ✅ 避免误杀（用户可能在其他窗口使用）
- ❌ 增加复杂度（需要处理竞态条件）

---

### 2. 延迟销毁 vs 立即销毁

**问题**：用户关闭标签页后立即重新打开，是否应重启工具？

**方案**：延迟 1 秒销毁（`destroyTimer`）
- 关闭标签页时不立即杀进程
- 1 秒内重新打开，复用进程
- 超过 1 秒，销毁进程

**权衡**：
- ✅ 减少频繁重启（提升用户体验）
- ❌ 增加内存占用（进程保留 1 秒）

---

### 3. 简化配置 vs 完整配置

**问题**：工具开发者应写简化配置（`start` + `port`）还是完整配置（`runtime`）？

**方案**：简化优先，自动推断
- 简化配置：`{ start: "python main.py", port: 8001 }`
- 推断为：`{ runtime: { type: "http-service", backend: { ... } } }`

**权衡**：
- ✅ 降低门槛（新手友好）
- ❌ 推断逻辑复杂（需要处理边界情况）

---

### 4. 工具独立进程 vs 主进程内运行

**问题**：工具应在主进程内运行（Extension Host）还是独立进程？

**方案**：独立进程（启动器模式）
- http-service：独立后端进程 + 浏览器标签页
- cli：系统终端
- standalone / binary：独立进程

**权衡**：
- ✅ 工具崩溃不影响主程序
- ✅ 调试方便（直接用浏览器 DevTools）
- ❌ 无法紧密集成（工具之间不能互相调用）

---

### 5. Python 环境：全局 vs 独立 venv

**问题**：工具应共享全局 Python 环境还是独立 venv？

**方案**：独立 venv（`~/.booltox/tool-envs/{toolId}/`）
- 每个工具一个 venv
- 哈希检测依赖变化（避免重复安装）
- 使用 `uv` 自动下载 Python（无需用户预装）

**权衡**：
- ✅ 避免依赖冲突
- ✅ 工具卸载时清理干净
- ❌ 磁盘占用增加（每个 venv 约 50MB）

---

## 性能优化

### 1. IPC 通信优化

- **批量请求**：`tool:get-all` 一次返回所有工具，而不是 `tool:get` 逐个请求
- **状态广播**：`tool:state` 事件推送状态变化，而不是轮询

### 2. React 渲染优化

- **Context 分离**：ModuleContext / ToolTabContext / ToastContext 独立，减少无关重渲染
- **useMemo / useCallback**：缓存计算结果和回调函数
- **虚拟化列表**：工具列表使用虚拟滚动（未实现，计划中）

### 3. 工具启动优化

- **依赖缓存**：哈希检测依赖变化，避免重复安装
- **并行安装**：多个工具依赖并行安装（未实现，计划中）

---

## 安全性

### 1. IPC 通道白名单

- 只暴露必要的 API（`contextBridge` 白名单）
- 不暴露 `require` / `fs` 等危险 API

### 2. 工具隔离

- 工具运行在独立进程，无法访问主进程
- contextIsolation 防止工具注入恶意代码

### 3. 文件路径验证

- 写入文件前验证路径在允许的目录内（`validatePathIsInAllowedDirectory`）

---

## 下一步阅读

- 📡 **IPC 参考**：[api/ipc-reference.md](api/ipc-reference.md)
- 🔌 **工具协议**：[api/tool-protocol.md](api/tool-protocol.md)
- 🚀 **部署指南**：[deployment-guide.md](deployment-guide.md)
