# Node.js 工具依赖自动安装功能

## 🎯 功能概述

BoolTox 2.0 现在支持 Node.js 工具的依赖自动安装，确保工具在生产和开发环境都能正常运行。

## 🔧 实现原理

### 1. 打包时（开发者）

**文件**: `scripts/package-tool.mjs`

打包工具时会包含 `package.json`：

```javascript
// 打包内容
archive.file('manifest.json');  // 工具配置
archive.file('package.json');   // ✅ Node.js 依赖声明
archive.directory('dist/');     // 前端构建文件
archive.directory('backend/');  // 后端代码
```

**注意**：不包含 `node_modules`（避免体积过大）

### 2. 安装时（生产环境）

**文件**: `electron/services/tool/tool-installer.ts`

用户从工具市场下载工具时，BoolTox 会：

```typescript
async installTool(entry) {
  // 1. 下载 ZIP
  await this.downloadFile(downloadUrl, tempZipPath);

  // 2. 解压
  await this.extractZip(tempZipPath, toolDir);

  // 3. 验证 manifest
  await this.validateManifest(manifestPath, id);

  // 4. 安装依赖（新增）✅
  if (manifest.runtime.backend.type === 'node') {
    const hasPackageJson = await fs.access('package.json');
    if (hasPackageJson) {
      await this.installNodeDependencies(toolDir);
      // 执行: npm install --legacy-peer-deps --no-audit --no-fund
    }
  }

  // 5. 完成
}
```

### 3. 启动时（开发环境友好）

**文件**: `electron/services/tool/tool-runner.ts`

启动工具前，BoolTox 会自动检查并安装依赖：

```typescript
async launchHttpServiceTool(state) {
  const backendConfig = runtimeConfig.backend;

  // Node.js 依赖检查（新增）✅
  if (backendConfig.type === 'node') {
    const hasPackageJson = await fs.access('package.json');
    const hasNodeModules = await fs.access('node_modules');

    if (hasPackageJson && !hasNodeModules) {
      // 自动安装依赖
      await this.installNodeDependencies(toolDir);
    }
  }

  // Python 依赖检查（已有）
  if (backendConfig.type === 'python') {
    // ... 现有的 Python 依赖安装逻辑
  }

  // 启动后端进程
  spawn('node', [entryPath, ...args]);
}
```

## 📊 工作流程对比

### 生产环境（用户下载工具）

```
用户点击"安装"
    ↓
下载工具 ZIP
    ↓
解压到 ~/Library/Application Support/@booltox/client/tools/com.xxx/
    ↓
检测到 package.json
    ↓
自动运行 npm install  ← ✅ 自动
    ↓
安装完成
    ↓
用户点击"启动"
    ↓
工具正常运行 ✅
```

### 开发环境（本地开发）

```
开发者添加新工具到 examples/
    ↓
启动 BoolTox 客户端
    ↓
点击工具"启动"
    ↓
检测到 package.json 但无 node_modules
    ↓
自动运行 npm install  ← ✅ 自动
    ↓
工具正常运行 ✅
```

## 🎯 核心优势

### 1. 开发者友好
- ❌ 旧方式：开发者必须手动运行 `npm install`
- ✅ 新方式：BoolTox 自动检测并安装

### 2. 生产环境可靠
- ❌ 旧方式：依赖 pnpm workspace（开发环境问题）
- ✅ 新方式：每个工具独立 `node_modules`

### 3. 统一体验
- Python 工具：自动安装 `requirements.txt` 依赖
- Node.js 工具：自动安装 `package.json` 依赖
- 用户无需关心依赖管理

## 📝 技术细节

### installNodeDependencies() 实现

```typescript
private async installNodeDependencies(toolDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 使用 npm install（不使用 pnpm，确保独立依赖）
    const npmProcess = spawn('npm', [
      'install',
      '--legacy-peer-deps',  // 兼容旧版 peer 依赖
      '--no-audit',           // 跳过安全审计（加快速度）
      '--no-fund',            // 跳过资金信息（减少输出）
    ], {
      cwd: toolDir,
      shell: true,
      stdio: 'pipe',
    });

    npmProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Node.js 依赖安装成功');
        resolve();
      } else {
        reject(new Error(`npm install 失败 (退出码: ${code})`));
      }
    });
  });
}
```

### 为什么使用 npm 而不是 pnpm？

1. **避免 workspace 影响**：pnpm 会检查上层 `pnpm-workspace.yaml`
2. **真实 node_modules**：npm 创建真实目录，不是软链接
3. **工具独立性**：每个工具有完整的独立依赖
4. **兼容性更好**：npm 是 Node.js 默认包管理器

## ⚠️ 注意事项

### 1. package.json 必须存在

工具必须包含 `package.json`：

```json
{
  "name": "@booltox/tool-xxx",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.21.2"  // 运行时依赖
  }
}
```

### 2. 开发依赖会被安装

`npm install` 会安装所有依赖（包括 devDependencies），如果想优化可以使用：

```bash
npm install --production  # 只安装生产依赖
```

但当前实现安装全部依赖，确保工具能正常运行。

### 3. 网络要求

安装依赖需要网络连接访问 npm registry，离线环境可能失败。

## 🧪 测试方法

### 测试自动安装（开发环境）

1. 删除工具的 node_modules：
   ```bash
   cd examples/backend-node-demo
   rm -rf node_modules
   ```

2. 启动 BoolTox 客户端

3. 点击工具启动按钮

4. 观察日志，应该看到：
   ```
   [ToolRunner] 工具 com.xxx 缺少 node_modules，开始安装依赖...
   [ToolRunner] [npm] installing dependencies...
   [ToolRunner] Node.js 依赖安装成功
   [ToolRunner] 后端进程已启动
   ```

5. 工具正常运行 ✅

### 测试打包（生产环境模拟）

1. 打包工具：
   ```bash
   cd packages/client
   pnpm tool:pack com.booltox.frontend-only-demo
   ```

2. 检查 ZIP 内容：
   ```bash
   unzip -l resources/plugins/com.booltox.frontend-only-demo/plugin.zip
   ```

3. 应该包含：
   - ✅ manifest.json
   - ✅ package.json  ← 关键
   - ✅ dist/
   - ✅ server.js（或 backend/）
   - ❌ 不包含 node_modules

## 🎉 总结

现在 BoolTox 对 Node.js 和 Python 工具都有完整的依赖管理：

| 工具类型 | 依赖声明 | 自动安装时机 |
|---------|---------|------------|
| **Python** | requirements.txt | 安装时 + 启动时 |
| **Node.js** | package.json | 安装时 + 启动时 ✅ |

开发者和用户都不需要手动管理依赖！
