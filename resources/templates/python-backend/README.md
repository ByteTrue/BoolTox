# Python Backend Template

- `manifest.json` 已声明 webview + Python backend（entry: `backend/main.py`，requirements.txt 可选）。
- 前端示例使用 `window.booltox.backend.register/waitForReady/call` 与后端通信。
- 后端示例使用 JSON-RPC 2.0，带 `$ready` / `$event`。

## 快速开始
1. `pnpm install`（若需额外前端依赖）。
2. 在 BoolTox 中加载插件，点击“启动后端”，观察日志。
3. 在 `backend/main.py` 中添加自己的 RPC 方法，记得在前端调用时等待 `waitForReady`。
