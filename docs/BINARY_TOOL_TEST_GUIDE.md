# 二进制工具功能测试指南

> **测试新增的二进制工具支持功能**

## 测试环境

- **平台**: Windows 10/11
- **测试工具**: cc-switch.exe (位于项目根目录)
- **Electron 版本**: 38.4.0

---

## 测试步骤

### 1. 启动 Electron Client

```bash
cd E:\Code\TS\BoolTox\booltox-web
pnpm dev:client
```

等待 Client 完全启动（看到主窗口）

---

### 2. 测试：添加本地工具（UI 方式）

1. **打开模块中心**（如果不在模块中心页面）
2. **找到"添加本地工具"按钮**（搜索框右侧，Plus 图标）
3. **点击按钮**
4. **选择文件**：
   - 路径：`E:\Code\TS\BoolTox\booltox-web\cc-switch.exe`
   - 点击"打开"
5. **验证**：
   - 应该看到成功提示："已添加工具：cc-switch"
   - 插件列表中应该出现 `local.cc-switch`

---

### 3. 测试：启动工具

1. **在插件列表中找到 `local.cc-switch`**
2. **点击卡片或"启动"按钮**
3. **验证**：
   - cc-switch.exe 窗口应该弹出
   - 任务管理器中应该有 cc-switch.exe 进程

---

### 4. 测试：卸载工具

1. **右键点击工具卡片**（或找到卸载按钮）
2. **选择"卸载"**
3. **验证**：
   - 工具从列表中消失
   - `$userData/plugins/local.cc-switch/` 目录被删除

---

## 高级测试（DevTools Console）

打开 DevTools (`Ctrl+Shift+I`)，在 Console 中运行：

### 测试1：手动添加本地工具

```javascript
// 添加工具
const result = await window.ipc.invoke('plugin:add-local-binary', {
  name: 'CC Switch',
  exePath: 'E:\\Code\\TS\\BoolTox\\booltox-web\\cc-switch.exe',
  description: 'API 配置切换工具'
})

console.log(result)
// 期望: { success: true, pluginId: 'local.cc-switch' }
```

### 测试2：查看所有插件

```javascript
const plugins = await window.ipc.invoke('plugin:get-all')
console.log(plugins)

// 找到 local.cc-switch
const ccSwitch = plugins.find(p => p.id === 'local.cc-switch')
console.log('CC Switch:', ccSwitch)
```

### 测试3：启动工具

```javascript
await window.ipc.invoke('plugin:start', 'local.cc-switch')
// 期望: cc-switch.exe 窗口弹出
```

### 测试4：卸载工具

```javascript
await window.ipc.invoke('plugin:uninstall', 'local.cc-switch')
// 期望: { success: true }
```

---

## 验证检查清单

- [ ] 文件选择对话框可以正常打开
- [ ] 选择 .exe 文件后显示成功提示
- [ ] 工具出现在插件列表中
- [ ] 点击工具可以正常启动
- [ ] cc-switch.exe 窗口弹出
- [ ] 卸载后工具从列表消失
- [ ] manifest.json 正确生成在 `$userData/plugins/local.cc-switch/`
- [ ] manifest 包含 `runtime.type: 'binary'` 和 `localExecutablePath`

---

## 错误排查

### 问题1：文件选择对话框没有弹出

**排查**：
- 检查 DevTools Console 是否有错误
- 确认 IPC handler `dialog:openFile` 已注册（查看 main.ts:521）

### 问题2：添加后工具没有出现

**排查**：
```javascript
// 检查插件目录
const plugins = await window.ipc.invoke('plugin:get-all')
console.log('所有插件:', plugins.map(p => ({ id: p.id, name: p.manifest.name })))
```

### 问题3：启动失败

**排查**：
- 检查可执行文件路径是否正确
- 查看日志：`E:\Code\TS\BoolTox\booltox-web\packages\client\logs\main.log`
- 在 Console 中检查错误：
  ```javascript
  window.ipc.invoke('logger:get-log-path').then(console.log)
  ```

---

## 预期文件结构

### 添加后的 manifest.json

路径：`C:\Users\Byte\AppData\Roaming\@booltox\client\plugins\local.cc-switch\manifest.json`

```json
{
  "id": "local.cc-switch",
  "version": "1.0.0",
  "name": "cc-switch",
  "description": "从本地添加的工具",
  "runtime": {
    "type": "binary",
    "command": "E:\\Code\\TS\\BoolTox\\booltox-web\\cc-switch.exe",
    "localExecutablePath": "E:\\Code\\TS\\BoolTox\\booltox-web\\cc-switch.exe",
    "args": []
  }
}
```

---

## 成功标志

✅ 所有测试通过后，你应该可以：
1. 通过 UI 快速添加任何本地可执行文件
2. 一键启动工具（类似 Mac 的 Launchpad）
3. 方便管理本地工具（卸载、查看信息）

**这就是我们想要的 Launchpad 功能！** 🚀
