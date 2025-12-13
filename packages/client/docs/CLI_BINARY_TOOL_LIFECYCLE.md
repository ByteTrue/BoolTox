# CLI 和 Binary 工具的状态管理设计

> 外部运行工具的生命周期管理方案

---

## TL;DR（核心问题）

**问题**：CLI 和 Binary 工具在外部终端/窗口运行，BoolTox 无法可靠地跟踪它们的生命周期。

**解决方案**：不监听 `exit` 事件，保持状态为 `running`，让用户手动点击停止按钮。

---

## 问题分析

### 工具类型对比

| 工具类型 | 运行位置 | 生命周期管理 | 关闭按钮 |
|---------|---------|-------------|---------|
| **HTTP Service** | 后台进程 | BoolTox 完全控制 | ✅ 可靠 |
| **Standalone（Python）** | 后台进程 | BoolTox 完全控制 | ✅ 可靠 |
| **CLI** | 外部终端 | ❌ 无法可靠跟踪 | ⚠️ 需特殊处理 |
| **Binary** | 外部窗口 | ❌ 无法可靠跟踪 | ⚠️ 需特殊处理 |

### 为什么无法可靠跟踪？

#### CLI 工具启动流程

```
BoolTox spawn('cmd', ['/c', 'start "title" batchFile'])
    ↓
Windows 创建新终端窗口
    ↓
新终端执行批处理文件
    ↓
批处理文件运行 Python/Node.js 工具
    ↓
原 spawn 进程立即退出（code: 0）← ❌ 这不是工具的退出！
```

**时间线**：
```
00.000s: spawn('cmd', ...)
00.010s: start 命令启动新终端
00.020s: spawn 进程退出 (code: 0) ← 这是正常的！
00.020s: 如果监听 exit → 触发 handleStandaloneExit
00.020s: 设置 launchState = 'stopped'
00.020s: 关闭按钮消失 ❌

（实际的 CLI 工具仍在新终端中运行！）
```

#### Binary 工具同理

```
spawn('binary.exe', ...)  with detached: true
    ↓
二进制程序创建自己的窗口
    ↓
spawn 进程可能立即退出
    ↓
但工具仍在运行！
```

---

## 解决方案

### 方案 A：不监听 exit 事件（已采用）

**实现**：
```typescript
// CLI 工具
state.process = terminalProcess;
state.runtime.status = 'running';
this.emitState(state, 'running', { external: true });

// ❌ 不监听 exit 事件！
// terminalProcess.on('exit', (code) => {
//   this.handleStandaloneExit(toolId, code);
// });

return terminalProcess.pid ?? -1;
```

**优点**：
- ✅ 关闭按钮始终显示
- ✅ 用户可以手动停止
- ✅ 简单可靠

**缺点**：
- ⚠️ 如果用户直接关闭终端窗口，BoolTox 仍显示"运行中"
- ⚠️ 需要用户手动点击停止按钮

### 方案 B：定期检查进程（未采用）

**实现**：
```typescript
const checkInterval = setInterval(() => {
  // 检查 PID 是否仍存在
  if (!isProcessRunning(pid)) {
    this.handleStandaloneExit(toolId, null);
    clearInterval(checkInterval);
  }
}, 5000);
```

**优点**：
- ✅ 可以检测到工具退出

**缺点**：
- ❌ PID 可能被复用（检测不可靠）
- ❌ 需要持续轮询（性能开销）
- ❌ 跨平台实现复杂

### 方案 C：提供"同步状态"按钮（未采用）

**实现**：
```typescript
// 在 UI 上提供一个"刷新状态"按钮
// 用户可以手动同步工具状态
```

**优点**：
- ✅ 用户可以主动同步状态

**缺点**：
- ❌ 增加 UI 复杂度
- ❌ 仍然需要检测进程是否运行（可靠性问题）

---

## 当前设计（方案 A）

### CLI 工具

```typescript
// 启动后立即设置为 running
state.runtime.status = 'running';
this.emitState(state, 'running', { external: true });

// 不监听 exit 事件（因为 spawn 进程会立即退出）

// 用户点击停止按钮时
destroyPlugin(state) {
  // 实际上只是标记为 stopped
  // 无法真正杀死外部终端中的进程
  state.runtime.status = 'stopped';
  this.emitState(state, 'stopped');
}
```

### Binary 工具

```typescript
// 启动后立即设置为 running
state.runtime.status = 'running';
this.emitState(state, 'running', { external: true });

// 不监听 exit 事件

// 用户点击停止按钮时
destroyPlugin(state) {
  // 尝试杀死进程（如果有 PID）
  if (state.process && state.process.pid) {
    taskkill /F /T /PID ${pid}
  }
  state.runtime.status = 'stopped';
  this.emitState(state, 'stopped');
}
```

---

## 用户体验

### 正常流程

