# BoolTox 文档索引

> 「好品味的文档 = 能用的文档，不是装饰品。」

---

## 📚 核心文档

### 工具开发

- **[plugins/development-guide.md](./plugins/development-guide.md)** - 工具开发完整指南（推荐阅读）

### 架构设计

- **[architecture-evolution.md](./architecture-evolution.md)** - 工具分类架构演进
- **[tool-classification.md](./tool-classification.md)** - 工具分类详解
- **[BINARY_TOOL_ARCHITECTURE.md](./BINARY_TOOL_ARCHITECTURE.md)** - 二进制工具架构
- **[tool-coverage-matrix.md](./tool-coverage-matrix.md)** - 示例工具覆盖矩阵

### 测试指南

- **[BINARY_TOOL_TEST_GUIDE.md](./BINARY_TOOL_TEST_GUIDE.md)** - 二进制工具测试指南
- **[testing/cli-tools-test-guide.md](./testing/cli-tools-test-guide.md)** - CLI 工具测试指南
- **[testing/deps-installer-test-guide.md](./testing/deps-installer-test-guide.md)** - 依赖安装器测试指南

---

## 📁 文档分类

### features/（功能特性）

- [auto-dependency-install.md](./features/auto-dependency-install.md) - 自动依赖安装
- [cli-tool-support.md](./features/cli-tool-support.md) - CLI 工具支持

### implementation/（实现细节）

- [cli-mode-support.md](./implementation/cli-mode-support.md) - CLI 模式支持实现
- [node-deps-auto-install.md](./implementation/node-deps-auto-install.md) - Node.js 依赖自动安装
- [universal-deps-installer.md](./implementation/universal-deps-installer.md) - 通用依赖安装器

### migration/（迁移指南）

- [webview-to-http-service.md](./migration/webview-to-http-service.md) - 从 webview 迁移到 http-service

### history/（历史归档）

存放已完成任务的报告、旧设计文档等历史记录，供参考。

---

## 🔍 快速导航

### 我想开发一个工具

👉 查看 [plugins/development-guide.md](./plugins/development-guide.md)

### 我想理解架构设计

👉 查看 [architecture-evolution.md](./architecture-evolution.md) 和 [tool-classification.md](./tool-classification.md)

### 我想运行测试

👉 查看 [testing/](./testing/) 目录下的各类测试指南

### 我想了解历史演进

👉 查看 [history/](./history/) 目录和根目录的 [CLAUDE.md](../CLAUDE.md)

---

## 📖 阅读顺序（推荐）

1. **入门**：根目录 [README.md](../README.md) + [CLAUDE.md](../CLAUDE.md)
2. **架构理解**：[architecture-evolution.md](./architecture-evolution.md)
3. **工具开发**：[plugins/development-guide.md](./plugins/development-guide.md)
4. **深入细节**：根据需要查看 features/ 和 implementation/ 目录

---

**提示**：所有文档遵循 Linus Torvalds 的"好品味"理念 - 简洁、实用、零废话。
