# @booltox/shared - 共享类型与工具

> [根目录](../../CLAUDE.md) > [packages](./) > **shared**

---

## 变更记录（Changelog）

| 时间 | 操作 | 说明 |
|------|------|------|
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

**全局类型定义与协议规范**，为 Web、Client、Plugin SDK 提供统一的接口契约：
- **API 类型**：HTTP/WebSocket 请求/响应
- **模块类型**：插件元数据、安装状态
- **协议类型**：JSON-RPC 2.0、插件通信协议
- **日志类型**：结构化日志格式
- **发布类型**：版本管理、更新清单

**核心原则**：
- **向后兼容**：一旦发布，类型不可随意修改
- **类型安全**：所有导出必须有完整的 TypeScript 类型
- **零运行时**：纯类型定义，不包含实现逻辑

---

## 入口与启动

### 开发模式
```bash
pnpm dev
# 监听 TypeScript 编译
```

### 构建
```bash
pnpm build
# 输出：dist/*.js + dist/*.d.ts
```

### 类型检查
```bash
pnpm type-check
# 运行 tsc --noEmit
```

### 导出结构
```typescript
// 从 src/index.ts 重新导出所有类型
export * from './types/api.types.js';
export * from './types/module.types.js';
export * from './types/plugin.js';
export * from './types/protocol.js';
export * from './types/jsonrpc.js';
// ... 其他
```

---

## 对外接口

### 核心类型导出

#### 1. API 类型（`api.types.ts`）
- HTTP/WebSocket 请求/响应格式
- 错误码定义

#### 2. 模块类型（`module.types.ts`）
- `ModuleMetadata`：插件元数据
- `ModuleType`：插件类型枚举（TypeScript/Python/混合）
- `ModuleStatus`：安装/运行状态

#### 3. 插件协议（`plugin.ts`、`protocol.ts`）
- `PluginMessage`：PostMessage 通信格式
- `PluginLifecycle`：生命周期事件

#### 4. JSON-RPC（`jsonrpc.ts`）
- `JSONRPCRequest`/`JSONRPCResponse`
- 标准 JSON-RPC 2.0 实现

#### 5. 日志类型（`log.types.ts`）
- `LogLevel`：日志级别
- `LogEntry`：结构化日志条目

#### 6. 发布类型（`release.types.ts`）
- `ReleaseManifest`：版本清单
- `UpdateInfo`：更新信息

---

## 关键依赖与配置

### 依赖
- **零依赖**：纯 TypeScript 类型定义

### 配置文件
- `tsconfig.json`：TypeScript 配置（严格模式）
- `package.json`：导出路径配置（`exports` 字段）

### 导出路径
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./types/*": {
      "types": "./dist/types/*.d.ts",
      "import": "./dist/types/*.js"
    }
  }
}
```

---

## 数据模型

### 模块元数据（ModuleMetadata）
```typescript
interface ModuleMetadata {
  id: string;
  name: string;
  version: string;
  type: ModuleType;
  description?: string;
  // ...
}
```

### JSON-RPC 消息
```typescript
interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number;
}
```

### 插件通信协议
```typescript
interface PluginMessage {
  type: 'request' | 'response' | 'event';
  payload: any;
}
```

---

## 测试与质量

### 当前状态
- ✅ TypeScript 严格模式
- ✅ 类型检查：`pnpm type-check`
- ❌ 无单元测试（纯类型定义无需测试）

### 质量保证
- 所有导出类型必须有 JSDoc 注释
- 禁止使用 `any`（除非明确标注 `@ts-expect-error`）
- 向后兼容：新增字段使用可选属性

---

## 常见问题（FAQ）

### Q1：如何添加新类型？
**A**：
1. 在 `src/types/` 下创建新文件（如 `new-feature.types.ts`）
2. 导出类型（使用 `export interface` 或 `export type`）
3. 在 `src/index.ts` 中重新导出：`export * from './types/new-feature.types.js'`
4. 运行 `pnpm build` 和 `pnpm type-check`

### Q2：如何修改已有类型？
**A**：
- ⚠️ **谨慎修改**：已发布类型是合约，修改可能破坏下游依赖
- ✅ 推荐：添加新字段（可选），废弃旧字段（标记 `@deprecated`）
- ❌ 禁止：删除字段、修改字段类型

### Q3：为什么导出路径用 `.js` 后缀？
**A**：因为 `type: "module"`（ESM），TypeScript 要求导入路径使用 `.js` 后缀（编译后会是真实的 `.js` 文件）。

### Q4：如何保证类型安全？
**A**：
1. 启用 TypeScript 严格模式（`strict: true`）
2. 使用 `pnpm type-check` 在 CI 中校验
3. 下游项目（Web/Client/Plugin SDK）依赖此包，编译时自动检查

---

## 相关文件清单

### 核心目录
- `src/types/`：所有类型定义文件
- `src/index.ts`：统一导出入口

### 关键文件
- `src/types/api.types.ts`：API 接口类型
- `src/types/module.types.ts`：模块/插件类型
- `src/types/plugin.ts`：插件协议
- `src/types/jsonrpc.ts`：JSON-RPC 2.0
- `src/types/log.types.ts`：日志类型
- `src/types/release.types.ts`：发布/更新类型

---

## 下一步建议

- ✅ 已覆盖：核心类型导出、向后兼容策略
- ⚠️ 待补充：如需新增协议，参考 `plugin.ts` 和 `protocol.ts` 的设计
- 🔍 推荐操作：运行 `pnpm build` 后检查 `dist/` 目录，确保类型声明正确生成
