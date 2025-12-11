# @booltox/client - Electron 客户端

> [根目录](../../CLAUDE.md) > [packages](./) > **client**

---

## 变更记录（Changelog）

| 时间 | 操作 | 说明 |
|------|------|------|
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

BoolTox 的 **可选本地 Agent（Electron 客户端）**，提供：
- **原生系统权限**：文件操作、进程调度、系统通知
- **工具运行时**：Python/TypeScript 工具的本地执行环境
- **高性能计算**：避免浏览器沙箱限制
- **自动更新**：基于 Electron Updater

**核心特性**：
- Electron 38.4.0 + Vite 7
- React 19 + Framer Motion
- 内置 uv（Python 包管理器）
- 模块中心（安装/管理工具）

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

### 模块管理 API
- **安装模块**：通过后端 API（`src/renderer/lib/backend-client.ts`）
- **运行模块**：启动 Python/TypeScript 进程

### 工具 SDK 集成
- 依赖 `@booltox/plugin-sdk`（运行时 API）
- 工具通过 PostMessage 与 Client 通信

---

## 关键依赖与配置

### 核心依赖
- **Electron 38.4.0**：主进程 + 渲染进程
- **Vite 7**：构建工具（`vite-plugin-electron`）
- **React 19**：UI 框架
- **Electron Store**：持久化存储
- **Electron Log**：日志记录
- **@booltox/shared**：共享类型

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

### Q4：如何集成新的工具类型？
**A**：
1. 扩展 `@booltox/shared` 中的 `ModuleType`
2. 在 Client 中添加对应的运行时逻辑
3. 更新 `@booltox/plugin-sdk` 的 API

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

- ✅ 已覆盖：架构概览、IPC 通信、模块管理
- ⚠️ 待补充：具体 Main 进程逻辑（需读取完整 `src/main/main.ts`）
- 🔍 推荐操作：运行 `pnpm dev` 后体验模块安装流程，了解完整交互
