# BoolTox Backend 插件开发指南

> 版本：protocol `^1.0.0`  
> 示例：`packages/client/plugins/com.booltox.backend-demo`

## 1. Manifest 声明

```jsonc
{
  "protocol": "^1.0.0",
  "runtime": {
    "ui": { "type": "webview", "entry": "index.html" },
    "backend": {
      "type": "python",      // 也可以是 "node" / "process"
      "entry": "backend/server.py",
      "args": ["--flag"],
      "env": { "MY_ENV": "value" }
    }
  },
  "permissions": [
    "backend.register",
    "backend.message"
  ]
}
```

> **Tip**：旧版 `main` 字段仍会被 Loader 自动回填，但建议全面迁移到 `runtime.ui.entry`，以便清晰区分 UI 与 Backend。

## 2. Webview 侧调用

```ts
const api = window.booltox.backend;
const unsubscribe = api.onMessage((msg) => {
  if (msg.channelId !== channelId) return;
  console.log(msg.type, msg.data);
});

const handle = await api.register(); // 无参时读取 manifest.runtime.backend
await api.postMessage(handle.channelId, { command: "ping" });

window.addEventListener("beforeunload", () => {
  api.dispose(handle.channelId);
  unsubscribe();
});
```

- `register(definition?)`：返回 `{ pid, channelId }`；如需在运行时覆盖 manifest，可传入 `PluginBackendConfig`。
- `postMessage(channelId, payload)`：payload 会被 JSON 序列化并写入子进程 `stdin`。
- `onMessage(listener)`：订阅 STDOUT/STDERR/exit 事件；返回取消订阅函数。
- `dispose(channelId)`：终止对应子进程。

> ℹ️ 自定义标题栏按钮由宿主通过 `window:control` 通道统一处理，不需要插件声明 `window.*` 权限；只有当插件主动调用 `window.booltox.window.*` API（如 `setSize`、`setTitle` 等）时才需要额外授权。

## 3. 后端实现建议

- **输入**：逐行读取 `stdin`，解析 JSON 并执行命令。
- **输出**：每个事件都是一行 JSON，写入 `stdout`（成功）或 `stderr`（错误）。
- **退出**：遇到不可恢复错误时写入 `exit` 事件并 `sys.exit(code)`。
- **示例**：`backend/server.py` 演示了 `ping` / `stats` / `sum` 三类命令。

```python
for line in sys.stdin:
  payload = json.loads(line)
  if payload["command"] == "ping":
    send({"event": "pong"})
```

## 4. 调试流程

1. 在 `packages/client/plugins` 下创建插件目录并写好 manifest。
2. 运行 `pnpm --filter @booltox/client dev`，Electron 会自动加载 `plugins/` 子目录。
3. 打开 “Backend Bridge Demo” 插件验证 API 行为，再套用到自己的插件。
4. 如需查看进程日志，可在主进程日志中搜索 `[BackendRunner]`，或在插件 UI 中打印 `window.booltox.backend` 消息。

通过该指南即可在 BoolTox 中构建 VS Code 风格的多语言后端插件，且无需在主进程频繁加特定 API。更多细节可参考示例代码。