```
1. 用户点击"启动 CLI 工具"
   → 新终端窗口打开，显示交互式界面
   → BoolTox 显示"窗口运行中"+ 停止按钮 ✅

2. 用户在终端中使用工具
   → 工具正常运行

3. 用户使用完毕，在终端中输入 exit 退出
   → 终端窗口关闭
   → BoolTox 仍显示"运行中" ⚠️

4. 用户回到 BoolTox，点击"停止"按钮
   → 状态变为"已停止"
   → 停止按钮消失 ✅
```

### 异常情况

#### 情况 1：用户直接关闭终端窗口

```
1. 用户点击终端窗口的 X 按钮
   → 工具退出，终端关闭
   → BoolTox 仍显示"运行中" ⚠️

2. 用户回到 BoolTox，点击"停止"按钮
   → 状态变为"已停止" ✅
```

**影响**：轻微困惑（显示运行中但实际已停止）

**缓解方案**：
- 在工具说明中提示用户使用停止按钮
- 或者在停止按钮旁边显示"（如已关闭请点击此按钮）"

#### 情况 2：工具启动失败

```
1. 用户点击"启动"
   → 终端窗口打开，显示错误信息后立即关闭
   → BoolTox 显示"运行中" ⚠️

2. 用户点击停止按钮
   → 状态变为"已停止" ✅
```

**影响**：轻微困惑

**缓解方案**：
- 改进批处理文件，添加 `pause` 命令（错误时不自动关闭）

---

## 设计权衡

### 为什么不用方案 B（定期检查进程）？

#### 问题 1：PID 复用

```
1. CLI 工具启动（PID: 12345）
2. 用户关闭终端
3. 新进程启动（PID: 12345）← 系统复用了 PID
4. BoolTox 检查 PID 12345 仍存在 ✅
5. 但这不是我们的工具！
```

#### 问题 2：跨平台检测复杂

```
// Windows
tasklist /FI "PID eq 12345"  // 可能返回错误或需要解析输出

// macOS/Linux
ps -p 12345  // 同样需要解析输出
```

#### 问题 3：性能开销

```
每 5 秒检查一次 × 10 个工具 = 每秒 2 次系统调用
```

### 为什么不用方案 C（同步状态按钮）？

#### 问题 1：仍需要检测逻辑

同步状态按钮仍然需要检测进程是否运行（与方案 B 同样的问题）。

#### 问题 2：UI 复杂度

增加一个按钮，需要：
- 设计 UI
- 处理状态同步逻辑
- 用户教育成本

#### 问题 3：用户困惑

"为什么我需要手动同步状态？"

---

## 当前方案的优势

### 1. 简单可靠

- ✅ 不依赖不可靠的进程检测
- ✅ 用户意图明确（点击停止按钮）
- ✅ 无性能开销

### 2. 符合用户期望

大多数用户的使用流程：
```
启动工具 → 使用 → 点击停止按钮 → 结束
```

而不是：
```
启动工具 → 使用 → 直接关闭终端 → ？
```

### 3. 明确的职责边界

- **BoolTox**：管理工具的启动和标记状态
- **用户**：使用工具和标记停止
- **工具本身**：在外部独立运行

---

## 改进建议（可选）

### UI 提示

在停止按钮旁边显示提示：

```tsx
{isRunning && (
  <div className="flex items-center gap-2">
    <button onClick={onStop}>停止</button>
    <span className="text-xs text-gray-500">
      （工具在外部窗口运行，关闭窗口后请点击此按钮）
    </span>
  </div>
)}
```

### 批处理文件改进

添加错误处理，防止窗口闪退：

```batch
@echo off
chcp 65001 >nul
cd /d "${cwd}"
${cmdParts.join(' ')}

REM 如果工具退出码非 0，暂停以显示错误
if %errorlevel% neq 0 (
  echo.
  echo [错误] 工具退出码: %errorlevel%
  pause
)
```

---

## 代码变更

### tool-runner.ts:850-864（CLI 工具）

```typescript
// ❌ 之前：监听 exit 事件
terminalProcess.on('exit', (code) => {
  this.handleStandaloneExit(toolId, code);  // 立即设置 stopped
});

// ✅ 现在：不监听 exit 事件
// 注释掉，保持状态为 running
```

### tool-runner.ts:295-304（Binary 工具）

```typescript
// ❌ 之前：监听 exit 事件
child.on('exit', (code) => {
  this.handleStandaloneExit(toolId, code);  // 立即设置 stopped
});

// ✅ 现在：不监听 exit 事件
// 注释掉，保持状态为 running
```

---

## 停止按钮行为

### HTTP 服务工具

```typescript
stopTool(toolId) {
  // 1. 杀死进程树
  taskkill /F /T /PID ${pid}

  // 2. 端口释放
  // 3. 状态变为 stopped
}
```

**完全可靠** ✅

### CLI 工具

