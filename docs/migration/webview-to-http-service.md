# 从 Webview 迁移到 HTTP Service 架构

> **版本**: BoolTox 2.0
> **日期**: 2025-12-12
> **状态**: 正式版

---

## 📋 目录

- [迁移概述](#迁移概述)
- [核心变化](#核心变化)
- [迁移步骤](#迁移步骤)
- [示例对比](#示例对比)
- [常见问题](#常见问题)

---

## 迁移概述

### 为什么要迁移？

BoolTox 2.0 采用全新的架构理念：**BoolTox = 进程管理器 + 工具市场**，而不是工具运行容器。

**旧架构的问题**：
- ❌ 工具依赖 BoolTox 的 webview 容器运行
- ❌ 工具无法独立测试和发布
- ❌ 需要复杂的 IPC 通信
- ❌ 受 Electron webview 限制（性能、兼容性）
- ❌ 工具依赖 `@booltox/tool-sdk`

**新架构的优势**：
- ✅ 工具完全独立，可手动启动（`python tool.py` 或 `node tool.js`）
- ✅ 工具在系统默认浏览器中运行，零兼容问题
- ✅ 不依赖任何 BoolTox SDK
- ✅ BoolTox 职责清晰：进程管理 + 工具市场
- ✅ 更好的开发体验和用户体验

---

## 核心变化

### 1. booltox.json 配置变化

#### 旧架构（已弃用）

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "runtime": {
    "type": "webview",  // ❌ 已弃用
    "backend": {
      "type": "python",
      "entry": "backend/main.py"
    },
    "ui": {  // ❌ 已弃用
      "type": "webview",
      "entry": "dist/index.html"
    }
  }
}
```

#### 新架构（推荐）

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "2.0.0",
  "runtime": {
    "type": "http-service",  // ✅ 新模式
    "backend": {
      "type": "python",
      "entry": "main.py",  // 工具入口
      "port": 8001,  // HTTP 服务端口
      "host": "127.0.0.1"
    },
    "path": "/",  // 可选，默认路径
    "readyTimeout": 30000  // 可选，健康检查超时
  }
}
```

### 2. 工具架构变化

#### 旧架构：前后端分离 + SDK

```
frontend (webview)
    ↓ (IPC 通信)
@booltox/tool-sdk
    ↓
backend (Python/Node.js)
```

**问题**：
- 前端必须在 BoolTox 的 webview 中运行
- 需要通过 `@booltox/tool-sdk` 与后端通信
- 无法独立运行和测试

#### 新架构：独立 HTTP 服务

```
HTTP Server (FastAPI/Express)
    ├── 静态文件服务 (frontend)
    └── API 路由 (backend)
```

**优势**：
- 工具是完整的 HTTP 服务，可独立启动
- 在系统默认浏览器中运行
- 不依赖任何 BoolTox SDK

### 3. 代码变化总结

| 方面 | 旧架构 | 新架构 |
|------|--------|--------|
| 运行环境 | BoolTox webview 容器 | 系统默认浏览器 |
| 依赖 | `@booltox/tool-sdk` | 无依赖 |
| 后端 | 纯后端服务 | 带静态文件服务的 HTTP 服务器 |
| 前后端通信 | IPC (通过 SDK) | 标准 HTTP/WebSocket |
| 独立运行 | ❌ 不可以 | ✅ 可以（`python main.py`） |
| 部署 | 依赖 BoolTox | 完全独立 |

---

## 迁移步骤

### Step 1: 创建 HTTP 服务器

根据工具的后端技术栈，选择对应的方案：

#### Python 工具 → FastAPI

创建 `main.py`（或 `http_server.py`）：

```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

app = FastAPI()

# 挂载静态文件（前端）
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

# API 路由
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

@app.get("/api/data")
async def get_data():
    # 原来的后端逻辑
    return {"message": "Hello from backend"}

# 根路径返回前端入口
@app.get("/")
async def index():
    return FileResponse("dist/index.html")

if __name__ == "__main__":
    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "127.0.0.1")
    uvicorn.run(app, host=host, port=port)
```

#### Node.js 工具 → Express

创建 `server.js`（或 `http_server.js`）：

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());

// 静态文件服务
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// API 路由
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/data', (req, res) => {
  // 原来的后端逻辑
  res.json({ message: 'Hello from backend' });
});

// 根路径返回前端入口
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`服务运行在: http://${HOST}:${PORT}`);
});
```

#### 纯前端工具 → 静态服务器

如果工具只有前端，创建简单的静态文件服务器：

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8003;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`工具运行在: http://${HOST}:${PORT}`);
});
```

### Step 2: 移除 SDK 依赖

#### 前端代码修改

**旧代码（使用 SDK）**：

```typescript
import { booltox } from '@booltox/tool-sdk';

