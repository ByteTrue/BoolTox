# BoolTox 插件系统重构计划 (Refactoring Plan)

**创建日期**: 2025-11-22
**状态**: 规划中
**目标**: 从 "组件加载模式" 转型为 "微内核独立容器模式"，并全面对齐 VS Code 扩展体系，支持多语言插件、硬件访问和高安全性。

---

## 0. VS Code 对齐蓝图

| VS Code 概念 | 目标 BoolTox 等价物 | 说明 |
| :--- | :--- | :--- |
| Extension Host (Node.js) | BoolTox Extension Host (Electron Main + Service Workers) | 负责激活插件、提供 API、权限校验，与渲染层解耦。 |
| `package.json` contributions | `manifest.json` (vNext) + `@booltox/protocol` | 引入 VS Code 风格的能力声明、激活条件、权限请求与语义化版本。 |
| WebviewPanel / WebviewView | BrowserView / WebContainer | 插件 UI 运行在隔离 Webview 中，通过 `window.booltox` 访问宿主桥，与 VS Code 的 `acquireVsCodeApi` 对齐。 |
| Extension API (`vscode.*`) | `@booltox/protocol` + IPC Dispatcher | 在 shared 包中定义稳定 API Surface，客户端只需维护适配器，实现“宿主少更新，插件自理”。 |
| Language Server / Debug Adapter | Backend Runner (Python/C++/Rust) | 插件可声明 `backend.type=python` 等，宿主按协议拉起外部进程并转发消息，完全仿照 LSP 模型。 |
| VSCE / npm packaging | `booltox-plugin` 工具链 | 提供 CLI 打包/签名/发布，与 VS Code Extension Marketplace 流程一致，便于生态扩展。 |

### 0.1 重构守则
- **API 稳定**: `@booltox/protocol` 作为唯一可信接口，语义化版本管理，插件声明依赖的 protocol range。
- **权限沙箱**: Manifest 权限 = VS Code `capabilities`，宿主基于 declarative 权限自动降级，不再写专用 API。
- **多语言后端**: 引入 VS Code LSP/Debug Adapter 的通信规范，Python 等插件仅需实现协议即可运行。
- **装载统一**: 插件加载、升级、调试流程对齐 `vsce package` + `code --extensionDevelopmentPath` 体验。
- **兼容演进**: Electron 客户端阶段性实现 VS Code 模式，保留切换开关，最终实现完全替换。

---

## 1. 核心架构设计

### 1.1 架构变更
| 特性 | 旧架构 (Current) | 新架构 (Target) |
| :--- | :--- | :--- |
| **插件形态** | JS Bundle (React Component) | 独立 Web App (Folder + manifest.json) |
| **运行容器** | 渲染进程 DOM (Shared Context) | Electron `BrowserView` (Isolated Context) |
| **通信方式** | 直接 JS 调用 | IPC Bridge (`window.booltox`) |
| **Node权限** | 继承主程序 (不安全) | 禁用 NodeIntegration，通过 Preload API 暴露 |
| **依赖管理** | 共享 `node_modules` (易冲突) | 插件独立 `node_modules` (完全隔离) |

### 1.2 插件标准结构
每个插件为一个独立文件夹，必须包含 `manifest.json`。

```text
plugins/com.booltox.demo/
├── manifest.json      # 元数据
├── index.html         # 入口
├── icon.png           # 图标
└── assets/            # 资源
```

**manifest.json 规范**:
```json
{
  "id": "com.booltox.demo",
  "version": "1.0.0",
  "name": "Demo Plugin",
  "protocol": "^1.0.0",
  "runtime": {
    "ui": {
      "type": "webview",
      "entry": "index.html"
    },
    "backend": {
      "type": "python",
      "entry": "app/main.py"
    }
  },
  "permissions": ["fs.read", "shell.exec", "python.run"],
  "capabilities": [
    {
      "module": "shell",
      "permissions": ["shell.exec"],
      "reason": "运行桌面批量命令"
    }
  ],
  "window": {
    "width": 800,
    "height": 600
  }
}
```

**字段说明**:
- `protocol`: 语义化版本范围，默认 `^1.0.0`。宿主在 `PluginManager` 中比对 `BOOLTOX_PROTOCOL_VERSION`，不满足会拒绝加载。
- `runtime`: 描述 UI/Backend 运行时。`ui.entry` 替代旧版 `main`，运行器会自动回填 `main` 以兼容旧代码；`backend` 可声明 `python`/`node` 进程，后续由 Extension Host 启动。
- `permissions`/`capabilities`: 与 VS Code 权限模型对齐，权限缺失将被 Extension Host 拒绝。`capabilities` 用于解释请求原因，方便审核与 UI 提示。
- 仍可使用旧字段（如 `main`），Loader 会在 `runtime` 缺失时自动退化为 `webview` 模式，便于渐进迁移。

