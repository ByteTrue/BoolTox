# 示例工具目录

> **此目录包含 4 种工具类型的示例代码，仅用于开发和测试**

## 目录说明

这些工具**不会发布到工具市场**，仅用于：
1. **开发测试**：在开发模式下快速测试工具系统功能
2. **示例代码**：展示 4 种工具类型的最佳实践
3. **活文档**：比文档更容易理解

## 示例工具列表

| 目录 | 工具类型 | 说明 |
|------|---------|------|
| `backend-demo/` | Python 后端 | React 前端 + Python FastAPI 后端 |
| `backend-node-demo/` | Node.js 后端 | React 前端 + Node.js Express 后端 |
| `frontend-only-demo/` | 纯前端 | 纯 React 应用（无后端） |
| `python-standalone-demo/` | 独立应用 | PySide6 独立窗口应用 |

## SDK 引用方式

示例工具使用相对路径引用 SDK：

**Python 后端**：
```python
# 开发时通过 sys.path 添加（见 backend/server.py）
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../sdks/python'))
from booltox_sdk import BoolToxBackend
```

**Node.js 后端**：
```javascript
// 通过相对路径引用（见 backend/src/server.ts）
const { BoolToxBackend } = require('../../../sdks/node/booltox-backend.cjs');
```

## 开发模式加载

在 Electron 开发模式下，PluginManager 会自动扫描此目录：

```typescript
// packages/client/electron/services/plugin/plugin-manager.ts
if (!app.isPackaged) {
  this.devPluginsDir = this.resolveDevPluginsDir();
  // 解析优先级：examples/ > plugins/ > ...
}
```

## 官方工具开发

**官方工具应该在 `plugins/` 目录开发**：
- 源码位置：`booltox-web/plugins/your-plugin/`
- 打包后分发：通过工具市场或 GitHub Release

---

**维护者**: BoolTox Team
**更新时间**: 2025-12-10
