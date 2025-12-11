# 官方工具目录

> **BoolTox 官方维护的工具源码**

## 目录说明

此目录包含官方工具的源代码，所有工具：
- ✅ 经过安全审核
- ✅ 代码质量保证
- ✅ 持续维护
- ✅ 在工具市场显示"已验证"标记

## 当前官方工具

| 目录 | 工具名称 | 类型 | 状态 |
|------|---------|------|------|
| `uiautodev/` | UI 自动化开发工具 | Python 后端 + React 前端 | ✅ 已发布 |

## 开发流程

### 1. 开发工具

```bash
cd plugins/your-plugin
pnpm install
pnpm dev  # 或 booltox dev
```

### 2. 测试工具

在 Electron Client 开发模式下：
- PluginManager 会自动加载 `examples/` 和 `plugins/` 目录
- 修改代码后刷新即可

### 3. 构建和打包

```bash
pnpm build
booltox pack  # 生成 ZIP 包
```

### 4. 发布工具

1. 创建 GitHub Release
2. 上传打包后的 ZIP
3. 更新工具市场元数据（或通过 API 自动同步）

## SDK 引用方式

官方工具使用相对路径引用 SDK：

**Python 后端**：
```python
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../sdks/python'))
from booltox_sdk import BoolToxBackend
```

**Node.js 后端**：
```javascript
const { BoolToxBackend } = require('../../sdks/node/booltox-backend.cjs');
```

**前端**：
```typescript
import { booltox } from '@booltox/plugin-sdk';  // 通过 workspace 引用
```

---

**维护者**: BoolTox Team
**更新时间**: 2025-12-10
