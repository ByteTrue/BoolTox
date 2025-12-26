# 二进制工具功能测试指南（现行实现）

> 目标：验证“添加本地二进制工具 → 启动 → 卸载”的完整链路。

## 测试环境

- 平台：Windows 10/11（同样适用于 macOS/Linux）
- 准备：任意可执行文件（例如 `cc-switch.exe`）

## 测试步骤（UI）

### 1. 启动客户端

在仓库根目录：

```bash
pnpm dev:client
```

### 2. 添加本地二进制工具

1. 点击 **“添加本地工具”**
2. 选择你的可执行文件（`.exe/.app/.sh/...`）
3. 预期：提示成功，并在工具列表中出现 `local.<name>`（ID 会自动生成）

### 3. 启动工具

1. 在工具列表中点击刚添加的工具
2. 预期：可执行文件启动（Windows 下可在任务管理器看到进程）

### 4. 卸载工具

1. 在工具详情/菜单中选择卸载
2. 预期：工具从列表消失，本地目录被删除：
   - `$userData/tools/<toolId>/`
   - Windows 示例：`C:\\Users\\<User>\\AppData\\Roaming\\@booltox\\client\\tools\\local.xxx\\booltox.json`

## 高级测试（DevTools Console）

打开 DevTools (`Ctrl+Shift+I`)：

### 手动添加

```js
await window.ipc.invoke('tool:add-local-binary-tool', {
  name: 'CC Switch',
  exePath: 'E:\\\\path\\\\to\\\\cc-switch.exe',
  description: '本地二进制工具'
})
```

### 查看工具列表

```js
await window.ipc.invoke('tool:get-all')
```

### 启动/卸载

```js
await window.ipc.invoke('tool:start', 'local.cc-switch')
await window.ipc.invoke('tool:uninstall', 'local.cc-switch')
```

## 相关代码

- UI 入口：`packages/client/src/renderer/contexts/module-context.tsx`
- IPC 实现：`packages/client/electron/ipc-registry.ts`
- 工具加载：`packages/client/electron/services/tool/tool-manager.ts`
