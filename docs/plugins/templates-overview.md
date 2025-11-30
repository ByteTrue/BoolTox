# BoolTox 插件模板概览

## python-backend
- 形态：Web 前端 + Python 后端
- manifest: `runtime.ui.entry` + `runtime.backend = { type: "python", entry, requirements }`
- 示例：前端调用 `window.booltox.backend.call/notify`，后端 JSON-RPC `$ready/$event`。

## node-backend
- 形态：Web 前端 + Node 后端
- manifest: `backend.type = "node"`
- 示例：复用 `booltox-backend` SDK 注册方法/事件。

## python-standalone
- 形态：纯 Python GUI（tkinter 示例）
- manifest: `runtime.type = "standalone"`，入口 `main.py`
- 行为：不创建 BrowserWindow，进程由宿主守护，日志走 stdout。

## frontend-only
- 形态：纯前端，无后端进程
- manifest: 仅 `runtime.ui.entry`
- 适用：简单工具、UI 组件，无需后端。

## 运行与环境
- Python 模板若声明 requirements，会自动使用独立虚拟环境（Phase 2 隔离能力）。
- Node 模板默认注入 `NODE_PATH` 指向内置 SDK。
- 开发阶段可用 CLI `create` 生成目录；后续 `dev/build/pack` 将统一封装。
