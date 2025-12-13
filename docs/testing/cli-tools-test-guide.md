# CLI 工具测试指南

## 🎯 测试 CLI 模式

### 准备工作

**确保已构建最新代码**:
```bash
cd /Users/byte/projects/TS/BoolTox/packages/client
pnpm build  # 等待构建完成
```

**构建完成后启动**:
```bash
pnpm dev:client
```

---

## 🧪 测试 1: Python CLI 工具

### 步骤

1. 在 BoolTox 中找到 **"任务管理器（CLI）"**
2. 点击"启动"按钮

### 预期行为

**如果首次运行**:
- ✅ 弹出依赖安装窗口（🐍 Python 依赖安装）
- ✅ 显示依赖: click>=8.1.0
- ✅ 点击"开始安装"
- ✅ 安装成功后窗口关闭

**启动工具**:
- ✅ Terminal.app 窗口打开
- ✅ 窗口标题："BoolTox 任务管理器"
- ✅ 显示工具帮助信息或提示

### 查看日志

**如果终端未打开，查看日志**:
```
[TerminalLauncher] macOS AppleScript: ...
[TerminalLauncher] osascript stderr: ...（错误信息）
[TerminalLauncher] osascript 退出失败，code: 1
```

**如果看到错误，请复制完整日志**

### 在终端中测试功能

```bash
# 查看帮助
python cli.py --help

# 添加任务
python cli.py add "测试 CLI 模式" --priority high
python cli.py add "验证功能" --priority medium

# 列出任务
python cli.py list

# 标记完成
python cli.py done 1

# 查看统计
python cli.py stats

# 清除已完成任务
python cli.py clear
```

---

## 🧪 测试 2: Node.js CLI 工具

### 步骤

1. 在 BoolTox 中找到 **"文件管理器（CLI）"**
2. 点击"启动"按钮

### 预期行为

**如果首次运行**:
- ✅ 弹出依赖安装窗口（📦 Node.js 依赖安装）
- ✅ 显示依赖: commander、chalk
- ✅ 点击"开始安装"
- ✅ 安装成功后窗口关闭

**启动工具**:
- ✅ Terminal.app 窗口打开
- ✅ 窗口标题："BoolTox 文件管理器"
- ✅ 显示工具帮助信息或提示

### 在终端中测试功能

```bash
# 查看帮助
node cli.js --help

# 列出当前目录
node cli.js list

# 详细模式
node cli.js list --long --all

# 搜索文件
node cli.js find "*.json"
node cli.js find "*.js"

# 查看文件信息
node cli.js info manifest.json

# 创建目录
node cli.js mkdir test-dir
```

---

## 🧪 测试 3: Binary 工具（fd）

### 步骤

1. 在 BoolTox 中找到 **"fd 文件查找"**
2. 点击"启动"按钮

### 预期行为

**无依赖安装**（二进制工具零依赖）:
- ✅ 直接打开 Terminal.app
- ✅ 窗口标题："fd 文件查找"
- ✅ 自动选择当前平台的二进制

### 查看日志（验证平台检测）

```
[PlatformUtils] 平台检测: darwin-arm64，使用: bin/fd-macos-arm64
[ToolRunner] CLI 工具使用自定义命令: /path/to/bin/fd-macos-arm64
[TerminalLauncher] 启动终端命令: /path/to/bin/fd-macos-arm64
```

### 在终端中测试功能

```bash
# 查看帮助
fd --help

# 查找所有 .json 文件
fd "\.json$"

# 查找所有 TypeScript 文件
fd -e ts

# 忽略 node_modules
fd -e ts -E node_modules

# 查找最近修改的文件
fd -t f --changed-within 1d
```

---

## 🐛 故障排查

### 问题 1: 终端未打开

**检查日志**:
```bash
# 查看 BoolTox 客户端终端输出
# 搜索关键词: "osascript stderr" 或 "osascript 退出失败"
```

**可能原因**:
1. **AppleScript 语法错误** - 查看日志中的完整 AppleScript
2. **Terminal.app 权限** - macOS 安全设置阻止
3. **路径中有特殊字符** - 检查路径是否包含单引号或其他特殊字符

**手动测试 AppleScript**:
```bash
# 复制日志中的完整 AppleScript
osascript -e 'tell application "Terminal"
  activate
  do script "cd \"/Users/byte/...\" && python cli.py"
end tell'

# 如果报错，错误信息会直接显示
```

---

### 问题 2: 依赖安装失败

**Python 工具**:
```bash
# 手动安装依赖
cd packages/client/examples/cli-python-demo
pip install -r requirements.txt

# 手动运行
python cli.py --help
```

**Node.js 工具**:
```bash
# 手动安装依赖
cd packages/client/examples/cli-node-demo
npm install

# 手动运行
node cli.js --help
```

---

### 问题 3: 工具运行报错

**查看工具自身的错误**:
```bash
# 直接在终端运行，查看错误
cd packages/client/examples/cli-python-demo
python cli.py --help

# 或
cd packages/client/examples/cli-node-demo
node cli.js --help
```

---

## 📝 错误日志示例

### 正常启动（成功）

```
[ToolRunner] CLI 工具使用 Python: /path/to/python
[ToolRunner] 启动 CLI 工具 com.booltox.cli-python-demo 在终端中
[ToolRunner] 命令: /path/to/python /path/to/cli.py
[TerminalLauncher] 平台: darwin
[TerminalLauncher] macOS AppleScript: ...
[ToolRunner] CLI 工具已在终端启动 (PID: 12345)
```

### AppleScript 失败（当前问题）

```
[TerminalLauncher] macOS AppleScript: ...
[TerminalLauncher] osascript stderr: execution error: ... (-错误码)
[TerminalLauncher] osascript 退出失败，code: 1
[ToolRunner] CLI 工具 com.booltox.cli-python-demo 退出 (code: 1)
```

**请检查 stderr 输出内容**，找到具体错误原因。

---

## 🔍 调试模式

### 启用详细日志

**修改**: `terminal-launcher.ts:85`

```typescript
// 临时改为 'inherit' 查看详细输出
const process = spawn('osascript', ['-e', script], {
  stdio: 'inherit',  // 改为 inherit
});
```

**重新构建并运行**:
```bash
pnpm build
pnpm dev:client
```

**现在所有 osascript 的输出都会显示在终端中**。

---

## ✅ 验证清单

### 基础功能
- [ ] BoolTox 加载 7 个示例工具
- [ ] CLI 工具显示正确（标记为 CLI 或有特殊图标）

### Python CLI
- [ ] 依赖安装窗口显示
- [ ] 依赖安装成功
- [ ] Terminal 窗口打开
- [ ] 工具在终端中运行
- [ ] 可以输入命令

### Node.js CLI
- [ ] 依赖安装窗口显示
- [ ] 依赖安装成功
- [ ] Terminal 窗口打开
- [ ] 工具在终端中运行
- [ ] 可以输入命令

### Binary 工具
- [ ] 无依赖安装（直接启动）
- [ ] 平台检测正确
- [ ] Terminal 窗口打开
- [ ] fd 命令可用

---

**请重新测试 CLI 工具，并提供完整的错误日志（包括 osascript stderr）！** 🔍
