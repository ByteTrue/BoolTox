# 通用依赖安装器 - 完整实现总结

## 🎯 实现目标

将 BoolTox 的依赖管理从"Python 专用"升级为**支持多语言的通用系统**，为未来扩展更多语言（如 Rust、Go 等）打下基础。

## ✅ 已完成的工作

### 1. 创建通用依赖安装器

**文件**: `electron/windows/deps-installer.ts`（新建）

**核心设计**：
```typescript
export type LanguageType = 'python' | 'node';  // 可扩展：'rust' | 'go' | 'deno'

export interface DepsInstallerOptions {
  toolId: string;
  toolName: string;
  toolPath: string;
  language: LanguageType;  // ✨ 关键：支持多语言
  // 语言特定配置
  requirementsPath?: string;  // Python
  packageJsonPath?: string;   // Node.js
}

export async function showDepsInstaller(
  options: DepsInstallerOptions
): Promise<InstallResult>
```

**功能特性**：
- ✅ **多语言支持**：Python、Node.js（可扩展）
- ✅ **统一 UI**：相同的窗口布局和交互
- ✅ **镜像源选择**：支持 PyPI 和 npm 镜像
- ✅ **实时日志**：安装过程可视化
- ✅ **用户控制**：可取消、可重试

**语言特定处理**：
```typescript
// 根据语言类型调用不同的安装逻辑
if (language === 'python') {
  await installPythonDeps(...);  // 调用 pythonManager
} else if (language === 'node') {
  await installNodeDeps(...);     // 调用 npm install
}
```

### 2. 集成到工具运行器

**文件**: `electron/services/tool/tool-runner.ts`

**Node.js 依赖检查**（444-483 行）：
```typescript
if (backendConfig.type === 'node') {
  const hasPackageJson = await fsPromises.access('package.json');
  const hasNodeModules = await fsPromises.access('node_modules');

  if (hasPackageJson && !hasNodeModules) {
    // 显示通用依赖安装窗口 ✨
    const { showDepsInstaller } = await import('../../windows/deps-installer.js');
    const result = await showDepsInstaller({
      toolId,
      toolName: state.runtime.manifest.name,
      toolPath: state.runtime.path,
      language: 'node',  // ✨ 指定语言
      packageJsonPath,
    });

    if (!result.success) {
      throw new Error('用户取消了依赖安装');
    }
  }
}
```

**Python 依赖检查**（485-514 行）：
```typescript
if (backendConfig.type === 'python' && needsSetup) {
  // 使用通用依赖安装窗口 ✨
  const { showDepsInstaller } = await import('../../windows/deps-installer.js');
  const result = await showDepsInstaller({
    toolId,
    toolName: state.runtime.manifest.name,
    toolPath: state.runtime.path,
    language: 'python',  // ✨ 指定语言
    requirementsPath,
  });
}
```

### 3. 集成到工具安装器

**文件**: `electron/services/tool/tool-installer.ts`

**生产环境安装**（129-156 行）：
```typescript
// 用户从工具市场下载工具后
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

if (manifest.runtime?.backend?.type === 'node') {
  const hasPackageJson = await fs.access('package.json');

  if (hasPackageJson && window) {
    // 显示通用依赖安装窗口 ✨
    const { showDepsInstaller } = await import('../../windows/deps-installer.js');
    const result = await showDepsInstaller({
      toolId: id,
      toolName: manifest.name,
      toolPath: toolDir,
      language: 'node',
      packageJsonPath,
    });

    if (!result.success) {
      throw new Error('依赖安装失败');
    }
  }
}
```

### 4. 更新打包脚本

**文件**: `scripts/package-tool.mjs`（98-104 行）

```javascript
// 打包时包含 package.json
['README.md', 'requirements.txt', 'package.json'].forEach((file) => {
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });  // ✅
  }
});
```

---

## 🏗️ 架构设计

### 统一的依赖管理流程

```
工具启动
  ↓
检测工具类型（Python/Node.js）
  ↓
检测依赖文件（requirements.txt/package.json）
  ↓
检测依赖环境（venv/node_modules）
  ↓
缺失？ ─── 否 ──→ 直接启动工具 ✅
  │
  是
  ↓
显示通用依赖安装窗口 🪟
  ├─ Python: 显示 requirements.txt + PyPI 镜像选择
  └─ Node.js: 显示 package.json + npm 镜像选择
  ↓
用户点击"开始安装"
  ↓
调用语言特定安装器
  ├─ Python: pythonManager.ensureToolEnv()
  └─ Node.js: spawn('npm', ['install', ...])
  ↓
实时显示日志
  ↓
安装完成 ✅
  ↓
关闭窗口，启动工具
```

