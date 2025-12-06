# BoolTox（不二工具箱）

<div align="center">

![BoolTox Logo](https://via.placeholder.com/200x200?text=BoolTox)

**开源、可扩展的 Web 工具箱平台**

支持插件生态 · 一键安装 · 完全免费

[在线体验](https://booltox.com) · [插件市场](https://booltox.com/tools/market) · [文档](https://docs.booltox.com) · [贡献指南](#贡献指南)

[![License](https://img.shields.io/badge/license-CC--BY--NC--4.0-blue.svg)](LICENSE)
[![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

</div>

---

## ✨ 特性

- 🌐 **Web 优先** - 零安装门槛，浏览器即用
- 🔌 **插件生态** - 丰富的插件市场，一键安装
- 🚀 **高性能** - 本地 Agent 提供原生性能
- 🎨 **现代设计** - 简约美观的 UI，流畅的动画
- 🔒 **安全可靠** - 开源透明，本地运行，数据隐私
- 🛠️ **易于扩展** - 支持 TypeScript、Python 插件开发
- 📦 **零后端成本** - GitOps 插件市场，GitHub + jsDelivr CDN

---

## 🚀 快速开始

### 在线使用

访问 [https://booltox.com/tools](https://booltox.com/tools)，无需安装即可浏览插件市场。

### 安装 Agent（可选，获取完整功能）

Agent 是一个轻量级的本地服务，提供系统权限和插件运行支持。

**macOS**:
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/macos.sh | bash
\`\`\`

**Windows** (PowerShell):
\`\`\`powershell
irm https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/windows.ps1 | iex
\`\`\`

**Linux**:
\`\`\`bash
curl -fsSL https://raw.githubusercontent.com/ByteTrue/BoolTox/main/packages/agent/install/linux.sh | bash
\`\`\`

### 启动 Agent

\`\`\`bash
cd ~/.booltox/agent/packages/agent
pnpm start
\`\`\`

Agent 将运行在 http://localhost:9527

---

## 📸 截图

<div align="center">

### 工具箱首页
![工具箱首页](docs/screenshots/tools-home.png)

### 插件市场
![插件市场](docs/screenshots/plugin-market.png)

### 插件详情
![插件详情](docs/screenshots/plugin-detail.png)

### 插件运行
![插件运行](docs/screenshots/plugin-running.png)

</div>

---

## 🏗️ 架构

BoolTox 采用 **Web + Agent** 混合架构：

\`\`\`
┌─────────────────┐
│   Web 前端       │  ← Next.js 15, React 19
│  (浏览器访问)    │     零安装，SEO 友好
└────────┬────────┘
         │ HTTP/WebSocket
┌────────▼────────┐
│  本地 Agent      │  ← Node.js, Fastify
│  (可选安装)      │     进程调度，系统权限
└────────┬────────┘
         │
┌────────▼────────┐
│   插件生态       │  ← TypeScript, Python
│  (独立仓库)      │     可选安装，热插拔
└─────────────────┘
\`\`\`

### 技术栈

**Web 前端**:
- Next.js 15 (App Router)
- React 19
- Tailwind CSS + shadcn/ui
- Framer Motion
- Zustand

**Agent 后端**:
- Node.js 20+
- Fastify (高性能 HTTP)
- WebSocket
- SQLite (better-sqlite3)

**插件系统**:
- TypeScript / Python
- JSON-RPC 2.0 协议
- PostMessage 通信
- 独立虚拟环境

---

## 📦 项目结构

\`\`\`
BoolTox/
├── packages/
│   ├── web/              # Next.js 前端
│   ├── agent/            # 本地 Agent 服务
│   ├── core/             # 共享业务逻辑
│   ├── sdk/              # 前端 SDK
│   └── plugin-sdk/       # 插件开发 SDK
│
├── docs/                 # 文档
├── .github/              # GitHub Actions
└── README.md

booltox-plugins/          # 独立插件仓库
├── packages/
│   ├── official/         # 官方插件
│   ├── community/        # 社区插件
│   └── examples/         # 示例插件
└── plugins/              # GitOps 元数据
    └── index.json        # 插件注册表
\`\`\`

---

## 🔌 插件生态

### 官方插件

- 🍅 **番茄钟** - 番茄工作法计时器，系统通知提醒
- 📋 **剪贴板管理** - 剪贴板历史记录（即将推出）
- 📝 **快速笔记** - 轻量级笔记工具（即将推出）

### 插件类型

BoolTox 支持 4 种插件类型：

1. **纯 TypeScript** - 纯前端插件（无需后端）
2. **纯 Python** - 独立命令行工具
3. **TS 前后端** - TS 前端 + TS 后端
4. **TS 前端 + Python 后端** - 跨语言组合

---

## 🛠️ 开发

### 环境要求

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Python >= 3.12 (可选，用于 Python 插件)

### 本地开发

\`\`\`bash
# 克隆仓库
git clone https://github.com/ByteTrue/BoolTox.git
cd BoolTox

# 安装依赖
pnpm install

# 启动开发服务
pnpm dev:agent  # 启动 Agent (http://localhost:9527)
pnpm dev:web    # 启动 Web 前端 (http://localhost:3000)
\`\`\`

### 开发插件

\`\`\`bash
# 克隆插件仓库
git clone https://github.com/ByteTrue/booltox-plugins.git

# 创建新插件
cd booltox-plugins
pnpm create:plugin my-awesome-plugin

# 开发插件
cd packages/official/my-awesome-plugin
pnpm dev
\`\`\`

详见 [插件开发指南](docs/PLUGIN_DEVELOPMENT.md)

---

## 📚 文档

- [项目进度](docs/PROGRESS.md) - 当前开发进度和计划
- [架构设计](docs/agent-platform-spec.md) - Web + Agent 架构详解
- [插件管理](docs/PLUGIN_MANAGEMENT_REDESIGN.md) - 插件系统设计
- [插件开发指南](docs/PLUGIN_DEVELOPMENT.md) - 如何开发插件
- [API 文档](docs/API.md) - Agent API 和插件 API
- [贡献指南](CONTRIBUTING.md) - 如何参与贡献

---

## 🤝 贡献

欢迎贡献代码、提交 bug 报告或建议新功能！

### 提交 Pull Request

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

### 开发插件

插件托管在独立仓库：[booltox-plugins](https://github.com/ByteTrue/booltox-plugins)

1. Fork 插件仓库
2. 开发插件
3. 提交 Pull Request
4. 通过审核后自动发布到插件市场

---

## 📄 许可证

- **主仓库**: [CC-BY-NC-4.0](LICENSE) - 非商业使用
- **官方插件**: MIT - 商业友好
- **社区插件**: 各插件自行决定

---

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Fastify](https://fastify.dev/) - 高性能 Node.js 框架
- [shadcn/ui](https://ui.shadcn.com/) - UI 组件库
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [uv](https://github.com/astral-sh/uv) - Python 包管理器

---

## 📞 联系方式

- **官网**: https://booltox.com
- **GitHub**: https://github.com/ByteTrue/BoolTox
- **问题反馈**: https://github.com/ByteTrue/BoolTox/issues
- **邮箱**: team@booltox.com

---

<div align="center">

**⭐ 如果觉得有用，请给个 Star ⭐**

Made with ❤️ by BoolTox Team

</div>
