# CLI 工具支持方案

> 注：本文中的 `manifest.json` 为历史叫法，现行配置文件为 `booltox.json`。

## 🎯 回答：能否零改动集成任意项目？

### ✅ HTTP 服务器项目（FastAPI、Express）

**需要的改动**: 只需添加 `booltox.json`（~20 行）

**示例**：
```python
# main.py（已有代码，无需改动）
from fastapi import FastAPI
uvicorn.run(app, host="127.0.0.1", port=8000)
```

只需添加 `booltox.json`，完成！✅

---

### ✅ GUI 项目（Qt、Tkinter）

**需要的改动**: 只需添加 `booltox.json`（~15 行）

完全零代码改动！✅

---

### ⭐ CLI 工具（Click、Commander）

**当前状态**: ❌ 不支持

**你的方案**: 可行！

#### 方案 1: 启动终端（推荐）⭐⭐⭐⭐⭐

**实现方式**：
```typescript
// macOS
spawn('osascript', ['-e', `
  tell application "Terminal"
    do script "cd ${toolPath} && python cli.py"
  end tell
`]);

// Windows
spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', `cd ${toolPath} && python cli.py`]);

// Linux
spawn('gnome-terminal', ['--', 'bash', '-c', `cd ${toolPath} && python cli.py`]);
```

**需要的改动**: 只需添加 `booltox.json`
```json
{
  "runtime": {
    "type": "cli",  // ✨ 新增运行模式
    "backend": {
      "type": "python",
      "entry": "cli.py"
    },
    "keepOpen": true
  }
}
```

**优势**：
- ✅ CLI 工具零代码改动
- ✅ 支持交互式 CLI
- ✅ 调试友好（输出可见）

#### 方案 2: 打包成二进制 ⭐⭐⭐

**打包工具**：
- Python: PyInstaller（30-50MB）
- Node.js: pkg（20-40MB）

**需要的改动**: 添加打包脚本 + booltox.json

**优势**：
- ✅ 零运行时依赖

**劣势**：
- ❌ 打包复杂
- ❌ 体积大
- ❌ 每个平台单独打包

---

## 🚀 推荐实现：CLI 模式

### 最终工具分类（完整）

```
源码工具
├─ Python/Node.js
│   ├─ http-service（浏览器）✅
│   ├─ standalone（原生 GUI）✅
│   └─ cli（终端）✨ 可以新增

二进制工具
└─ binary（可执行文件）✅
```

### 改动程度总结

| 项目类型 | 必需改动 | 改动量 | 改造成本 |
|---------|---------|--------|---------|
| HTTP 服务器 | booltox.json | ~20 行 | ⭐ 极低 |
| GUI 项目 | booltox.json | ~15 行 | ⭐ 极低 |
| **CLI 工具** | **booltox.json** | **~20 行** | ⭐ **极低（如果实现）** |
| 纯前端项目 | booltox.json + server.js | ~30 行 | ⭐⭐ 低 |

---

## ✅ 核心答案

**能否零改动集成任意项目？**

✅ **几乎可以**（只需添加 booltox.json）

**不需要的改动**：
- ❌ 不需要引入 BoolTox SDK
- ❌ 不需要修改业务逻辑
- ❌ 不需要学习特殊 API
- ❌ 不需要改变项目结构

**唯一必需的改动**：
- ✅ 添加 `booltox.json`（10-20 行，工具元信息）

**如果实现 CLI 模式**：
- ✅ CLI 工具也只需 booltox.json
- ✅ 所有类型的项目都支持（Web、GUI、CLI）

---

## 🔮 未来改进

### 自动生成 booltox.json

```bash
# BoolTox CLI 工具
booltox init

# 交互式问答
? 工具名称: 我的工具
? 工具类型: [1] HTTP Service [2] GUI [3] CLI
? 编程语言: [1] Python [2] Node.js
? 入口文件: main.py
? 端口（如果是 HTTP）: 8000

✅ booltox.json 已生成
```

**实现后**：
- 从 ~20 行手写 manifest
- 到只需回答 5 个问题
- **接近零改动！**

---

**要我立即实现 CLI 模式支持吗？** 🚀