---

## 2. 实施路线图 (Roadmap)

### ✅ 阶段零：准备工作
- [ ] 创建 `docs/REFACTOR_PLAN.md` (本文档)
- [ ] 清理旧的 `ModuleLoader` 代码 (暂缓，待新架构跑通后再删除)

### 🚀 阶段一：基础架构 (Kernel & Loader)
**目标**: 能加载并显示一个简单的 HTML 文件插件。

- [x] **主进程 (Main)**
    - [x] 创建 `PluginManager` 服务：负责扫描 `plugins` 目录，解析 `manifest.json`。
    - [x] 创建 `PluginRunner` 服务：负责管理 `BrowserView` 生命周期。
    - [x] 实现 `loadPlugin(id)`：创建 View，加载 URL。
- [x] **渲染进程 (Renderer)**
    - [x] 创建 `PluginPlaceholder` 组件：作为插件显示的容器。
    - [x] 实现 `ResizeObserver`：监听容器大小变化，通过 IPC 通知主进程调整 View 大小。
- [x] **验证**
    - [x] 手写一个 `hello-world` 插件 (HTML)，成功在 BoolTox 中显示。

### 🔌 阶段二：通信桥接 (Bridge & API)
**目标**: 插件能通过 `window.booltox` 调用系统能力。

- [x] **Preload 脚本**
    - [x] 创建 `src/main/preload/plugin.ts`。
    - [x] 使用 `contextBridge` 暴露 `window.booltox`。
- [x] **IPC 通信**
    - [x] 定义 IPC 频道规范 (`booltox:api:call`)。
    - [x] 实现主进程 IPC 路由与权限校验 (Permission Guard)。
- [x] **Extension Host**
    - [x] 新增 `ExtensionHost` 抽象：集中注册 module handler，并按 VS Code 风格做权限校验。
    - [x] 重写 `plugin-api-handler` -> 模块化的 `window/fs/storage/shell/python/telemetry` dispatcher。
    - [x] Preload 改为直接依赖 `@booltox/protocol`，提供 storage/db 双轨 API，并预留 backend/telemetry stub。
- [x] **Backend Runner**
    - [x] `PluginBackendRunner` 支持 `manifest.runtime.backend`（Python/Node），宿主暴露 `backend.register/postMessage/onMessage` API，并将 STDIO/退出事件转发给 Webview。
    - [x] 提供 `com.booltox.backend-demo` 示例插件，详见 `docs/BACKEND_PLUGIN_GUIDE.md`。
- [ ] **核心 API 实现**
    - [ ] `booltox.window`: 最小化、关闭、调整大小。
    - [ ] `booltox.fs`: 读写插件私有存储。

### 🐍 阶段三：高级能力 (Native Capabilities)
**目标**: 支持 Python 执行和硬件访问。

- [x] **Shell 模块**
    - [x] 实现 `booltox.shell.exec` (带白名单限制)。
    - [x] 实现 `booltox.shell.runPython` (自动定位 Python 环境)。
- [x] **FS 模块**
    - [x] 实现 `booltox.fs.readFile` (沙箱隔离)。
    - [x] 实现 `booltox.fs.writeFile` (沙箱隔离)。
- [ ] **硬件模块**
    - [ ] 验证 Web Serial API 在 BrowserView 中的可用性。
    - [ ] (可选) 封装 `booltox.serial` 简化访问。

### 📦 阶段四：内置插件迁移
**目标**: 将现有 Todo/Pomodoro 插件迁移到新架构。

- [x] **构建流改造**
    - [x] 配置 Vite 多入口构建，或为每个插件配置独立构建脚本 (采用了独立 Vite 项目模式)。
- [x] **代码重构**
    - [x] 重写 Pomodoro 插件 (`com.booltox.pomodoro`) (已由 `com.booltox.starter` 替代演示)。
    - [x] 移除对主程序 React Context 的依赖。
    - [x] 重写 Todo 插件 (已由 `com.booltox.starter` 替代演示)。
    - [x] 使用 `window.booltox.db` 替代原本的 LocalStorage (已在 `com.booltox.starter` 中实现并验证)。

---

## 3. API 设计草案 (Draft)

### `window.booltox`

```typescript
interface BoolToxAPI {
  // 窗口控制
  window: {
    hide(): Promise<void>;
    show(): Promise<void>;
    setSize(w: number, h: number): Promise<void>;
  };
  
  // 系统命令
  shell: {
    // 仅允许执行 manifest 中声明的命令
    exec(cmd: string, args: string[]): Promise<CommandResult>;
    // 运行 Python 脚本
    spawnPython(script: string, args: string[]): Promise<ChildProcessId>;
  };
  
  // 数据存储 (KV)
  db: {
    get<T>(key: string): Promise<T>;
    set<T>(key: string, val: T): Promise<void>;
  };
}
```
