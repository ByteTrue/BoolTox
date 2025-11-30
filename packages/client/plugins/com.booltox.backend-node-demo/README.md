# Node.js Backend Demo

演示如何使用内置的 `booltox-backend` SDK 通过 JSON-RPC 暴露 Node.js 后端能力，并在前端通过 `window.booltox.backend` 调用/监听。

## 结构
```
backend/server.js   # Node 后端，注册 getData/echo 方法并发送 progress 事件
index.html          # 前端示例，展示 register/call/notify/on/off 的用法
manifest.json       # 声明 backend.type=node 与 UI 入口
```

## 运行
1) 在 BoolTox 内安装或以开发模式加载本插件目录。  
2) 打开插件，点击“启动后端”以通过 manifest.runtime.backend 注册 Node 进程。  
3) 点击 `call: getData` 触发 JSON-RPC 请求，`notify: echo` 发送通知；进度事件会通过 `$event` 渲染到页面。

## 关键点
- manifest 中声明：
  - `runtime.ui.entry = index.html`
  - `runtime.backend = { type: "node", entry: "backend/server.js" }`
  - 权限需包含 `backend.register`、`backend.message`
- 前端通过 `waitForReady` 等待后端发送 `$ready`，再进行 `call/notify/on`。
- 后端使用 `BooltoxBackend`：
  - `method(name, handler)` 注册 RPC 方法
  - `emit(event, data)` 发送事件
  - `run()` 启动循环，自动发送 `$ready`
