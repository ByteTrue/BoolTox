# 模块系统文档

欢迎使用 Booltox 模块系统！这是一个完整的本地和远程模块管理系统，支持动态安装、卸载和热加载。

---

## 📚 文档导航

### 🚀 快速开始
- **[快速开始指南](./QUICKSTART.md)** - 5分钟了解模块系统
- **[快速参考](./QUICK-REFERENCE.md)** - 常用命令和配置速查

### 🏗️ 架构设计
- **[架构文档](./module-architecture.md)** - 完整的技术架构和设计决策
- **[实现说明](./IMPLEMENTATION.md)** - 已实现的功能和文件清单

### 🌐 远程模块
- **[GitHub 托管指南](./GITHUB-HOSTING-GUIDE.md)** - 如何在 GitHub 上发布远程模块
  - 创建 GitHub 仓库
  - 发布到 GitHub Releases
  - 生成文件校验和
  - 配置 manifest.json
  - 使用 jsdelivr CDN 加速

### 💻 开发指南
- **[模块开发模板](./module-development-template/)** - 开箱即用的模块模板
  - `package.json` - 依赖配置
  - `vite.config.ts` - 构建配置（IIFE 格式）
  - `tsconfig.json` - TypeScript 配置
  - `src/index.tsx` - 示例组件（计算器）

### 📖 示例代码
- **[远程模块示例](./examples/remote-module-calculator.tsx)** - 完整的远程模块示例

---

## 🎯 核心特性

### ✅ 本地模块
- ✨ 动态加载和卸载
- 🔥 热更新支持
- 📦 懒加载优化
- 🎨 完整的 UI 集成

### 🌐 远程模块
- 📡 从 GitHub 动态下载
- 💾 智能缓存（localStorage + IndexedDB）
- 🔐 SHA-256 校验和验证
- ⚡ CDN 加速支持
- 🔄 版本管理

---

## 📖 使用场景

### 场景 1: 开发本地模块

```bash
# 1. 创建模块
cd src/modules/my-tool

# 2. 编写代码
# src/modules/my-tool/module.tsx

# 3. 注册模块
# src/core/modules/registry.ts
```

参考: [快速开始指南](./QUICKSTART.md#本地模块)

### 场景 2: 发布远程模块

```bash
# 1. 使用模板创建模块
cp -r docs/module-development-template my-module
cd my-module

# 2. 开发和构建
npm install
npm run dev
npm run build

# 3. 发布到 GitHub
gh release create v1.0.0 dist/*.js

# 4. 更新 manifest.json
node scripts/generate-checksums.js
git commit -am "Release v1.0.0"
git push
```

参考: [GitHub 托管指南](./GITHUB-HOSTING-GUIDE.md)

### 场景 3: 安装远程模块

```typescript
// 用户在客户端操作
1. 打开"模块中心"
2. 切换到"远程模块"
3. 浏览可用模块
4. 点击"安装"
5. 等待下载和验证
6. 安装完成，可以使用
```

参考: [架构文档](./module-architecture.md#远程模块流程)

---

## 🔧 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 38.1.2 | 桌面应用框架 |
| React | 19.1.0 | UI 框架 |
| TypeScript | 5.2.2 | 类型安全 |
| Vite | 7.1.7 | 构建工具 |
| IndexedDB | - | 大文件缓存 |
| Web Crypto API | - | SHA-256 校验 |

---

## 📂 项目结构

```
plugin-client/
├── src/
│   ├── core/
│   │   └── modules/
│   │       ├── types.ts              # 类型定义
│   │       ├── registry.ts           # 本地模块注册
│   │       ├── registry-remote.ts    # 远程模块注册
│   │       └── installer.ts          # 模块安装器
│   ├── modules/
│   │   ├── focus-board/             # 本地模块示例
│   │   └── glassmorphism-demo/      # 本地模块示例
│   └── renderer/
│       ├── contexts/
│       │   └── module-context.tsx   # 模块状态管理
│       └── components/
│           └── module-center.tsx    # 模块中心 UI
├── public/
│   └── manifests/
│       └── remote-modules.json      # 远程模块清单
└── docs/
    ├── README.md                     # 📍 你在这里
    ├── QUICKSTART.md                 # 快速开始
    ├── QUICK-REFERENCE.md            # 快速参考
    ├── module-architecture.md        # 架构文档
    ├── IMPLEMENTATION.md             # 实现说明
    ├── GITHUB-HOSTING-GUIDE.md       # GitHub 托管
    ├── module-development-template/  # 开发模板
    └── examples/                     # 示例代码
```

---

## 🚦 开始使用

### 选择你的路径:

#### 🔹 我想了解系统架构
👉 阅读 [架构文档](./module-architecture.md)

#### 🔹 我想快速开始开发
👉 阅读 [快速开始指南](./QUICKSTART.md)

#### 🔹 我想发布远程模块
👉 阅读 [GitHub 托管指南](./GITHUB-HOSTING-GUIDE.md)

#### 🔹 我只想查命令
👉 阅读 [快速参考](./QUICK-REFERENCE.md)

#### 🔹 我想看示例代码
👉 查看 [模块开发模板](./module-development-template/) 和 [示例代码](./examples/)

---

## ❓ 常见问题

### Q: 本地模块和远程模块有什么区别？

**本地模块:**
- 源代码在项目中
- 无需下载
- 启动时自动注册
- 适合核心功能

**远程模块:**
- 托管在 GitHub
- 需要下载安装
- 用户可选安装
- 适合扩展功能

### Q: 远程模块安全吗？

- ✅ SHA-256 校验和验证文件完整性
- ✅ 所有模块由你自己开发和发布
- ✅ 用户可以检查 GitHub Release 内容
- ⚠️ 如果未来开放第三方，用户需自行承担风险

### Q: 如何调试远程模块？

1. 本地构建: `npm run build`
2. 修改 manifest.json 的 `bundleUrl` 为本地路径（测试用）
3. 或使用浏览器开发工具查看网络请求和控制台错误

### Q: 可以使用其他托管平台吗？

可以！只要满足以下条件:
- 支持 CORS
- 提供稳定的 HTTPS 访问
- 可以生成直接下载链接

常见选择:
- ✅ GitHub Releases（推荐）
- ✅ GitHub Pages + jsdelivr CDN
- ✅ GitLab Releases
- ✅ 自建服务器（需配置 CORS）

---

## 🤝 贡献指南

### 报告问题
在 GitHub Issues 提交 Bug 报告或功能建议。

### 开发新模块
1. Fork 项目
2. 创建功能分支
3. 使用模块开发模板
4. 提交 Pull Request

### 改进文档
文档永远不够完善，欢迎提交改进！

---

## 📜 许可证

本项目采用 MIT 许可证。查看 [LICENSE](../LICENSE) 文件了解详情。

---

## 📞 联系方式

- GitHub: [ByteTrue/plugin-client](https://github.com/ByteTrue/plugin-client)
- Issues: [提交问题](https://github.com/ByteTrue/plugin-client/issues)

---

**🎉 祝你开发愉快！**
