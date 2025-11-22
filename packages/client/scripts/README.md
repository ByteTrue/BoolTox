# BoolTox 脚本工具

## 统一 TUI 工具

```bash
pnpm tools
```

提供交互式菜单,包含以下功能:

- 📦 **打包插件** - 将插件打包成可分发的 ZIP 文件
- ⚙️ **配置发布环境** - 设置 GitHub/GitLab 仓库和访问令牌
- 🚀 **构建并发布** - 自动构建应用并发布到 GitHub/GitLab Releases
- 📄 **生成发布清单** - 手动生成 manifest.json 文件

## 快捷命令

```bash
# 打包插件
pnpm plugin:pack <plugin-id>

# 开发模式
pnpm dev

# 构建生产版本
pnpm build
```

## 目录结构

```
scripts/
├── release-cli.mjs              # 统一 TUI 入口 ⭐
├── release-manager.mjs          # 发布管理核心逻辑
└── generate-release-manifest.mjs # 清单生成工具

plugins/scripts/
└── package-plugin.mjs           # 插件打包工具
```

## 使用示例

### 打包插件

```bash
pnpm tools
# 选择: [1] 打包插件
# 输入: com.booltox.myplugin
```

### 发布新版本

```bash
pnpm tools
# 首次: [2] 配置发布环境
# 然后: [3] 构建并发布
```

## 配置文件

发布配置保存在 `.env.release.local`,包含:

- `RELEASE_PLATFORM` - 发布平台 (github/gitlab)
- `RELEASE_REPOSITORY` - 仓库路径 (owner/repo)
- `RELEASE_GIT_TOKEN` - 访问令牌
- `RELEASE_GIT_REF` - 构建分支/Tag
- `RELEASE_TAG_PREFIX` - Tag 前缀
- `RELEASE_CHANNEL` - 发布渠道 (STABLE/BETA/ALPHA)
- `RELEASE_NOTES_FILE` - 版本说明文件路径

