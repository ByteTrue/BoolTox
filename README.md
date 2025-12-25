# BoolTox

BoolTox 是一个桌面端工具启动器：负责「发现 / 安装 / 启动 / 停止」工具进程，本身不当“工具容器”。

## 仓库内容

- `packages/client`：Electron 客户端（Vite + React）
- `packages/cli`：工具开发 CLI（`booltox`）
- `packages/shared`：共享类型/协议/schema
- `packages/client/examples`：示例工具（`http-service` / `cli` / `standalone` / `binary`）

## 快速开始（开发）

**要求**：Node.js `>=20`，pnpm `>=8`

```bash
pnpm install
pnpm dev:client
```

## 常用命令（根目录）

```bash
pnpm dev
pnpm dev:client
pnpm build
pnpm lint
pnpm type-check
pnpm release
```

## 工具配置（`booltox.json`）

工具使用 `booltox.json` 描述。推荐简化配置（最少字段）：

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}
```

- `start`：启动命令（如 `python main.py` / `node server.js`）
- `port`：存在则视为 `http-service`，BoolTox 会打开浏览器
- 高级用法：使用 `runtime`（见 `packages/shared/src/types/protocol.ts`）

## 文档

- 文档索引：`docs/README.md`
- 工具开发：`docs/plugins/development-guide.md`
- 贡献指南：`CONTRIBUTING.md`

## 许可证

见 `LICENSE`（CC-BY-NC-4.0）。
