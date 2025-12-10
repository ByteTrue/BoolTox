# @booltox/plugin-sdk - 插件开发 SDK

> [根目录](../../CLAUDE.md) > [packages](./) > **plugin-sdk**

---

## 变更记录（Changelog）

| 时间 | 操作 | 说明 |
|------|------|------|
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

**为插件开发者提供类型安全的运行时 API 封装**：
- **前端 API**：插件 UI 与 BoolTox Client 通信（`api.ts`）
- **后端 API**：插件后端服务调用（`backend.ts`）
- **React Hooks**：简化插件开发的 Hooks（`hooks.ts`）
- **类型定义**：重导出 `@booltox/shared` 的类型

**核心理念**：
- **运行时无依赖**：插件打包后不携带 SDK 代码（BoolTox 提供运行时）
- **类型安全**：所有 API 有完整 TypeScript 类型
- **向后兼容**：API 一旦发布，不可破坏性修改

---

## 入口与启动

### 开发模式
```bash
pnpm dev
# 监听 tsup 编译
```

### 构建
```bash
pnpm build
# 输出：dist/*.js + dist/*.d.ts
```

### 类型检查
```bash
pnpm typecheck
# 运行 tsc --noEmit
```

### 导出结构
```typescript
// 从 src/index.ts 导出
export {
  isBooltoxAvailable,
  getBooltoxAPI,
  BooltoxClient,
  booltox,
} from './api.js';

export { BackendClient, createBackendClient } from './backend.js';

export {
  useStorage,
  useBackend,
  useBackendEvent,
  useBackendCall,
  useWindowTitle,
} from './hooks.js';

export type * from '@booltox/shared';
```

---

## 对外接口

### 1. 前端 API（`api.ts`）

#### `isBooltoxAvailable(): boolean`
检测 BoolTox 运行时是否可用（Web 或 Client 环境）。

#### `getBooltoxAPI(): BooltoxAPI | null`
获取 BoolTox 全局 API 对象（挂载在 `window.booltox`）。

#### `BooltoxClient` 类
插件客户端，封装常用方法：
- `storage.get(key)` / `storage.set(key, value)`：持久化存储
- `ui.showToast(message)`：显示通知
- `window.setTitle(title)`：设置窗口标题

#### `booltox` 单例
默认导出的 `BooltoxClient` 实例，插件直接使用：
```typescript
import { booltox } from '@booltox/plugin-sdk';

await booltox.storage.set('key', 'value');
```

---

### 2. 后端 API（`backend.ts`）

#### `BackendClient` 类
插件后端服务客户端（通过 JSON-RPC 2.0 通信）：
- `call(method, params)`：调用后端方法
- `on(event, handler)`：监听后端事件

#### `createBackendClient(url: string): BackendClient`
创建后端客户端实例：
```typescript
import { createBackendClient } from '@booltox/plugin-sdk';

const backend = createBackendClient('http://localhost:9527/rpc');
const result = await backend.call('plugin.install', { id: 'xxx' });
```

---

### 3. React Hooks（`hooks.ts`）

#### `useStorage<T>(key: string, initialValue?: T)`
持久化存储 Hook（类似 `useState`）：
```typescript
const [count, setCount] = useStorage('counter', 0);
```

#### `useBackend(url: string)`
自动管理 `BackendClient` 生命周期。

#### `useBackendEvent(backend, event, handler)`
监听后端事件（自动清理）。

#### `useBackendCall(backend, method, params)`
自动执行后端调用（支持 loading/error 状态）。

#### `useWindowTitle(title: string)`
设置窗口标题（自动清理）。

---

## 关键依赖与配置

### 依赖
- `@booltox/shared`：类型定义（workspace 依赖）
- `react`：peerDependency（可选，仅用于 Hooks）

### 配置文件
- `tsconfig.json`：TypeScript 配置
- `tsup.config.ts`（或 package.json 中的 `tsup` 字段）

### 导出路径
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./api": "./dist/api.js",
    "./backend": "./dist/backend.js",
    "./hooks": "./dist/hooks.js",
    "./types": "./dist/types.js"
  }
}
```

---

## 数据模型

### Booltox API 对象
```typescript
interface BooltoxAPI {
  storage: {
    get(key: string): Promise<any>;
    set(key: string, value: any): Promise<void>;
  };
  ui: {
    showToast(message: string): void;
  };
  window: {
    setTitle(title: string): void;
  };
}
```

### JSON-RPC 调用
```typescript
interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id: string | number;
}
```

---

## 测试与质量

### 当前状态
- ✅ TypeScript 严格模式
- ✅ 类型检查：`pnpm typecheck`
- ❌ 无单元测试（建议添加）

### 建议改进
1. 添加 Vitest 单元测试
2. Mock `window.booltox` 测试 `api.ts`
3. 测试 Hooks（使用 `@testing-library/react-hooks`）

---

## 常见问题（FAQ）

### Q1：插件如何使用 SDK？
**A**：
```bash
pnpm add @booltox/plugin-sdk
```
然后导入：
```typescript
import { booltox } from '@booltox/plugin-sdk';
```

### Q2：为什么运行时报错 `window.booltox` 不存在？
**A**：
- 检查插件是否在 BoolTox Client 中运行
- 使用 `isBooltoxAvailable()` 判断环境

### Q3：如何添加新 API？
**A**：
1. 在 `src/api.ts` 中扩展 `BooltoxClient` 类
2. 更新 `@booltox/shared` 中的类型定义
3. 在 BoolTox Client 中实现对应功能
4. 发布新版本 SDK

### Q4：Hooks 可以在非 React 环境使用吗？
**A**：不可以，Hooks 依赖 React。非 React 插件应直接使用 `api.ts` 和 `backend.ts`。

---

## 相关文件清单

### 核心目录
- `src/api.ts`：前端 API 封装
- `src/backend.ts`：后端 API 客户端
- `src/hooks.ts`：React Hooks
- `src/index.ts`：统一导出入口

### 关键文件
- `src/api.ts`：`BooltoxClient` 类实现
- `src/backend.ts`：`BackendClient` 类实现
- `src/hooks.ts`：`useStorage` 等 Hooks

---

## 下一步建议

- ✅ 已覆盖：核心 API、Hooks 使用方法
- ⚠️ 待补充：实际插件开发示例（参考 `booltox-plugins` 仓库）
- 🔍 推荐操作：查看 `docs/plugins/development-guide.md` 了解完整开发流程
