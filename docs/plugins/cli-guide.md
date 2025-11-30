# BoolTox CLI 使用指南

## 安装
本地开发直接运行仓库内脚本：
```
pnpm --filter @booltox/cli exec booltox --help
```
或发布后使用：
```
pnpm dlx @booltox/cli@latest --help
```

## 命令概览
- `booltox create <name> --template <template>`：从模板创建插件目录。
- `booltox dev [--path <dir>] [--no-frontend]`：后端文件变更自动重启（Python/Node），若检测到 package.json 有 dev/start 脚本则自动启动前端。
- `booltox build [--path <dir>]`：校验 manifest 并提示手动构建（当前占位）。
- `booltox pack [--path <dir>]`：打包为 `.booltox`（ZIP，忽略 node_modules/.git/log），并生成 `metadata.json`（hash/size）。
- `booltox templates`：列出模板。

### 模板列表
- `python-backend`：Web 前端 + Python 后端（JSON-RPC）
- `node-backend`：Web 前端 + Node.js 后端（JSON-RPC）
- `python-standalone`：纯 Python GUI（tkinter 示例）
- `frontend-only`：纯前端，无后端

## 开发模式（当前实现）
- 后端：监听 `runtime.backend.entry` 所在目录，变更即重启进程。默认注入 `BOOLTOX_PLUGIN_ID`，若仓库存在内置 SDK（resources/node-sdk/python-sdk）会自动设置 NODE_PATH/PYTHONPATH。
- 前端：若检测到 package.json 的 dev/start 脚本，则自动 `pnpm run <script>`，否则提示跳过。
- Python 解释器：使用环境变量 `BOOLTOX_PYTHON` 覆盖，默认为系统 python/python3。

## 打包/发布（当前实现）
- `pack` 压缩插件目录（排除 node_modules/.git/log），输出 `<plugin>/dist/<id>.booltox` 与 `metadata.json`（hash/size/manifest 信息）。
- 若插件位于仓库 `packages/client/plugins/<id>`，会自动调用客户端脚本 `packages/client/scripts/package-plugin.mjs`，在 `resources/plugins/<id>/` 生成 `plugin.zip + metadata.json`（与客户端发布格式一致）。

## 注意事项
- Python 模板声明 `runtime.backend.requirements` 时，运行在客户端内会使用独立虚拟环境；CLI dev 采用系统 Python 热重载。
- Standalone 模板不创建 BrowserWindow，GUI 由插件管理；日志通过 stdout。
- 若需更复杂的打包（签名、校验）可对接客户端 `package-plugin.mjs` 脚本。
