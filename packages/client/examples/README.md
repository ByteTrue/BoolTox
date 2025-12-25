# BoolTox 示例工具

本目录用于验证「工具独立运行」架构：每个子目录都是一个工具（包含 `booltox.json`），支持 `http-service / cli / standalone / binary`。

## 示例列表

### `http-service`（浏览器运行）

- `backend-demo`：Python + FastAPI（端口 8001）
- `backend-node-demo`：Node.js + Express（端口 8002）
- `frontend-only-demo`：Node.js 静态文件服务（端口 8003）

### `cli`（终端运行）

- `cli-python-demo`：Python 交互式 REPL
- `cli-node-demo`：Node.js 交互式菜单
- `binary-sysmon-demo`：Go 预编译二进制（跨平台）

### `standalone`（原生 GUI）

- `python-standalone-demo`：Python + PySide6（Qt）

### 简化配置示例

- `simplified-demo`：演示 `booltox.json` 的 `start/port` 简化写法

## 在 BoolTox 中加载

- 开发模式下，客户端会扫描本目录（`packages/client/examples`）并自动加载这些工具。
- 也可以设置环境变量 `BOOLTOX_DEV_TOOLS_DIR` 指向你的工具集合目录（目录下每个子目录一个工具）。

## 本地独立运行

工具必须能独立运行（这是设计底线）。

### 批量构建 3 个 `http-service` 示例（推荐）

```bash
./setup-all.sh
```

### Node 工具（为什么用 npm）

这些示例工具 **不参与 pnpm workspace**，并且 BoolTox 客户端在安装 Node 依赖时使用 **npm**（避免 pnpm 软链接导致分发/打包问题）。

```bash
cd backend-node-demo
npm install --legacy-peer-deps
npm run build
node backend/dist/http_server.js
```

### Python 工具

```bash
cd cli-python-demo
pip install -r requirements.txt
python cli.py
```

## `booltox.json` 示例

### 简化写法（推荐入门）

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}
```

### 完整写法（需要精细控制时）

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "backend/http_server.py",
      "requirements": "requirements.txt",
      "port": 8001,
      "host": "127.0.0.1"
    }
  }
}
```
