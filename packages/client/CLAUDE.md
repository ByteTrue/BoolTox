# @booltox/client - Electron 客户端

> [根目录](../../CLAUDE.md) > [packages](./) > **client**

---

## 变更记录（Changelog）

| 时间 | 操作 | 说明 |
|------|------|------|
| 2025-12-12 15:45 | 架构重构 | 从 webview 容器改为进程管理器，工具完全独立 |
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

**核心理念**：**BoolTox = 进程管理器 + 工具市场**，不是工具运行容器

BoolTox 的 **可选本地 Agent（Electron 客户端）**，提供：
- **工具市场**：发现、搜索、安装工具
- **进程管理**：启动、停止、重启工具进程
- **依赖环境管理**：Python venv、Node.js 依赖自动安装
- **系统托盘入口**：快速访问已安装工具
- **浏览器集成**：一键在默认浏览器中打开工具
- **自动更新**：基于 Electron Updater

**核心特性**：
- Electron 38.4.0 + Vite 7
- React 19 + Framer Motion
- 内置 uv（Python 包管理器）
- 工具完全独立，不依赖 BoolTox SDK

---

## 入口与启动

### 开发模式
```bash
pnpm dev
# 或从根目录
pnpm --filter @booltox/client dev
```

### 生产构建
```bash
pnpm build
# 输出：release/0.0.1/*.exe/.dmg/.AppImage
```

### 关键入口文件
- **Electron Main**：`src/main/*.ts`（进程管理、IPC 通信）
  - `src/main/error-handler.ts`：全局错误处理
  - `src/main/logger.ts`：日志系统
- **Renderer（React）**：`src/renderer/`（UI 界面）
  - `src/renderer/main.tsx`：React 根组件
  - `src/renderer/components/`：UI 组件

---

## 对外接口

### IPC 通信
- **通道定义**：`src/shared/constants/ipc-channels.ts`
- **Preload Script**：桥接 Main 与 Renderer（通过 `contextBridge`）

### 工具管理 API
- **安装工具**：通过后端 API（`src/renderer/lib/backend-client.ts`）
- **启动工具**：启动 Python/Node.js 进程
- **健康检查**：轮询 HTTP 服务就绪状态
- **打开浏览器**：使用 `shell.openExternal()` 打开工具 URL

### 工具架构模式

#### 1. HTTP Service 模式（推荐）
工具启动自己的 HTTP 服务器（FastAPI/Express），在浏览器中显示：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",  // 或 "node"
      "entry": "main.py",
      "port": 8001
    }
  }
}
```

**BoolTox 的处理流程**：
1. 启动后端进程（Python/Node.js）
2. 轮询健康检查（`http://127.0.0.1:port/`）
3. 服务就绪后调用 `shell.openExternal(url)`
4. 工具在系统默认浏览器中运行

#### 2. Standalone 模式
工具创建自己的原生窗口（Qt/Tkinter 等）：
```json
{
  "runtime": {
    "type": "standalone",
    "backend": {
      "type": "python",
      "entry": "main.py"
    }
  }
}
```

**BoolTox 的处理流程**：
1. 启动进程
2. 工具自行创建 GUI 窗口
3. BoolTox 仅管理进程生命周期

**参考示例**：
- HTTP Service: `examples/backend-demo`（Python/FastAPI）
- HTTP Service: `examples/backend-node-demo`（Node.js/Express）
- HTTP Service: `examples/frontend-only-demo`（静态文件服务）
- Standalone: `examples/python-standalone-demo`（PySide6/Qt）

---

## 关键依赖与配置

### 核心依赖
- **Electron 38.4.0**：主进程 + 渲染进程
- **Vite 7**：构建工具（`vite-plugin-electron`）
- **React 19**：UI 框架
- **Electron Store**：持久化存储
- **Electron Log**：日志记录
- **@booltox/shared**：共享类型

**注意**：新架构中工具完全独立，不再依赖 `@booltox/plugin-sdk`。

