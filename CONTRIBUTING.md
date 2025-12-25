# 贡献指南

感谢你对 BoolTox 的关注！我们欢迎所有形式的贡献。

## 🚀 快速开始

1. Fork 仓库
2. 创建分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 提交 Pull Request

## 📝 提交规范

使用 Conventional Commits:

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `perf:` 性能优化
- `test:` 测试
- `chore:` 构建/工具

示例:
```bash
git commit -m "feat(plugin): 添加剪贴板管理插件"
git commit -m "fix(ui): 修复插件卡片显示问题"
```

## 🔍 代码审查重点

- ✅ TypeScript 类型安全（无 `any`）
- ✅ 错误处理（try-catch）
- ✅ 性能优化（避免重渲染）
- ✅ 可访问性（Aria 标签）
- ✅ 测试通过（如有）

## 🛠️ 本地开发（本仓库）

```bash
pnpm install
pnpm dev:client
pnpm lint
pnpm type-check
pnpm --filter @booltox/client test:run
```
