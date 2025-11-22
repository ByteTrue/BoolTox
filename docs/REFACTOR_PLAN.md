# BoolTox 插件系统重构计划 (Refactoring Plan)

**创建日期**: 2025-11-22
**状态**: 规划中
**目标**: 从 "组件加载模式" 转型为 "微内核独立容器模式"，支持多语言插件、硬件访问和高安全性。

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
  "main": "index.html",
  "permissions": [
    "shell.python",
    "fs.read"
  ],
  "window": {
    "width": 800,
    "height": 600
  }
}
```

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
    - [x] 重写 Pomodoro 插件 (`com.booltox.pomodoro`)。
    - [x] 移除对主程序 React Context 的依赖。
    - [ ] 重写 Todo 插件 (待办)。
    - [ ] 使用 `window.booltox.db` 替代原本的 LocalStorage (Pomodoro 暂时还在用内存状态，需后续优化)。

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
