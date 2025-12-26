# BoolTox 工具开发指南

## 核心原则

- 工具必须能脱离 BoolTox **独立运行**
- BoolTox 只负责：安装依赖、启动/停止进程、打开浏览器/终端

## 工具最小结构

```
my-tool/
├── booltox.json
└── (你的代码/脚本/二进制)
```

## `booltox.json`

### 1) 推荐：简化配置（最少字段）

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}
```

- `start`：启动命令（如 `python main.py` / `node server.js`）
- `port`：存在则视为 `http-service`，BoolTox 会打开浏览器访问该端口

### 2) 完整配置：`runtime`（更精细的控制）

支持的运行时类型（见 `packages/shared/src/types/protocol.ts`）：
- `http-service`
- `cli`
- `standalone`
- `binary`

#### `http-service`（推荐）

工具启动本地 HTTP 服务，BoolTox 轮询就绪后打开浏览器：

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
      "host": "127.0.0.1",
      "port": 8001
    }
  }
}
```

#### `cli`

工具在系统终端中运行：

```json
{
  "name": "我的 CLI 工具",
  "version": "1.0.0",
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "node",
      "entry": "cli.js"
    },
    "title": "My Tool",
    "keepOpen": true
  }
}
```

#### `standalone`

工具自行创建 GUI 窗口（Qt/Tk 等），BoolTox 仅管理进程：

```json
{
  "name": "我的 GUI 工具",
  "version": "1.0.0",
  "runtime": {
    "type": "standalone",
    "entry": "main.py",
    "requirements": "requirements.txt"
  }
}
```

#### `binary` / 跨平台二进制

`binary` 运行时用于直接执行本地可执行文件（`command` 为字符串）。如果你需要**跨平台分发**，推荐使用 `cli` + `backend.type: "process"` 并通过 `entry` 提供平台映射（示例见 `packages/client/examples/binary-sysmon-demo`）：

```json
{
  "name": "我的二进制工具",
  "version": "1.0.0",
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "process",
      "entry": {
        "darwin-arm64": "bin/tool-macos-arm64",
        "win32-x64": "bin/tool-windows-x64.exe"
      }
    }
  }
}
```

## 开发与调试

1. **先独立运行工具**（这是唯一可靠的调试方式）
2. 再在 BoolTox 里加载
   - 开发模式可设置环境变量 `BOOLTOX_DEV_TOOLS_DIR` 指向你的“工具集合目录”（目录下每个子目录一个工具）
   - 或在客户端 UI 中添加本地工具源（会尝试读取 `booltox.json`）

## 依赖与环境（BoolTox 侧行为）

- Node 工具：BoolTox 使用 **npm** 安装依赖与运行（避免 pnpm 软链接导致分发/打包问题）
- Python 工具：BoolTox 使用内置 **uv** 管理 Python 环境，并按 `requirements.txt` 安装依赖

## 示例工具

仓库内示例：`packages/client/examples/`（覆盖 `http-service` / `cli` / `standalone` / `binary`）。
