# Node.js Manager 集成文档

> NodeManager 已实现，待集成到 tool-runner.ts

---

## ✅ 已完成

1. **node-manager.service.ts** - Node.js 运行时管理
   - 检测系统/本地 Node.js
   - 按需下载独立二进制
   - npm 命令执行

---

## ⏳ 待集成

### tool-runner.ts 修改点

**导入 NodeManager**：
```typescript
import { nodeManager } from '../services/node-manager.service.js';
```

**启动 Node.js 工具前确保环境**：
```typescript
// tool-backend-runner.ts - startHttpServiceBackend()
if (backend.type === 'node') {
  // 确保 Node.js 可用
  const nodePath = await nodeManager.ensureNode((progress) => {
    logger.info(`[NodeManager] ${progress.message}`);
    // TODO: 发送进度到渲染进程
  });

  // 使用本地 Node.js 启动
  const nodeProcess = spawn(nodePath, [backend.entry], {
    cwd: toolPath,
    env: process.env,
  });
}
```

**npm install 依赖**：
```typescript
// 检测 package.json
const packageJson = path.join(toolPath, 'package.json');
if (fs.existsSync(packageJson)) {
  await nodeManager.runNpm(['install'], {
    cwd: toolPath,
    onOutput: (data) => logger.info(data),
  });
}
```

---

## 🧪 测试步骤

1. 卸载系统 Node.js（或重命名）
2. 启动 Node.js 工具（如 backend-node-demo）
3. 观察日志：
   ```
   [NodeManager] 正在下载 Node.js...
   [NodeManager] 下载 Node.js: 50.0%
   [NodeManager] 正在解压 Node.js...
   [NodeManager] Node.js 安装完成
   [ToolRunner] 启动工具...
   ```
4. 工具成功运行
5. 下次启动：直接使用已下载的 Node.js

---

## 📝 当前状态

**NodeManager** - ✅ 已实现
**tool-runner 集成** - ⏳ 待实施（标记 TODO）
**进度显示** - ⏳ 待实施
**错误处理** - ⏳ 待完善

---

**建议**：
- NodeManager 核心已完成
- 集成工作留待下次（需要仔细测试）
- 避免在疲劳状态下修改核心 tool-runner

**工作量估算**：
- 集成到 tool-runner：1 小时
- 测试和完善：1 小时
- 总计：2 小时

---

**今天已完成的工作量巨大（15+ 小时），建议明天继续。**
