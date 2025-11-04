# Contributing to Booltox · 不二工具箱

首先，感谢你愿意为 Booltox（不二工具箱）贡献代码！🎉

我们欢迎所有形式的贡献，包括但不限于：代码、文档、问题报告、功能建议等。

## 📋 行为准则

参与本项目即表示你同意遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

## 🚀 如何贡献

### 报告 Bug

如果你发现了 Bug，请：

1. 检查 [Issues](../../issues) 确保该问题尚未被报告
2. 创建一个新的 Issue，包含：
   - 清晰的标题和描述
   - 重现步骤
   - 预期行为和实际行为
   - 环境信息（操作系统、Node 版本等）
   - 截图或错误日志（如果有）

### 提出功能建议

如果你有好的想法：

1. 检查 [Issues](../../issues) 和 [Discussions](../../discussions) 确保未被提出
2. 创建一个新的 Issue 或 Discussion，说明：
   - 功能的具体描述
   - 使用场景和解决的问题
   - 可能的实现方案（可选）

### 提交代码

#### 开发流程

1. **Fork 项目**
   ```bash
   # 点击页面右上角的 Fork 按钮
   ```

2. **Clone 到本地**
   ```bash
   git clone https://github.com/YOUR_USERNAME/booltox.git
   cd booltox
   ```

3. **安装依赖**
   ```bash
   npm install
   ```

4. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

5. **开发和测试**
   ```bash
   # 开发模式
   npm run dev
   
   # 运行测试
   npm run test
   
   # 代码检查
   npm run lint
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   # 或
   git commit -m "fix: resolve issue #123"
   ```

7. **推送到 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 访问你的 Fork 页面
   - 点击 "New Pull Request"
   - 填写 PR 描述

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式（不影响代码逻辑）
- `refactor:` 重构（不新增功能，不修复 Bug）
- `perf:` 性能优化
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat: add module installation progress bar
fix: resolve module activation crash on startup
docs: update module development guide
```

#### 代码规范

我们遵循以下编码原则：

1. **SOLID 原则**
   - 单一职责原则
   - 开放封闭原则
   - 里氏替换原则
   - 接口隔离原则
   - 依赖倒置原则

2. **KISS 原则** - 保持简单
3. **DRY 原则** - 不要重复自己
4. **YAGNI 原则** - 你不会需要它

具体要求：

- 使用 TypeScript strict 模式
- 所有函数和类都要有 JSDoc 注释
- 测试覆盖率 > 70%
- 遵循 ESLint 规则
- 避免使用 `any` 类型
- 优先使用函数式编程

#### Pull Request 检查清单

提交 PR 前，请确保：

- [ ] 代码通过所有测试 (`npm run test`)
- [ ] 代码通过 Lint 检查 (`npm run lint`)
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 提交信息符合规范
- [ ] PR 描述清晰，说明了改动内容
- [ ] 关联了相关的 Issue（如果有）

## 📦 项目结构

```
booltox/
├── electron/              # Electron 主进程
├── src/
│   ├── renderer/          # 渲染进程
│   │   ├── components/    # UI 组件
│   │   ├── contexts/      # React Context
│   │   ├── content/       # UI 展示内容
│   │   └── lib/           # 前端通用工具
│   ├── core/              # 核心领域逻辑
│   │   └── modules/       # 模块注册与类型
│   ├── modules/           # 内建功能模块
│   └── main/              # 主进程业务工具
├── docs/                  # 文档
└── modules/               # 示例模块
```

## 🧪 测试指南

### 运行测试

```bash
# 运行所有测试
npm run test

# 监听模式
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

### 编写测试

- 单元测试使用 Jest + Testing Library
- 测试文件命名：`*.test.ts` 或 `*.test.tsx`
- 测试文件放在 `__tests__` 目录或与源文件同级

示例：
```typescript
describe('ModuleManager', () => {
  it('should enable module successfully', async () => {
    // 测试代码
  });
});
```

## 📝 文档贡献

文档同样重要！你可以：

- 改进现有文档
- 翻译文档
- 添加示例和教程
- 修正拼写和语法错误

文档位于 `docs/` 目录，使用 Markdown 格式。

## 🐛 开发调试

### 常用命令

```bash
# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 代码检查
npm run lint
```

### 调试技巧

1. **Chrome DevTools**
   - 在开发模式下，按 `F12` 打开开发者工具

2. **日志输出**
   - 使用 `console.log` 输出调试信息
   - 生产环境会自动移除调试日志

3. **断点调试**
   - 在 DevTools 中设置断点
   - 使用 `debugger;` 语句

## 💬 获取帮助

如果你有任何问题：

1. 查看 [文档](./docs/)
2. 搜索 [Issues](../../issues)
3. 参与 [Discussions](../../discussions)
4. 联系维护者

## 📜 许可证

贡献的代码将采用 MIT 许可证，与项目保持一致。

---

再次感谢你的贡献！🙏

如果觉得这个项目有用，别忘了给我们一个 ⭐ Star！
