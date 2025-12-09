# 插件仓库独立迁移完成 ✅

## 📦 迁移概览

插件已从 `booltox-web/packages/client/plugins` 完全迁移到独立仓库 `booltox-plugins`，实现了插件与主应用的解耦。

---

## 🔗 新插件仓库

**仓库地址**: https://github.com/ByteTrue/booltox-plugins

**仓库结构**:
```
booltox-plugins/
├── packages/
│   ├── official/          # 官方插件
│   │   ├── pomodoro/
│   │   └── uiautodev/
│   └── examples/          # 示例插件
│       ├── backend-demo/
│       ├── backend-node-demo/
│       ├── frontend-only-demo/
│       └── python-standalone-demo/
│
├── plugins/               # 打包产物（分发目录）
│   ├── official/
│   │   └── pomodoro/
│   │       ├── metadata.json
│   │       └── releases/
│   │           └── pomodoro-1.0.0.zip
│   └── examples/
│       └── backend-demo/
│           ├── metadata.json
│           └── releases/
│               └── backend-demo-2.0.0.zip
│
└── scripts/
    ├── package-plugin.mjs
    └── update-registry.js
```

---

## ⚙️ 配置更新

### 1. GitOps 服务配置

已更新 [git-ops.service.ts](packages/client/electron/services/git-ops.service.ts)：

```typescript
// 插件仓库配置 (独立仓库)
const PLUGIN_REPO_CONFIG: GitOpsConfig = {
  provider: 'github',
  owner: 'ByteTrue',
  repo: 'booltox-plugins',
  branch: 'main',
};
```

### 2. 数据获取路径

- **生产环境**:
  - 索引: `https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/index.json`
  - 元数据: `https://cdn.jsdelivr.net/gh/ByteTrue/booltox-plugins@main/plugins/{type}/{name}/metadata.json`
  - 下载: `https://raw.githubusercontent.com/ByteTrue/booltox-plugins/main/plugins/{type}/{name}/releases/{name}-{version}.zip`

- **开发环境**:
  - 从本地 `E:\Code\TS\BoolTox\booltox-plugins\plugins\` 读取

### 3. 环境变量

[.env](../.env):
```env
# 开发环境插件目录 (指向新插件仓库的 examples 目录)
BOOLTOX_DEV_PLUGINS_DIR=E:\Code\TS\BoolTox\booltox-plugins\packages\examples
```

---

## 🚀 使用指南

### 插件开发

```bash
# 1. 克隆插件仓库
git clone https://github.com/ByteTrue/booltox-plugins.git
cd booltox-plugins

# 2. 安装依赖
pnpm install

# 3. 开发插件
cd packages/examples/backend-demo
pnpm dev

# 4. 构建插件
pnpm build
```

### 打包插件

```bash
cd booltox-plugins

# 打包示例插件
pnpm pack:plugin backend-demo --type=examples

# 打包官方插件
pnpm pack:plugin pomodoro --type=official
```

打包后会生成：
- `plugins/{type}/{name}/metadata.json`
- `plugins/{type}/{name}/releases/{name}-{version}.zip`

### 更新插件索引

```bash
cd booltox-plugins
pnpm update:registry
```

这会更新 `plugins/index.json`，包含所有已打包插件的索引信息。

---

## 🔄 插件发布流程

1. **开发** → 在 `packages/` 目录开发插件源码
2. **构建** → `pnpm build` 生成 dist 产物
3. **打包** → `pnpm pack:plugin` 打包成 ZIP
4. **更新索引** → `pnpm update:registry` 更新索引
5. **提交** → Git 提交到 booltox-plugins 仓库
6. **发布** → Push 到 GitHub，自动通过 CDN 分发

---

## 📊 迁移状态

### ✅ 已完成

- [x] 插件源码迁移到独立仓库
- [x] 更新 GitOps 配置指向新仓库
- [x] 更新开发环境插件路径
- [x] 创建新仓库的打包脚本
- [x] 更新本地开发模式的路径解析
- [x] 标记废弃 `resources/plugins` 目录

### 📝 待验证

- [ ] 插件市场能从新仓库获取数据
- [ ] 插件安装功能正常
- [ ] 本地开发插件加载正常

---

## 🗑️ 废弃目录

`resources/plugins/` 目录已标记为废弃，详见 [resources/plugins/README.md](resources/plugins/README.md)。

此目录将在确认一切正常后删除。

---

## 📚 相关文档

- [插件仓库](https://github.com/ByteTrue/booltox-plugins)
- [插件开发指南](../docs/BACKEND_PLUGIN_GUIDE.md)
- [迁移详细说明](../packages/client/plugins/MIGRATION.md)

---

**迁移完成日期**: 2025-12-09
**迁移执行者**: Claude Code
