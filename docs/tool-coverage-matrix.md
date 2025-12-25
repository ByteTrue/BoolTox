# BoolTox 示例工具覆盖矩阵（现行实现）

示例目录：`packages/client/examples/`

## 覆盖矩阵

| 运行时 \\ 模式 | http-service | standalone | cli |
|---|---|---|---|
| Python | ✅ `backend-demo` | ✅ `python-standalone-demo` | ✅ `cli-python-demo` |
| Node.js | ✅ `backend-node-demo` / `frontend-only-demo` | ➖（不推荐） | ✅ `cli-node-demo` |
| Binary | N/A | N/A | ✅ `binary-sysmon-demo` |

补充：`simplified-demo` 演示 `booltox.json` 的 `start/port` 简化写法。

## 结论

- 核心组合已覆盖（含跨平台二进制示例）
- Node.js 的 standalone 不做示例：在 Electron 里再跑 Electron 只会制造垃圾复杂度
