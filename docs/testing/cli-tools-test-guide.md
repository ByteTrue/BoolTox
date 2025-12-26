# CLI 工具测试指南（现行实现）

> 目标：验证 `cli` 运行时（终端启动 + 依赖自动安装）。

## 准备

在仓库根目录启动客户端：

```bash
pnpm dev:client
```

示例工具位于：`packages/client/examples/`

## 测试 1：Python CLI（`cli-python-demo`）

1. 在 BoolTox 中找到 **“任务管理器（CLI）”**（`com.booltox.cli-python-demo`）
2. 点击启动

预期：
- 首次运行会触发 Python 环境/依赖安装（由 uv 管理）
- 终端窗口打开并进入交互界面

独立运行（排错用）：

```bash
cd packages/client/examples/cli-python-demo
pip install -r requirements.txt
python cli.py
```

## 测试 2：Node.js CLI（`cli-node-demo`）

1. 在 BoolTox 中找到 **“文件管理器（CLI）”**（`com.booltox.cli-node-demo`）
2. 点击启动

预期：
- 首次运行会触发 npm 依赖安装
- 终端窗口打开，出现交互式菜单

独立运行（排错用）：

```bash
cd packages/client/examples/cli-node-demo
npm install --legacy-peer-deps
node cli.js
```

## 测试 3：Binary CLI（`binary-sysmon-demo`）

1. 在 BoolTox 中找到 **“系统监控（Binary TUI）”**（`com.booltox.binary-sysmon-demo`）
2. 点击启动

预期：
- 无依赖安装
- 终端窗口打开并显示实时 TUI

## 常见排查

- 查看日志目录：`window.ipc.invoke('logger:get-log-path')`
- 依赖安装失败：先在工具目录独立运行，确认工具本身没问题
