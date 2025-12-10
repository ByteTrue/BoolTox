# @booltox/cli - 插件开发 CLI

> [根目录](../../CLAUDE.md) > [packages](./) > **cli**

---

## 变更记录（Changelog）

| 时间 | 操作 | 说明 |
|------|------|------|
| 2025-12-10 21:36 | 首次生成 | 基于当前代码初始化模块文档 |

---

## 模块职责

**插件开发者工具链**，提供命令行工具：
- **创建插件**：脚手架生成（`booltox create`）
- **开发插件**：热重载开发服务器（`booltox dev`）
- **构建插件**：打包生产版本（`booltox build`）
- **打包插件**：生成可分发的 `.zip`（`booltox pack`）

**核心特性**：
- 基于 Commander.js 的 CLI 框架
- 支持 TypeScript/Python 插件模板
- 热重载（Chokidar 监听文件变化）
- 自动压缩打包（Archiver）

---

## 入口与启动

### 安装（全局或本地）
```bash
# 全局安装（推荐）
pnpm add -g @booltox/cli

# 或在插件项目中本地使用
pnpm add -D @booltox/cli
```

### 命令使用

#### 创建插件
```bash
booltox create my-plugin
# 或
pnpm --filter @booltox/cli create my-plugin
```

#### 开发模式
```bash
cd my-plugin
booltox dev
# 或
pnpm --filter @booltox/cli dev
```

#### 构建插件
```bash
booltox build
```

#### 打包插件
```bash
booltox pack
# 输出：dist/my-plugin.zip
```

---

## 对外接口

### CLI 命令

#### `booltox create <name>`
生成插件脚手架：
- 交互式选择模板（TypeScript/Python/混合）
- 生成 `package.json`、`src/` 目录、配置文件

#### `booltox dev`
启动开发服务器：
- 监听文件变化（Chokidar）
- 自动重新编译/热重载
- 输出到 `dist/`

#### `booltox build`
构建生产版本：
- 编译 TypeScript（或打包 Python）
- 压缩代码
- 输出到 `dist/`

#### `booltox pack`
打包为可分发的 `.zip`：
- 包含 `manifest.json`、`dist/`、`README.md`
- 自动生成 SHA256 校验和

---

## 关键依赖与配置

### 核心依赖
- **Commander.js 12**：CLI 框架
- **Chokidar 3**：文件监听（热重载）
- **Archiver 7**：ZIP 打包
- **Chalk 5**：终端彩色输出
- **Ora 8**：加载动画

### 配置文件
- `bin/booltox.js`：CLI 入口文件（Shebang：`#!/usr/bin/env node`）

### 插件模板
- 模板位置：`templates/`（可能未包含在源码中，需从脚手架生成）
- 支持模板：
  - `typescript`：纯 TypeScript 插件
  - `python`：纯 Python 插件
  - `hybrid`：TS 前端 + Python 后端

---

## 数据模型

### 插件清单（manifest.json）
```json
{
  "id": "my-plugin",
  "name": "我的插件",
  "version": "1.0.0",
  "type": "typescript",
  "entry": "dist/index.js",
  "description": "插件描述"
}
```

### 打包结果
```
dist/my-plugin.zip
├── manifest.json
├── dist/
│   ├── index.js
│   └── ...
├── README.md
└── ...
```

---

## 测试与质量

### 当前状态
- ❌ 无单元测试
- ✅ TypeScript 类型检查（如果有 `tsconfig.json`）

### 建议改进
1. 添加 Vitest 单元测试
2. 测试命令执行逻辑（如 `create` 命令是否生成正确文件）
3. E2E 测试（完整插件开发流程）

---

## 常见问题（FAQ）

### Q1：如何自定义插件模板？
**A**：
1. 修改 `templates/` 目录（如果有）
2. 或在 `booltox create` 命令中添加 `--template` 选项

### Q2：开发模式下如何调试插件？
**A**：
1. 运行 `booltox dev`
2. 在 BoolTox Client 中加载 `dist/` 目录
3. 修改源码后自动重新编译

### Q3：打包后如何发布插件？
**A**：
1. 运行 `booltox pack`
2. 将 `dist/my-plugin.zip` 上传到插件仓库（如 GitHub Release）
3. 更新 `plugins/index.json` 元数据

### Q4：CLI 如何扩展新命令？
**A**：
1. 在 `bin/booltox.js` 中添加新的 `program.command()`
2. 实现命令逻辑（如创建新文件、调用外部工具）
3. 更新文档

---

## 相关文件清单

### 核心目录
- `bin/booltox.js`：CLI 入口文件
- `templates/`（可能）：插件模板

### 关键文件
- `bin/booltox.js`：命令注册与执行逻辑
- `package.json`：CLI 配置（`bin` 字段）

---

## 下一步建议

- ✅ 已覆盖：CLI 命令、打包流程
- ⚠️ 待补充：模板文件内容（需查看 `templates/` 目录或生成示例）
- 🔍 推荐操作：运行 `booltox create test-plugin` 体验完整流程
