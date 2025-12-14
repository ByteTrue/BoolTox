# 旧架构残留清理计划

## 🎯 清理目标

删除所有与旧架构（webview + plugin-sdk）相关的文件和目录，保持代码库干净。

---

## 📋 可以删除的目录

### 1. ✅ /packages/tool-sdk/
**状态**: 已废弃（README 和 CLAUDE.md 已标记）
**原因**: 新架构工具完全独立，不依赖 BoolTox SDK
**引用检查**: ✅ 无代码引用
**建议**: **可安全删除**

**删除命令**:
```bash
rm -rf /Users/byte/projects/TS/BoolTox/packages/tool-sdk
```

### 2. ⚠️ /sdks/
**内容**:
- `sdks/node/` - Node.js SDK（booltox-backend.cjs）
- `sdks/python/` - Python SDK（booltox_sdk.py）

**状态**: 旧架构的运行时 SDK
**原因**: 新架构工具不需要这些 SDK（工具直接用 HTTP API）
**引用检查**: ✅ 无代码引用
**workspace 配置**: ⚠️ `pnpm-workspace.yaml` 第 3 行引用 `sdks/node`

**建议**: **可安全删除**（删除后需更新 workspace 配置）

**删除命令**:
```bash
rm -rf /Users/byte/projects/TS/BoolTox/sdks
```

---

## 📋 可以删除的文件

### 3. ✅ /packages/client/electron/windows/python-deps-installer.ts
**状态**: 已被通用安装器替代
**替代者**: `deps-installer.ts`（支持 Python 和 Node.js）
**引用检查**: 需要确认是否还有导入

**建议**: **稍后删除**（确认通用安装器完全稳定后）

### 4. ⚠️ /packages/client/electron/preload-tool.ts (已删除)
**状态**: ✅ 已在前面的重构中删除

---

## 📋 保留但标记为废弃的内容

### 1. /packages/shared/src/types/protocol.ts
**内容**: `ToolWebRuntimeConfig` 类型定义
**状态**: ✅ 已标记 `@deprecated`
**原因**: 保持向后兼容，让旧工具能编译通过
**建议**: **保留**（标记废弃即可）

**示例**:
```typescript
/**
 * @deprecated 不再支持 webview 类型，请使用 ToolHttpServiceRuntimeConfig 代替
 * 工具应启动独立 HTTP 服务器，在系统默认浏览器中运行
 */
export interface ToolWebRuntimeConfig {
  type?: 'webview';
  ui: ToolUiRuntime;
  backend?: ToolBackendConfig;
}
```

### 2. /packages/shared/src/types/tool.ts
**内容**: `ToolRuntime.mode?: 'webview' | 'standalone'`
**状态**: ✅ 已更新注释
**建议**: **保留**（类型兼容性）

---

## 🔍 检查清单

### SDK 目录引用检查

- [x] **代码引用**: ✅ 无引用
- [x] **package.json 依赖**: ✅ 无依赖
- [x] **workspace 配置**: ⚠️ `pnpm-workspace.yaml:3` 引用 `sdks/node`

### 旧架构代码残留

- [x] **BrowserView API**: ✅ 无使用（只有注释和错误提示）
- [x] **webview 运行时**: ✅ 已废弃（有 @deprecated 标记）
- [x] **preload-tool.ts**: ✅ 已删除
- [x] **window.booltox.backend**: ✅ 已从工具前端代码移除

### 其他残留

- [x] **.old / .backup 文件**: ✅ 仅 webpack 缓存，可忽略
- [x] **旧的示例工具**: ✅ 已更新为新架构

---

## ✅ 安全删除步骤

### 步骤 1: 删除 packages/tool-sdk

```bash
# 1. 确认无引用
grep -r "tool-sdk" . --exclude-dir=node_modules --exclude-dir=.git

# 2. 删除目录
rm -rf packages/tool-sdk

# 3. 更新 git（如果需要提交）
git rm -r packages/tool-sdk
```

### 步骤 2: 删除 sdks/

```bash
# 1. 确认无引用
grep -r "sdks/node\|sdks/python\|booltox-backend\|booltox_sdk" . --exclude-dir=node_modules --exclude-dir=.git

# 2. 删除目录
rm -rf sdks

# 3. 更新 pnpm-workspace.yaml
# 删除第 3 行：- 'sdks/node'

# 4. 更新 git（如果需要提交）
git rm -r sdks
```

### 步骤 3: 更新 workspace 配置

**文件**: `pnpm-workspace.yaml`

```yaml
packages:
  - 'packages/*'
  # sdks/node 已删除 - 新架构不需要 SDK
```

### 步骤 4: 重新安装依赖（清理 workspace）

```bash
# 清理 pnpm 缓存和锁文件
rm -rf node_modules
rm pnpm-lock.yaml

# 重新安装
pnpm install
```

---

## ⚠️ 注意事项

### 保留的文件（暂时）

1. **python-deps-installer.ts**
   - 原因：通用安装器刚实现，需要验证稳定性
   - 删除时机：确认通用安装器完全正常后（建议 1-2 周后）

2. **@deprecated 类型定义**
   - 原因：保持类型兼容性
   - 删除时机：发布下一个 major 版本时（如 3.0.0）

### 不能删除的文件

1. **extension-host/extension-host.ts**
   - 虽然不再使用 webview，但可能还有其他功能（IPC 通道注册等）
   - 需要检查是否还有其他用途

---

## 📊 清理效果预估

### 磁盘空间
- `packages/tool-sdk/`: ~500KB
- `sdks/`: ~100KB
- 总计: ~600KB（不多，但代码更干净）

### 代码复杂度
- 删除 2 个废弃的包
- workspace 从 4 个包减少到 3 个包
- 更清晰的依赖关系

### 维护成本
- ✅ 减少混淆（新开发者不会误用旧 SDK）
- ✅ 减少文档维护（不需要解释废弃的 SDK）
- ✅ 更快的 CI/CD（少编译一个包）

---

## 🚀 执行建议

### 方案 A: 立即删除（推荐）

**优势**:
- 代码库立即干净
- 避免新开发者误用

**命令**:
```bash
# 1. 删除目录
rm -rf packages/tool-sdk sdks

# 2. 更新 workspace
# 编辑 pnpm-workspace.yaml，删除 'sdks/node'

# 3. 清理并重装
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 4. 验证构建
pnpm build
```

### 方案 B: 保守删除

**步骤**:
1. 先删除 `packages/tool-sdk`（确认无引用）
2. 保留 `sdks/` 一段时间（以防有遗漏）
3. 1-2 周后删除 `sdks/`

---

## ✅ 删除检查表

在删除前确认：

- [ ] 所有示例工具已迁移到新架构（http-service）
- [ ] 通用依赖安装器已测试通过
- [ ] 代码中无 `@booltox/tool-sdk` 引用
- [ ] 代码中无 `sdks/` 引用
- [ ] workspace 配置已更新
- [ ] 构建测试通过（`pnpm build`）
- [ ] 客户端运行正常（`pnpm dev:client`）

---

**准备好删除了吗？我可以帮你执行清理！** 🧹