// 调用后端
const data = await booltox.backend.call('getData');

// 存储数据
await booltox.storage.set('key', 'value');

// 显示通知
booltox.ui.showToast('操作成功');
```

**新代码（标准 HTTP）**：

```typescript
// 调用后端 API
const response = await fetch('/api/data');
const data = await response.json();

// 使用浏览器 localStorage
localStorage.setItem('key', 'value');

// 使用浏览器原生通知（或自定义 Toast 组件）
if (Notification.permission === 'granted') {
  new Notification('操作成功');
}
```

#### 依赖清理

1. 从 `package.json` 删除：
   ```json
   {
     "dependencies": {
       "@booltox/tool-sdk": "..." // ❌ 删除
     }
   }
   ```

2. 删除所有 SDK 导入：
   ```typescript
   // ❌ 删除这些导入
   import { booltox } from '@booltox/tool-sdk';
   import { useStorage, useBackend } from '@booltox/tool-sdk';
   ```

### Step 3: 更新 booltox.json

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "2.0.0",
  "description": "工具描述",
  "protocol": "^2.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",  // 或 "node"
      "entry": "main.py",  // HTTP 服务器入口
      "port": 8001,  // 自定义端口（避免冲突）
      "host": "127.0.0.1"
    },
    "path": "/",
    "readyTimeout": 30000
  },
  "author": "Your Name",
  "keywords": ["tool", "http-service"]
}
```

### Step 4: 测试独立运行

```bash
# Python 工具
python main.py
# 然后在浏览器打开 http://127.0.0.1:8001

# Node.js 工具
node server.js
# 然后在浏览器打开 http://127.0.0.1:8002
```

确保工具可以完全独立运行，不依赖 BoolTox 环境。

### Step 5: 在 BoolTox 中测试

1. 将工具放入 `examples/` 目录（开发模式）
2. 启动 BoolTox 客户端
3. 在工具列表中找到你的工具
4. 点击启动，应该会：
   - BoolTox 启动后端进程
   - 轮询健康检查
   - 在默认浏览器中打开工具

---

## 示例对比

### Python/FastAPI 工具

#### 目录结构对比

**旧架构**：
```
my-tool/
├── booltox.json
├── backend/
│   └── main.py (纯后端)
├── frontend/
│   ├── src/
│   │   └── main.ts (使用 @booltox/tool-sdk)
│   └── package.json
└── requirements.txt
```

**新架构**：
```
my-tool/
├── booltox.json (更新配置)
├── main.py (FastAPI 服务器 + API)
├── frontend/
│   ├── src/
│   │   └── main.ts (纯前端代码)
│   └── package.json (移除 SDK)
├── dist/ (构建后的前端)
└── requirements.txt (添加 fastapi, uvicorn)
```

#### 关键文件对比

**旧 booltox.json**：
```json
{
  "runtime": {
    "type": "webview",
    "backend": { "type": "python", "entry": "backend/main.py" },
    "ui": { "type": "webview", "entry": "frontend/dist/index.html" }
  }
}
```

**新 booltox.json**：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": { "type": "python", "entry": "main.py", "port": 8001 },
    "path": "/"
  }
}
```

**新 main.py**（关键变化）：
```python
# 添加静态文件服务
app.mount("/assets", StaticFiles(directory="dist/assets"), name="assets")

@app.get("/")
async def index():
    return FileResponse("dist/index.html")
```

**新前端代码**：
```typescript
// ❌ 旧代码
// import { booltox } from '@booltox/tool-sdk';
// const data = await booltox.backend.call('getData');

// ✅ 新代码
const response = await fetch('/api/data');
const data = await response.json();
```

### Node.js/Express 工具

完整示例参考：`examples/backend-node-demo/`

**关键文件**：`backend/src/http_server.ts`

```typescript
import express from 'express';
import path from 'path';

const app = express();

// 静态文件服务（前端）
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// API 路由（后端）
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello' });
});

// 根路径
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8002;
app.listen(PORT, '127.0.0.1');
```

### 纯前端工具

完整示例参考：`examples/frontend-only-demo/`

**server.js**：
```javascript
import express from 'express';
import path from 'path';

const app = express();
const distPath = path.resolve(__dirname, 'dist');