```typescript
stopTool(toolId) {
  // 1. 标记状态为 stopped
  state.runtime.status = 'stopped';
  this.emitState(state, 'stopped');

  // 2. 实际的终端进程可能仍在运行
  //    但用户已经关闭了终端窗口
}
```

**语义**：标记为已停止（而非强制停止）⚠️

### Binary 工具

```typescript
stopTool(toolId) {
  // 1. 尝试杀死进程（如果有 PID）
  if (state.process && state.process.pid) {
    taskkill /F /T /PID ${pid}
  }

  // 2. 标记状态为 stopped
  state.runtime.status = 'stopped';
  this.emitState(state, 'stopped');
}
```

**可靠性**：中等（取决于是否有有效 PID）⚠️

---

## 常见问题

### Q1: 为什么关闭终端窗口后，BoolTox 仍显示"运行中"？

**A**: 因为 BoolTox 无法可靠地检测外部终端的关闭。请点击停止按钮来标记工具已停止。

### Q2: 点击停止按钮后，终端窗口还在运行怎么办？

**A**: 这是因为我们无法强制关闭外部终端。请手动关闭终端窗口。

### Q3: 能否自动检测工具是否仍在运行？

**A**: 技术上可以，但不可靠：
- PID 可能被系统复用
- 跨平台实现复杂
- 需要持续轮询（性能开销）

### Q4: 为什么不让 CLI 工具在 BoolTox 内运行（如嵌入终端）？

**A**: 这违背了 BoolTox 的设计理念：
- 工具应该完全独立
- 可以手动运行（`python tool.py`）
- 不依赖 BoolTox SDK

---

## 最佳实践

### 用户使用指南

**推荐流程**：
```
1. 在 BoolTox 中点击"启动 CLI 工具"
2. 新终端窗口打开，使用工具
3. 使用完毕后，在终端中输入 exit 退出
4. 回到 BoolTox，点击"停止"按钮
```

**不推荐**：
```
1. 启动工具
2. 直接关闭终端窗口（BoolTox 不知道工具已停止）
3. 忘记点击停止按钮
4. 下次启动时困惑为什么显示"运行中"
```

### 工具开发指南

**CLI 工具应该**：
- 提供明确的退出命令（如 `exit`、`quit`）
- 捕获 Ctrl+C 并优雅退出
- 在退出时清理资源

**示例**：
```python
# cli.py
try:
    while True:
        cmd = input('> ')
        if cmd in ('exit', 'quit'):
            print('再见！')
            break
except KeyboardInterrupt:
    print('\n再见！')
```

---

## 未来改进（可选）

### 改进 1：批处理文件错误处理

```batch
@echo off
chcp 65001 >nul
cd /d "${cwd}"
${cmdParts.join(' ')}

REM 错误时暂停，防止窗口闪退
if %errorlevel% neq 0 (
  echo.
  echo [错误] 工具退出码: %errorlevel%
  echo 按任意键关闭窗口...
  pause >nul
)
```

### 改进 2：UI 提示

在停止按钮旁边显示说明：
```
[停止] （工具在外部运行，关闭后请点击此按钮）
```

### 改进 3：智能检测（长期）

使用更可靠的方式检测工具是否运行：
- 工具自己报告状态（通过文件、HTTP 等）
- 使用进程组而非 PID
- 平台特定的进程跟踪 API

---

## 总结

### 修复前

```
CLI 工具启动 → spawn 立即退出 → 监听 exit → 设置 stopped → 关闭按钮消失 ❌
```

### 修复后

```
CLI 工具启动 → spawn 立即退出 → 不监听 exit → 保持 running → 关闭按钮显示 ✅
```

### 权衡

| 特性 | 之前 | 现在 |
|------|-----|------|
| 关闭按钮显示 | ❌ 立即消失 | ✅ 始终显示 |
| 状态准确性 | ⚠️ 错误（显示已停止但仍运行） | ⚠️ 可能滞后（显示运行中但已停止） |
| 用户操作 | ❌ 无法停止 | ✅ 可手动停止 |

**结论**：当前方案更好，因为"可以停止但状态滞后"优于"无法停止"。

---

## Linus 评价

> 🟢 **正确的设计决策**
>
> **核心洞察**：
> - 外部进程的生命周期**不应该**由父进程管理
> - 这不是 bug，这是分离进程的设计特性
>
> **数据结构决定代码质量**：
> - spawn 返回的 ChildProcess ≠ 实际工具进程
> - 监听 spawn.exit 是错误的"数据结构映射"
>
> **正确做法**：
> - 接受我们无法跟踪外部进程
> - 让用户明确标记状态
> - 不要试图"智能检测"不可靠的东西
>
> **记住**：简单的手动操作 > 复杂的自动检测。

---

## 相关文件

- `tool-runner.ts:850-864` - CLI 工具不监听 exit
- `tool-runner.ts:295-304` - Binary 工具不监听 exit
- `terminal-launcher.ts` - 终端启动逻辑
