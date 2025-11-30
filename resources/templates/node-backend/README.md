# Node Backend Template

- `manifest.json` 声明 webview + Node backend。
- 后端使用内置 `booltox-backend` SDK（JSON-RPC），提供 `hello/health` 方法与 `progress` 事件。
- 前端示例展示 register/waitForReady/call/on 的基础用法。

## 快速开始
1. 在 BoolTox 中加载本模板生成的插件。
2. 点击“启动后端”，等待 `$ready`，再执行 `call hello`。
3. 按需扩展 `backend/server.js` 方法，并在前端调用时注意错误处理。
