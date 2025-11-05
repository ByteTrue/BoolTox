# Booltox · 不二工具箱

<div align="center">
  
  ![Booltox Toolbox](https://img.shields.io/badge/Booltox-Toolbox-blue?style=flat-square)
  ![Version](https://img.shields.io/badge/version-0.0.0-green?style=flat-square)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-blue?style=flat-square)
  ![Electron](https://img.shields.io/badge/Electron-38.1.2-9feaf9?style=flat-square)
  ![React](https://img.shields.io/badge/React-19.1.0-61dafb?style=flat-square)

</div>

## 🎯 项目简介

**Booltox（不二工具箱）** 是一个基于 Electron 的现代化桌面应用程序，面向个人化的模块化工作台场景。所有功能以模块形态拆分，按需加载、启用或卸载，保持桌面客户端轻量而一致的交互体验。

### ✨ 核心特性

- 🧩 **模块化架构** - 所有功能模块原生集成，可随装随卸
- 🎨 **现代化 UI** - 基于 React 19 + Tailwind CSS，支持深色/浅色主题
- ⚡ **轻量体验** - 仅加载已启用模块，保持主壳性能稳定
- 📱 **响应式设计** - 支持多种屏幕尺寸和分辨率
- 🔄 **按需启用** - 模块状态随时切换，减少不必要的后台开销
- 🎯 **类型安全** - 全量 TypeScript，配合严格的 ESLint 规则

## 🛠️ 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Electron** | 38.1.2 | 桌面应用框架 |
| **React** | 19.1.0 | UI 框架 |
| **TypeScript** | 5.2.2 | 类型安全 |
| **Vite** | 7.1.7 | 构建工具 |
| **Tailwind CSS** | 3.4.4 | 样式框架 |
| **Framer Motion** | 12.23.16 | 动画库 |

## 🚀 快速开始

### 环境要求

- Node.js 20+ 
- npm 或 yarn
- Git

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd booltox

# 安装依赖
npm install
```

### 开发模式

```bash
# 启动开发服务器
npm run dev
```

### 构建项目

```bash
# 构建生产版本
npm run build
```

### 代码检查

```bash
# 运行 ESLint
npm run lint
```

## 📁 项目结构

```
booltox/
├── electron/              # Electron 主进程
│   ├── main.ts            # 主进程入口
│   └── preload.ts         # 预加载脚本
├── src/
│   ├── main.tsx           # React 应用入口
│   ├── core/
│   │   └── modules/       # 模块注册与类型定义
│   ├── modules/           # 原生功能模块实现
│   ├── renderer/          # 渲染进程界面层
│   │   ├── components/    # UI 组件与应用壳
│   │   ├── contexts/      # Context Provider
│   │   └── content/       # 静态展示内容
│   └── main/              # 主进程辅助工具
├── public/                # 静态资源
└── docs/                  # 文档
```

## 🧩 模块开发

- 在 `src/modules` 下新增目录并导出默认的 React 组件。
- 在 `src/core/modules/registry.ts` 中登记模块元数据（名称、版本、描述、懒加载入口等）。
- `ModuleProvider` 负责模块的安装、启用、停用与卸载，并在首次访问时懒加载组件。
- 渲染层通过 `useModulePlatform()` 获取模块列表、统计信息以及状态切换方法。

## 🧪 测试

目前项目正在建立测试框架，计划包含：

- [ ] 单元测试 (Jest + Testing Library)
- [ ] 集成测试 (模块系统)  
- [ ] 端到端测试 (Electron)

## 📋 开发计划

### 短期目标 (1-2周)
- [x] 基础环境搭建和构建配置
- [x] 类型系统完善
- [ ] 模块中心基础功能
- [ ] 测试框架建立

### 中期目标 (1-2个月)
- [ ] 模块间通信机制
- [ ] 模块依赖管理
- [ ] 快捷键系统
- [ ] 工作空间管理

### 长期目标 (3-6个月)
- [ ] 模块扩展生态
- [ ] 多用户支持
- [ ] 企业级功能

## 🤝 贡献指南

我们欢迎社区贡献！请遵循以下原则：

- **SOLID** 原则 - 保持代码架构清晰
- **KISS** 原则 - 保持简单易懂
- **DRY** 原则 - 避免重复代码
- **YAGNI** 原则 - 只实现必要功能

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙋‍♀️ 支持

如有问题或建议，请：

- 提交 [Issue](../../issues)
- 参与 [Discussions](../../discussions)
- 查看 [文档](./docs/)

---

<div align="center">
  Made with ❤️ by Booltox Team
</div>
