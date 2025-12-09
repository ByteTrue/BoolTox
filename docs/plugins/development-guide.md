# BoolTox 插件开发指南

> **最后更新**: 2025-12-06
> **适用版本**: v1.0.0+

---

## 📋 目录

- [快速开始](#快速开始)
- [插件类型](#插件类型)
- [插件结构](#插件结构)
- [开发流程](#开发流程)
- [API 参考](#api-参考)
- [发布插件](#发布插件)
- [最佳实践](#最佳实践)

---

## 🚀 快速开始

### 1. 克隆插件仓库

\`\`\`bash
git clone https://github.com/ByteTrue/booltox-plugins.git
cd booltox-plugins
pnpm install
\`\`\`

### 2. 创建新插件

\`\`\`bash
# 使用 CLI 创建（推荐）
pnpm create:plugin my-plugin

# 或手动创建
mkdir -p packages/official/my-plugin
\`\`\`

### 3. 开发插件

\`\`\`bash
cd packages/official/my-plugin
pnpm dev  # 启动热重载
\`\`\`

### 4. 测试插件

\`\`\`bash
# 在主仓库中配置环境变量
export BOOLTOX_DEV_PLUGINS_DIR="/path/to/booltox-plugins/packages"

# 启动 Agent
cd BoolTox
pnpm dev:agent
\`\`\`

---

## 🔌 插件类型

### 1. 纯 TypeScript 插件（纯前端）

**适用场景**: 不需要系统权限的工具（计算器、颜色选择器等）

**特点**:
- ✅ 最轻量，加载快
- ✅ 跨平台兼容
- ❌ 无法访问文件系统
- ❌ 无法执行系统命令

**示例**: 颜色选择器、JSON 格式化

### 2. 纯 Python 插件（独立应用）

**适用场景**: 命令行工具、脚本工具

**特点**:
- ✅ 强大的 Python 生态
- ✅ 适合数据处理
- ❌ 无 UI 界面

**示例**: 批量重命名、图片压缩

### 3. TS 前端 + TS 后端

**适用场景**: 需要后端逻辑但不依赖 Python

**特点**:
- ✅ 全栈 TypeScript
- ✅ 类型安全
- ✅ 轻量快速

**示例**: HTTP 客户端、API 测试工具

### 4. TS 前端 + Python 后端

**适用场景**: UI 工具 + Python 处理逻辑

**特点**:
- ✅ 最强大的组合
- ✅ React UI + Python 后端
- ✅ 适合复杂工具

**示例**: 番茄钟、屏幕录制、自动化脚本

---

## 📁 插件结构

### 基础结构（TS + Python 后端）

\`\`\`
my-plugin/
├── manifest.json          # 插件清单（必需）
├── package.json           # npm 配置
├── vite.config.ts         # Vite 构建配置
├── tsconfig.json          # TypeScript 配置
├── requirements.txt       # Python 依赖
│
├── src/                   # 前端源码
│   ├── App.tsx           # React 主组件
│   ├── main.tsx          # 入口文件
│   └── style.css         # 样式
│
├── backend/               # 后端源码（可选）
│   └── server.py         # Python 服务器
│
├── dist/                  # 构建产物（自动生成）
│   ├── index.html
│   └── assets/
│
├── icon.png               # 插件图标
└── README.md              # 插件说明
\`\`\`

### manifest.json 示例

\`\`\`json
{
  "id": "com.booltox.my-plugin",
  "version": "1.0.0",
  "name": "我的插件",
  "description": "插件描述",
  "protocol": "^2.0.0",

  "runtime": {
    "ui": {
      "type": "webview",
      "entry": "dist/index.html"
    },
    "backend": {
      "type": "python",
      "entry": "backend/server.py",
      "requirements": "requirements.txt"
    }
  },

  "permissions": [
    "backend.register",
    "backend.message",
    "python.run",
    "storage.get",
    "storage.set",
    "window.setTitle"
  ],

  "window": {
    "width": 800,
    "height": 600,
    "resizable": true
  },

  "author": "Your Name",
  "homepage": "https://github.com/...",
  "keywords": ["tag1", "tag2"],
  "category": "productivity",
  "icon": "icon.png"
}
\`\`\`

---

## 🔧 API 参考

### window.booltox API

插件前端可以通过全局 \`window.booltox\` API 与 Agent 通信。

#### 后端通信

\`\`\`typescript
// 注册后端
const { channelId } = await window.booltox.backend.register();

// 调用后端方法
const result = await window.booltox.backend.call(channelId, 'methodName', params);

// 发送通知（不等待响应）
await window.booltox.backend.notify(channelId, 'methodName', params);

// 监听后端事件
window.booltox.backend.on(channelId, '$event', (data) => {
  console.log('Backend event:', data);
});

// 等待后端就绪
await window.booltox.backend.waitForReady(channelId, 10000);
\`\`\`

#### 窗口管理

\`\`\`typescript
// 设置窗口标题
await window.booltox.window.setTitle('我的插件');
\`\`\`

#### 本地存储

\`\`\`typescript
// 读取存储
const value = await window.booltox.storage.get<string>('key');

// 写入存储
await window.booltox.storage.set('key', 'value');

// 删除存储
await window.booltox.storage.remove('key');
\`\`\`

### Python 后端 API

Python 后端使用 JSON-RPC 2.0 协议通过 stdin/stdout 通信。

\`\`\`python
import sys
import json

def send(method: str, params: dict = None):
    """发送 JSON-RPC 通知到前端"""
    message = {
        "jsonrpc": "2.0",
        "method": method,
        "params": params or {}
    }
    sys.stdout.write(json.dumps(message) + "\\n")
    sys.stdout.flush()

def send_response(request_id, result=None, error=None):
    """发送 JSON-RPC 响应"""
    response = {"jsonrpc": "2.0", "id": request_id}
    if error:
        response["error"] = error
    else:
        response["result"] = result
    sys.stdout.write(json.dumps(response) + "\\n")
    sys.stdout.flush()

# 发送就绪通知
send("$ready", {
    "version": "1.0.0",
    "methods": ["start", "stop", "getStatus"]
})

# 主循环：读取请求
while True:
    line = sys.stdin.readline()
    if not line:
        break

    request = json.loads(line)
    method = request.get("method")
    params = request.get("params", {})
    request_id = request.get("id")

    # 处理方法调用
    if method == "start":
        result = {"success": True}
        send_response(request_id, result=result)

    # 发送事件到前端
    send("$event", {"type": "progress", "value": 50})
\`\`\`

---

## 📤 发布插件

### 1. 构建插件

\`\`\`bash
pnpm build
\`\`\`

### 2. 打包插件

\`\`\`bash
# 创建 ZIP 包
cd dist
zip -r ../my-plugin-1.0.0.zip .
\`\`\`

### 3. 计算 SHA-256

\`\`\`bash
shasum -a 256 my-plugin-1.0.0.zip
\`\`\`

### 4. 创建 Pull Request

1. 上传 ZIP 到 \`plugins/official/my-plugin/releases/\`
2. 更新 \`plugins/official/my-plugin/metadata.json\`
3. 更新 \`plugins/index.json\`
4. 提交 PR 到 booltox-plugins 仓库

### 5. 审核和发布

官方插件需要审核：
- ✅ 代码质量检查
- ✅ 安全扫描
- ✅ 功能测试
- ✅ 文档完整性

通过后自动发布到插件市场 🎉

---

## 💡 最佳实践

### 代码规范

1. **TypeScript**: 使用严格模式，避免 \`any\` 类型
2. **Python**: 遵循 PEP 8，使用类型注解
3. **命名**: 使用语义化的变量和函数名
4. **注释**: 关键逻辑添加注释

### 性能优化

1. **懒加载**: 大型组件使用 React.lazy
2. **防抖节流**: 频繁操作使用 debounce/throttle
3. **虚拟化**: 长列表使用 react-window
4. **缓存**: 合理使用 localStorage 缓存

### 错误处理

1. **Try-Catch**: 所有 API 调用都应该有错误处理
2. **用户反馈**: 使用 Toast 通知而不是 console.log
3. **日志记录**: 关键错误记录到 stderr

### 安全

1. **输入验证**: 所有用户输入都应验证
2. **权限最小化**: 只请求必需的权限
3. **依赖安全**: 定期更新依赖，扫描漏洞

---

## 🐛 调试

### 前端调试

打开浏览器开发者工具（F12），查看：
- Console: 日志和错误
- Network: HTTP 请求
- Sources: 断点调试

### 后端调试

查看 Agent 日志：
\`\`\`bash
cd ~/.booltox/agent/packages/agent
pnpm dev  # 开发模式，显示详细日志
\`\`\`

### 常见问题

**Q: 插件无法启动？**
A: 检查 \`manifest.json\` 配置是否正确，Python 依赖是否安装

**Q: 后端调用失败？**
A: 检查 Python 脚本是否正确发送 JSON-RPC 响应

**Q: 事件未收到？**
A: 确保使用 \`send("$event", {...})\` 发送事件

---

## 📚 示例插件

查看官方示例：
- [番茄钟](../booltox-plugins/packages/official/pomodoro) - TS + Python
- [密码生成器](../booltox-plugins/packages/examples/password-generator) - 纯 TS
- [系统监控](../booltox-plugins/packages/examples/system-monitor) - 纯 Python

---

## 📞 获取帮助

- [FAQ](docs/FAQ.md)
- [Issues](https://github.com/ByteTrue/BoolTox/issues)
- [Discussions](https://github.com/ByteTrue/BoolTox/discussions)
- Email: dev@booltox.com

---

**祝开发愉快！🎉**
