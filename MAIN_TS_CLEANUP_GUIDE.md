# Main.ts IPC 迁移清理说明

> 2025-12-14

## 已迁移到 ipc-registry.ts 的代码

以下代码段已经迁移到 `electron/ipc-registry.ts`，可以安全删除：

### 1. CPU 使用率计算（Line 45-49, 244-266）
```typescript
let previousCpuUsage = {
  idle: 0,
  total: 0,
};

function getCpuUsage(): number { ... }
```
**状态**：✅ 已迁移到 ipc-registry.ts

---

### 2. 窗口控制 (Line ~168-188)
```typescript
ipcMain.handle('window:control', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.Window_Control`

---

### 3. 应用设置 (Line ~193-239)
```typescript
ipcMain.handle('app-settings:get-auto-launch', ...)
ipcMain.handle('app-settings:set-auto-launch', ...)
ipcMain.handle('app-settings:get-close-to-tray', ...)
ipcMain.handle('app-settings:set-close-to-tray', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.AppSettings_*`

---

### 4. 系统信息 (Line ~271-310)
```typescript
ipcMain.handle('get-system-info', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.System_GetInfo`

---

### 5. 模块存储 (Line ~317-397)
```typescript
ipcMain.handle('module-store:get-all', ...)
ipcMain.handle('module-store:get', ...)
ipcMain.handle('module-store:add', ...)
ipcMain.handle('module-store:update', ...)
ipcMain.handle('module-store:remove', ...)
ipcMain.handle('module-store:get-cache-path', ...)
ipcMain.handle('module-store:remove-cache', ...)
ipcMain.handle('module-store:get-config-path', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.ModuleStore_*`

---

### 6. GitOps (Line ~402-417)
```typescript
ipcMain.handle('git-ops:get-config', ...)
ipcMain.handle('git-ops:update-config', ...)
ipcMain.handle('git-ops:get-announcements', ...)
ipcMain.handle('git-ops:get-tools', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.GitOps_*`

---

### 7. 日志系统 (Line ~422-429)
```typescript
ipcMain.handle('logger:get-log-path', ...)
ipcMain.handle('logger:open-log-folder', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.Logger_*`

---

### 8. 工具管理 (Line ~434-544)
```typescript
ipcMain.handle('tool:get-all', ...)
ipcMain.handle('tool:start', ...)
ipcMain.handle('tool:stop', ...)
ipcMain.handle('tool:focus', ...)
ipcMain.handle('tool:install', ...)
ipcMain.handle('tool:uninstall', ...)
ipcMain.handle('tool:cancel-install', ...)
ipcMain.handle('tool:check-updates', ...)
ipcMain.handle('tool:update', ...)
ipcMain.handle('tool:update-all', ...)
ipcMain.handle('tool:add-local-binary', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.Tool_*`

---

### 9. 对话框 (Line ~604)
```typescript
ipcMain.handle('dialog:openFile', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.Dialog_OpenFile`

---

### 10. Python 环境 (Line ~616-706)
```typescript
ipcMain.handle('python:status', ...)
ipcMain.handle('python:ensure', ...)
ipcMain.handle('python:install-global', ...)
ipcMain.handle('python:list-global', ...)
ipcMain.handle('python:run-code', ...)
ipcMain.handle('python:run-script', ...)
```
**状态**：✅ 已迁移为 `IpcChannel.Python_*`

---

## 保留在 main.ts 中的代码

### 1. 渲染进程日志 (Line 86-92)
```typescript
ipcMain.on(IPC_CHANNELS.RENDERER_CONSOLE_LOG, ...)
ipcMain.handle(IPC_CHANNELS.RENDERER_CONSOLE_LOG, ...)
```
**原因**：⚠️ 将被 LoggerService 的 `app:log-to-main` 替代，暂时保留避免破坏现有功能

---

## 清理步骤

1. ✅ 创建 `ipc-registry.ts`
2. ✅ 调用 `registerAllIpcHandlers(mainWindow)`
3. ⚠️ 删除 main.ts 中已迁移的代码（约 450 行）
4. ✅ 测试所有功能

---

## 预期结果

**main.ts 行数**：
- 当前：~850 行
- 删除后：~400 行（减少 53%）

**职责**：
- 窗口创建和管理
- 服务初始化
- 应用生命周期
- 平台优化

**不再包含**：
- IPC handler 定义（迁移到 ipc-registry.ts）
- 业务逻辑（由服务层处理）