### 扩展性设计

要添加新语言支持（如 Rust、Go），只需：

1. **添加语言类型**：
   ```typescript
   export type LanguageType = 'python' | 'node' | 'rust' | 'go';
   ```

2. **添加安装逻辑**：
   ```typescript
   async function installRustDeps(toolId, toolPath, sendLog) {
     sendLog('🦀 开始安装 Rust 依赖...');
     const cargoProcess = spawn('cargo', ['build', '--release'], {
       cwd: toolPath,
       stdio: 'pipe',
     });
     // ... 处理进程输出
   }
   ```

3. **添加 UI 配置**：
   ```typescript
   const langConfig = {
     rust: {
       icon: '🦀',
       title: 'Rust 依赖安装',
       envLabel: 'target/ 目录',
       depsLabel: '依赖列表 (Cargo.toml)',
       mirrorOptions: [
         { value: '', label: '默认 (crates.io)' },
         { value: 'https://mirrors.ustc.edu.cn/crates.io-index', label: '中科大' },
       ],
     },
   };
   ```

4. **更新调用方**：
   ```typescript
   if (backendConfig.type === 'rust') {
     await showDepsInstaller({
       language: 'rust',
       cargoTomlPath: 'Cargo.toml',
     });
   }
   ```

---

## 📊 对比：旧 vs 新

### 旧方案（仅 Python）

```
python-deps-installer.ts
  ├─ showPythonDepsInstaller()  // Python 专用
  ├─ installPythonDeps()        // 硬编码
  └─ generateInstallerHTML()    // Python 专用 UI
```

**问题**：
- ❌ 只支持 Python
- ❌ Node.js 使用不同的实现（静默安装）
- ❌ 每种语言需要单独实现窗口

### 新方案（通用）

```
deps-installer.ts
  ├─ showDepsInstaller(language)     // 通用入口 ✨
  ├─ installPythonDeps()             // Python 实现
  ├─ installNodeDeps()               // Node.js 实现
  ├─ installRustDeps()               // 未来：Rust 实现
  └─ generateInstallerHTML(langConfig)  // 通用 UI ✨
```

**优势**：
- ✅ 统一的用户体验
- ✅ 代码复用（窗口、日志、错误处理）
- ✅ 易于扩展新语言
- ✅ 配置驱动（langConfig）

---

## 🎨 UI 设计

### 窗口布局（统一）

```
┌────────────────────────────────────────────────┐
│  {icon} {toolName} - {language} 依赖安装         │  ← 标题栏
├────────────────────────────────────────────────┤
│  左侧 (320px)         │  右侧 (flex-1)          │
│  ┌──────────────────┐│  ┌──────────────────┐  │
│  │ 📦 环境状态       ││  │ 📝 安装日志       │  │
│  │ ✓ 已创建/⚠ 未创建││  │                  │  │
│  │ /path/to/env     ││  │ (实时滚动)       │  │
│  ├──────────────────┤│  │                  │  │
│  │ 🌐 镜像源         ││  │                  │  │
│  │ [下拉选择框]      ││  │                  │  │
│  ├──────────────────┤│  │                  │  │
│  │ 📋 依赖列表       ││  │                  │  │
│  │ (可滚动)         ││  │                  │  │
│  └──────────────────┘│  └──────────────────┘  │
├────────────────────────────────────────────────┤
│             [取消]  [开始安装]                   │  ← 底部按钮
└────────────────────────────────────────────────┘
```

### 语言特定配置

| 语言 | 图标 | 环境目录 | 依赖文件 | 镜像源 |
|------|------|---------|---------|--------|
| Python | 🐍 | venv/ | requirements.txt | PyPI 镜像 |
| Node.js | 📦 | node_modules/ | package.json | npm 镜像 |
| Rust | 🦀 | target/ | Cargo.toml | crates.io 镜像 |
| Go | 🐹 | go.mod | go.mod | GOPROXY 镜像 |

---

## 📦 文件清单

