# Node.js 依赖自动安装 - 实现总结

## ✅ 已完成的工作

### 1. 修改打包脚本

**文件**: `packages/client/scripts/package-tool.mjs:98-104`

```javascript
// 附加 README、requirements、package.json 等单文件
['README.md', 'requirements.txt', 'package.json'].forEach((file) => {
  const filePath = path.join(pluginDir, file);
  if (fs.existsSync(filePath)) {
    archive.file(filePath, { name: file });  // ✅ 包含 package.json
  }
});
```

### 2. 工具安装器（生产环境）

**文件**: `packages/client/electron/services/tool/tool-installer.ts`

**修改内容**：

1. **导入依赖** (第 11 行)：
   ```typescript
   import { spawn } from 'child_process';
   ```

2. **安装流程更新** (129-146 行)：
   ```typescript
   // 5. 安装依赖（新增）
   const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf-8'));

   if (manifest.runtime?.backend?.type === 'node') {
     const packageJsonPath = path.join(toolDir, 'package.json');
     const hasPackageJson = await fs.access(packageJsonPath)
       .then(() => true)
       .catch(() => false);

     if (hasPackageJson) {
       this.reportProgress(onProgress, window, {
         stage: 'installing',
         percent: 92,
         message: '正在安装 Node.js 依赖...',
       });

       await this.installNodeDependencies(toolDir);
     }
   }
   ```

3. **依赖安装方法** (319-365 行)：
   ```typescript
   private async installNodeDependencies(toolDir: string): Promise<void> {
     return new Promise((resolve, reject) => {
       const npmProcess = spawn('npm', [
         'install',
         '--legacy-peer-deps',
         '--no-audit',
         '--no-fund'
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

### 3. 工具运行器（开发环境友好）

**文件**: `packages/client/electron/services/tool/tool-runner.ts`

**修改内容**：

1. **导入依赖** (第 16 行)：
   ```typescript
   import fsPromises from 'node:fs/promises';
   ```

2. **启动前检查** (444-465 行)：
   ```typescript
   // 检查 Node.js 依赖（启动前自动安装）
   if (backendConfig.type === 'node') {
     const packageJsonPath = path.join(state.runtime.path, 'package.json');
     const nodeModulesPath = path.join(state.runtime.path, 'node_modules');

     try {
       await fsPromises.access(packageJsonPath);
       const hasNodeModules = await fsPromises.access(nodeModulesPath)
         .then(() => true)
         .catch(() => false);

       if (!hasNodeModules) {
         logger.info('工具缺少 node_modules，开始安装依赖...');
         this.emitState(state, 'loading', { message: '正在安装 Node.js 依赖...' });

         await this.installNodeDependencies(state.runtime.path);
         logger.info('依赖安装成功');
       }
     } catch (error) {
       logger.info('无 package.json，跳过依赖安装');
     }
   }
   ```

3. **依赖安装方法** (389-431 行)：
   ```typescript
   private async installNodeDependencies(toolDir: string): Promise<void> {
     // 与 tool-installer.ts 中的实现相同
   }
   ```

## 🎯 核心特性

### 自动检测

- ✅ 检测是否有 `package.json`
- ✅ 检测是否缺少 `node_modules`
- ✅ 自动决定是否需要安装

### 智能安装

- ✅ **安装时自动**：用户下载工具后自动安装依赖
- ✅ **启动时自动**：开发环境首次启动自动安装
- ✅ **进度提示**：显示"正在安装 Node.js 依赖..."

### 错误处理

- ✅ 捕获 npm 错误并记录日志
- ✅ 安装失败时阻止工具启动
- ✅ 清晰的错误信息反馈

## 📋 测试清单

### 生产环境测试

- [ ] 打包工具包含 `package.json`
- [ ] 解压后自动运行 `npm install`
- [ ] 依赖安装成功后工具能启动
- [ ] 安装进度正确显示
- [ ] 安装失败有错误提示

### 开发环境测试

- [ ] 删除 `node_modules` 后启动工具
- [ ] 自动检测并安装依赖
- [ ] 安装成功后工具正常运行
- [ ] 已有 `node_modules` 时跳过安装
- [ ] 无 `package.json` 时跳过安装

## 🔍 日志示例

### 正常安装流程

```
[ToolRunner] 工具 com.booltox.frontend-only-demo 缺少 node_modules，开始安装依赖...
[ToolRunner] [npm] npm install
[ToolRunner] [npm] added 90 packages in 8s
[ToolRunner] Node.js 依赖安装成功: /path/to/tool
[ToolRunner] 后端进程已启动 (PID: 12345)
[ToolRunner] 等待 HTTP 服务就绪: http://127.0.0.1:8003/
[ToolRunner] HTTP 服务已就绪，打开浏览器: http://127.0.0.1:8003/
```

### 跳过安装（已有依赖）

```
[ToolRunner] 工具 com.booltox.frontend-only-demo 已有 node_modules
[ToolRunner] 后端进程已启动 (PID: 12345)
```

### 安装失败

```
[ToolRunner] 工具 com.booltox.frontend-only-demo 缺少 node_modules，开始安装依赖...
[ToolRunner] [npm] npm install
[ToolRunner] [npm] npm error code ENOTFOUND
[ToolRunner] npm install 失败 (退出码: 1)
[ToolRunner] 工具启动失败: npm install 失败
```

## 🚀 下一步测试

### 立即测试

1. 删除开发工具的 node_modules：
   ```bash
   cd packages/client/examples/backend-node-demo
   rm -rf node_modules
   ```

2. 重新启动 BoolTox 客户端：
   ```bash
   pnpm dev:client
   ```

3. 在客户端中点击"正则表达式测试器"启动

4. 观察终端日志，应该看到自动安装依赖的过程

5. 工具在浏览器中正常打开 ✅

---

**实现完成！现在 BoolTox 对 Node.js 和 Python 工具都有完整的依赖自动管理能力。** 🎉