### 配置文件
- `vite.config.ts`：Vite + Electron 工具配置
- `electron-builder.yml`：打包配置（未找到，可能在 `package.json` 中）
- `tsconfig.json`：TypeScript 配置

### 构建产物
- `dist-electron/`：Electron Main 编译后代码
- `release/`：最终安装包（.exe/.dmg/.AppImage）

---

## 数据模型

### 模块（Module）
- **类型定义**：`src/renderer/types/module.ts`
- **存储**：`electron-store`（本地 JSON）

### 系统信息
- **类型定义**：`src/renderer/types/system.ts`
- **Hooks**：`src/renderer/hooks/use-system-info.ts`

### 活动记录
- **类型定义**：`src/renderer/types/common.ts`
- **Hooks**：`src/renderer/hooks/use-activity-feed.ts`

---

## 测试与质量

### 当前状态
- ✅ Jest + React Testing Library
  - 配置：`jest.config.js`
  - 运行：`pnpm test`
- ✅ ESLint：`pnpm lint`
- ✅ Prettier：`pnpm format:check`

### 测试覆盖
- ⚠️ 当前覆盖率较低（未找到测试文件）
- 建议优先测试：模块安装流程、IPC 通信、错误处理

---

## 常见问题（FAQ）

### Q1：如何调试 Electron Main 进程？
**A**：
1. 添加 `--inspect` 到 Electron 启动命令
2. 使用 Chrome DevTools 连接

### Q2：如何添加新的 IPC 通道？
**A**：
1. 在 `src/shared/constants/ipc-channels.ts` 中定义
2. 在 Main 进程中注册 handler
3. 在 Renderer 中通过 `window.api` 调用

### Q3：打包失败如何排查？
**A**：
1. 检查 `package.json` 中的 `build` 配置
2. 确保 `uv` 可执行文件已下载（`pnpm prepare:uv`）
3. 查看 `release/` 目录的错误日志

### Q4：如何添加新工具？
**A**：
1. 创建工具目录，编写 `manifest.json`
2. 选择运行模式：
   - **http-service**：工具提供 HTTP 服务，在浏览器中运行
   - **standalone**：工具创建自己的原生窗口
3. 参考示例工具：
   - Python/FastAPI: `examples/backend-demo`
   - Node.js/Express: `examples/backend-node-demo`
   - 静态服务: `examples/frontend-only-demo`
   - Qt 原生: `examples/python-standalone-demo`

**重要**：工具必须完全独立，可以手动运行（如 `python main.py` 或 `node server.js`），不依赖 BoolTox SDK。

---

## 相关文件清单

### 核心目录
- `src/main/`：Electron Main 进程
- `src/renderer/`：React UI（Renderer 进程）
- `src/shared/`：Main/Renderer 共享代码
- `resources/`：静态资源（uv 可执行文件、图标）
- `scripts/`：构建脚本（下载 uv、生成 manifest）

### 关键文件
- `src/main/error-handler.ts`：全局错误捕获
- `src/main/logger.ts`：日志管理
- `src/renderer/main.tsx`：React 根组件
- `src/renderer/lib/backend-client.ts`：后端 API 客户端
- `src/renderer/components/module-center/`：模块管理 UI

---

## 下一步建议

- ✅ 已覆盖：进程管理架构、工具运行模式（http-service/standalone）
- ✅ 核心职责：工具市场 + 进程调度 + 浏览器集成
- ⚠️ 待补充：具体进程管理逻辑（需读取 `electron/services/tool/tool-runner.ts`）
- 🔍 推荐操作：
  1. 运行 `pnpm dev` 启动客户端
  2. 安装示例工具测试新架构
  3. 查看 `examples/` 目录了解工具开发模式

**新架构核心优势**：
- 工具完全独立，可独立测试和发布
- 在浏览器中运行，零兼容问题
- BoolTox 职责清晰：进程管理 + 工具市场
