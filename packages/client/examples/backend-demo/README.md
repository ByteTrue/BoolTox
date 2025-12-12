# 系统信息监控工具

演示如何创建一个**完全独立**的工具，使用 FastAPI 启动 HTTP 服务器，在浏览器中运行。

## 🎯 设计理念

**BoolTox = 进程管理器 + 工具市场**，不是工具运行容器。

- ✅ 工具完全独立，可以手动启动：`python backend/http_server.py`
- ✅ 不依赖任何 BoolTox SDK
- ✅ 在系统默认浏览器中运行
- ✅ BoolTox 只负责：发现、安装、启动、停止工具

## 📁 结构

```
com.booltox.backend-demo/
├── manifest.json              # 声明 runtime.type = "http-service"
├── backend/
│   ├── http_server.py         # FastAPI HTTP 服务器 (新架构)
│   └── server.py              # 旧的 STDIO 版本 (已废弃)
├── src/                       # 前端源代码 (TypeScript/Vue/React)
├── dist/                      # 构建后的静态文件
└── requirements.txt           # Python 依赖

```

## 🚀 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 构建前端（可选）

如果需要修改前端代码：

```bash
pnpm install
pnpm build
```

### 3. 独立运行

```bash
python backend/http_server.py
```

服务器将在 `http://127.0.0.1:8001` 启动，在浏览器中打开即可使用。

### 4. 在 BoolTox 中使用

BoolTox 会自动：
1. 检测并安装 Python 依赖
2. 启动 HTTP 服务器
3. 在系统默认浏览器中打开工具
4. 管理进程生命周期（启动/停止）

## 📡 API 端点

- `GET /` - 前端页面
- `GET /api/system` - 获取系统信息
- `GET /api/cpu` - 获取 CPU 信息
- `GET /api/memory` - 获取内存信息
- `GET /api/disk` - 获取磁盘信息
- `GET /api/network` - 获取网络信息
- `GET /api/processes?sort_by=cpu&limit=10` - 获取进程列表
- `WS /ws/monitor` - 实时监控数据推送（WebSocket）

## 🔧 技术栈

- **后端**: FastAPI + Uvicorn + psutil
- **前端**: TypeScript + Vue/React (任意框架)
- **通信**: RESTful API + WebSocket

## 📝 从旧架构迁移

旧架构（webview + STDIO）:
```json
{
  "runtime": {
    "ui": { "type": "webview", "entry": "index.html" },
    "backend": { "type": "python", "entry": "backend/server.py" }
  }
}
```

新架构（http-service）:
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "backend/http_server.py",
      "port": 8001
    }
  }
}
```

## ✨ 优势

1. **极简设计**: BoolTox 只是进程管理器，不处理渲染
2. **零兼容问题**: 所有工具运行在浏览器中，无 Electron 限制
3. **独立可测**: 每个工具都可以独立启动测试
4. **更好的用户体验**: 用户获得完整的浏览器功能
5. **易于维护**: 不再需要复杂的 IPC 通信逻辑

---

该示例提供最小可行代码，便于第三方工具快速对齐新架构。