### 新增文件
- ✅ `electron/windows/deps-installer.ts` - 通用依赖安装器（540 行）
- ✅ `docs/features/auto-dependency-install.md` - 功能说明文档
- ✅ `docs/implementation/node-deps-auto-install.md` - 实现细节
- ✅ `docs/testing/deps-installer-test-guide.md` - 测试指南

### 修改文件
- ✅ `scripts/package-tool.mjs` - 打包时包含 package.json
- ✅ `electron/services/tool/tool-installer.ts` - 使用通用安装器
- ✅ `electron/services/tool/tool-runner.ts` - 使用通用安装器

### 保留文件
- 📝 `electron/windows/python-deps-installer.ts` - 旧的 Python 安装器（暂时保留，待完全迁移后删除）

---

## 🚀 测试准备

### 已完成
1. ✅ 代码实现完成
2. ✅ 客户端构建成功
3. ✅ 删除测试工具依赖（backend-node-demo）
4. ✅ 创建测试指南文档

### 测试方法

**立即测试**：
```bash
# 已经运行了构建，现在启动客户端
pnpm dev:client

# 在 BoolTox 中点击"正则表达式测试器"
# 应该会弹出新的依赖安装窗口 🪟
```

**预期效果**：
1. 弹出窗口：📦 正则表达式测试器 - Node.js 依赖安装
2. 左侧显示：
   - 依赖目录状态（⚠ 未创建）
   - 镜像源选择（默认 npm 官方）
   - 依赖列表（express、@types/express 等）
3. 点击"开始安装"
4. 右侧实时显示 npm install 日志
5. 安装完成后自动关闭窗口
6. 工具在浏览器中打开 ✅

---

## 🎉 核心优势

### 1. 统一体验
- Python 和 Node.js 工具使用相同的安装窗口
- 统一的交互流程和视觉设计
- 用户学习成本低

### 2. 可扩展性
- 添加新语言只需修改一个文件（`deps-installer.ts`）
- 配置驱动（`langConfig`）
- 安装逻辑解耦（`installXxxDeps` 函数）

### 3. 开发友好
- 开发环境自动安装依赖（无需手动运行脚本）
- 生产环境自动安装依赖（用户无感知）
- 详细的日志输出便于调试

### 4. 用户友好
- 可视化安装过程
- 支持镜像源加速（国内用户友好）
- 可取消安装
- 安装失败有清晰提示

---

## 🔮 未来扩展

### 支持更多语言

只需在 `deps-installer.ts` 中添加：

```typescript
// 1. 添加类型
export type LanguageType = 'python' | 'node' | 'rust' | 'go' | 'deno';

// 2. 添加安装函数
async function installRustDeps(toolId, toolPath, sendLog) {
  sendLog('🦀 开始安装 Rust 依赖...');
  const cargoProcess = spawn('cargo', ['build', '--release'], { cwd: toolPath });
  // ...
}

// 3. 添加 UI 配置
const langConfig = {
  rust: { icon: '🦀', title: 'Rust 依赖安装', ... },
};

// 4. 更新安装逻辑
if (language === 'rust') {
  await installRustDeps(...);
}
```

### 支持更多功能

- 依赖缓存（避免重复下载）
- 离线安装（预下载依赖包）
- 依赖更新检测
- 多版本管理

---

## 📚 相关文档

- [功能说明](../features/auto-dependency-install.md) - 功能概述
- [实现细节](../implementation/node-deps-auto-install.md) - 技术实现
- [测试指南](../testing/deps-installer-test-guide.md) - 测试步骤
- [示例工具 README](../../packages/client/examples/README.md) - 工具开发指南

---

## 🎯 下一步

1. **测试 Node.js 依赖安装**
   - 删除 backend-node-demo 的 node_modules
   - 启动工具，观察依赖安装窗口
   - 验证安装成功后工具正常运行

2. **测试 Python 依赖安装**
   - 删除 Python venv
   - 启动 backend-demo
   - 验证新窗口与旧窗口行为一致

3. **性能测试**
   - 大量依赖时的安装速度
   - 镜像源切换效果
   - 日志输出性能

4. **删除旧文件**（可选）
   - 完全迁移后可删除 `python-deps-installer.ts`
   - 更新所有引用

---

**实现完成！现在可以启动 BoolTox 测试新的通用依赖安装器了。** 🎉