app.use(express.static(distPath));
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(8003, '127.0.0.1');
```

---

## 常见问题

### Q1: 我的工具需要文件系统访问，怎么办？

**A**: 在新架构中，文件操作应该通过后端 API 实现：

```python
# main.py
@app.post("/api/read-file")
async def read_file(file_path: str):
    with open(file_path, 'r') as f:
        return {"content": f.read()}
```

```typescript
// 前端
const response = await fetch('/api/read-file', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ file_path: '/path/to/file' })
});
const data = await response.json();
```

### Q2: 如何处理工具间通信？

**A**: 旧架构通过 BoolTox SDK 进行工具间通信。新架构中，工具是独立的 HTTP 服务，可以通过以下方式通信：

1. **HTTP API**：工具暴露 API，其他工具通过 HTTP 调用
2. **WebSocket**：实时双向通信
3. **共享存储**：通过数据库或文件系统共享数据

### Q3: 如何迁移持久化存储？

**旧代码**：
```typescript
import { booltox } from '@booltox/tool-sdk';
await booltox.storage.set('key', 'value');
const value = await booltox.storage.get('key');
```

**新代码（浏览器）**：
```typescript
// 使用 localStorage
localStorage.setItem('key', JSON.stringify(value));
const value = JSON.parse(localStorage.getItem('key') || '{}');

// 或使用 IndexedDB（大数据量）
```

**新代码（后端）**：
```python
# 使用文件系统
import json
from pathlib import Path

storage_file = Path("data/storage.json")

def save_data(key: str, value: any):
    data = {}
    if storage_file.exists():
        data = json.loads(storage_file.read_text())
    data[key] = value
    storage_file.write_text(json.dumps(data))
```

### Q4: 我的工具有原生 GUI（Qt/Tkinter），怎么办？

**A**: 使用 `standalone` 模式：

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

BoolTox 只会启动进程，工具自己创建 GUI 窗口。参考：`examples/python-standalone-demo/`

### Q5: 端口冲突怎么办？

**A**: 每个工具选择一个不冲突的端口。建议：
- 8000-8099: BoolTox 核心服务
- 8100-8999: 工具服务（自行分配）

或者使用动态端口（在代码中查找可用端口）。

### Q6: 开发时如何调试？

**A**:
1. 独立运行工具（`python main.py` 或 `node server.js`）
2. 在浏览器中打开（`http://127.0.0.1:8001`）
3. 使用浏览器开发者工具调试

不再需要在 BoolTox 中调试，极大简化了开发流程。

### Q7: 如何处理环境变量？

**旧架构**: 通过 BoolTox SDK 传递

**新架构**:
- 使用 `.env` 文件
- 或通过 BoolTox 在启动时注入（`PORT`, `HOST` 等）

```python
import os
port = int(os.getenv("PORT", "8001"))
```

### Q8: 旧工具还能运行吗？

**A**: 不能。webview 模式已完全移除。必须迁移到新架构。

---

## 参考资源

### 官方示例

在 `packages/client/examples/` 目录查看完整示例：

1. **backend-demo** (Python/FastAPI)
   - 路径: `examples/backend-demo/`
   - 特点: Python 后端 + React 前端

2. **backend-node-demo** (Node.js/Express)
   - 路径: `examples/backend-node-demo/`
   - 特点: Node.js 后端 + TypeScript 前端

3. **frontend-only-demo** (静态服务)
   - 路径: `examples/frontend-only-demo/`
   - 特点: 纯前端 + 简单静态服务器

4. **python-standalone-demo** (PySide6/Qt)
   - 路径: `examples/python-standalone-demo/`
   - 特点: 原生 GUI，standalone 模式

### 文档

- [根目录 CLAUDE.md](../../CLAUDE.md) - 项目整体架构
- [packages/client/CLAUDE.md](../../packages/client/CLAUDE.md) - 客户端架构
- [REFACTOR_PLAN.md](../../REFACTOR_PLAN.md) - 重构详细计划

### 技术栈

- **Python**: [FastAPI](https://fastapi.tiangolo.com/), [Uvicorn](https://www.uvicorn.org/)
- **Node.js**: [Express](https://expressjs.com/)
- **前端**: React, Vue, 或任何标准 Web 技术

---

## 需要帮助？

如果迁移过程中遇到问题：

1. 查看示例工具代码
2. 检查 BoolTox 日志（客户端控制台）
3. 提交 Issue: [GitHub Issues](https://github.com/ByteTrue/BoolTox/issues)

---

**祝迁移顺利！**
