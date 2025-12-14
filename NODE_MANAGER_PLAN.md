# Node.js 按需下载实施文档

> 创建时间：2025-12-15
> 类似 uv 的按需下载策略

---

## 🎯 目标

**与 Python 工具保持一致的用户体验**：
- Python 工具：uv 首次下载 Python（~30MB）
- Node.js 工具：NodeManager 首次下载 Node.js（~30MB）

**用户流程**：
```
点击启动 Node.js 工具 →
  检测 Node.js 是否存在 →
  不存在 → 下载 Node.js 独立二进制 →
  显示进度（下载中...）→
  解压到 ~/.booltox/node-runtime/ →
  启动工具
```

---

## 📦 Node.js 独立二进制

### 下载源

**官方镜像**：
```
https://nodejs.org/dist/v20.10.0/node-v20.10.0-win-x64.zip       # 约 30MB
https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-arm64.tar.gz
https://nodejs.org/dist/v20.10.0/node-v20.10.0-darwin-x64.tar.gz
https://nodejs.org/dist/v20.10.0/node-v20.10.0-linux-x64.tar.xz
```

**国内镜像（可选）**：
```
https://npmmirror.com/mirrors/node/v20.10.0/node-v20.10.0-win-x64.zip
```

### 解压后结构

```
node-runtime/
├── node.exe (Windows) 或 node (macOS/Linux)
├── npm
├── npx
└── node_modules/
    └── npm/
```

---

## 🔧 实施步骤

### 1. 创建 NodeManager（类似 PythonManager）

**文件**：`electron/services/node-manager.service.ts`

**核心方法**：
```typescript
class NodeManager {
  private nodeDir: string;  // ~/.booltox/node-runtime
  private nodeVersion = 'v20.10.0';

  // 检测系统 Node.js
  async checkSystemNode(): Promise<string | null>

  // 检测本地 Node.js
  async checkLocalNode(): Promise<string | null>

  // 确保 Node.js 可用（核心方法）
  async ensureNode(onProgress?: (progress) => void): Promise<string>

  // 下载 Node.js 独立二进制
  private async downloadNode(onProgress): Promise<void>

  // 获取下载 URL
  private getDownloadUrl(platform, arch): string

  // 运行 Node.js 命令
  async runNode(args: string[], options?): Promise<RunResult>

  // 运行 npm 命令
  async runNpm(args: string[], options?): Promise<RunResult>
}
```

### 2. 修改 tool-runner.ts

**启动 Node.js 工具前**：
```typescript
// tool-runner.ts
async startNodeTool(manifest: ToolManifest): Promise<void> {
  // 1. 确保 Node.js 可用
  const nodePath = await nodeManager.ensureNode((progress) => {
    // 显示进度：正在下载 Node.js... 50%
    this.sendProgress('downloading-runtime', progress);
  });

  // 2. 安装依赖（如果有 package.json）
  if (fs.existsSync(path.join(toolDir, 'package.json'))) {
    await nodeManager.runNpm(['install'], { cwd: toolDir });
  }

  // 3. 启动工具
  const process = spawn(nodePath, ['server.js'], { cwd: toolDir });
}
```

### 3. 添加进度显示

**用户体验**：
```
用户点击"启动工具" →
  Toast: "正在准备 Node.js 环境..."
  进度条: "下载 Node.js v20.10.0 (30MB)... 50%"
  Toast: "Node.js 环境已就绪"
  Toast: "正在启动工具..."
```

---

## 📊 体积对比

| 方案 | 初始体积 | 首次使用 | 后续使用 |
|------|---------|---------|---------|
| **预装** | 48MB + 50MB = 98MB | 0 下载 | 0 下载 |
| **按需下载** | 48MB | 下载 30MB | 0 下载 |

**Linus 的判断**：
- 不用 Node.js 工具的用户：节省 50MB
- 使用 Node.js 工具的用户：首次等待 30MB 下载
- 与 Python 工具保持一致（都是按需下载）

---

## 🧪 测试清单

- [ ] 检测系统 Node.js（有则使用）
- [ ] 下载 Node.js 独立二进制（~30MB）
- [ ] 解压到 ~/.booltox/node-runtime/
- [ ] 运行 Node.js 工具（验证可用）
- [ ] 进度显示（下载、解压、安装依赖）
- [ ] 错误处理（网络失败、解压失败）
- [ ] 缓存机制（已下载则复用）

---

## 🎯 下一步

由于今天已经工作了 15+ 小时，建议：
1. **今天创建文档**（已完成）
2. **明天实施代码**（NodeManager + tool-runner 集成）
3. **测试验证**（Node.js 工具运行）

---

**文档已准备完毕。是否需要我现在开始实施代码？**

或者今天先到这里，明天精力充沛地完成剩余工作？

**你的选择**。
