# 插件开发文档模板

[根目录](../../../../CLAUDE.md) > [packages](../../../) > [client](../../) > [plugins](../) > **[插件名称]**

---

## 变更日志 (Changelog)

### [版本号] - [日期]
- 初始版本发布

---

## 插件信息

**插件 ID**: `com.booltox.example`
**版本**: 1.0.0
**作者**: BoolTox Team
**类型**: [Python 后端 | Node.js 后端 | 纯前端 | 独立运行]

**功能描述**:
[简短描述插件的核心功能]

---

## 功能特性

- ✅ [功能1]
- ✅ [功能2]
- ✅ [功能3]

---

## 技术架构

### 技术栈
**前端**: [React | Vue | 原生 HTML/JS]
**后端**: [Python + FastAPI | Node.js + Express | 无后端]
**依赖**: [列出主要依赖库]

### 目录结构
```
com.booltox.example/
├── manifest.json          # 插件清单
├── dist/                  # 编译后的前端代码
├── backend/               # 后端代码（可选）
│   └── server.py
├── src/                   # 前端源码
│   ├── index.html
│   └── main.ts
├── requirements.txt       # Python 依赖（可选）
├── package.json           # 前端依赖
└── README.md
```

---

## 安装和使用

### 前置要求
- BoolTox 主应用 >= 0.0.1
- [Python >= 3.12] (如果有后端)
- [其他系统依赖]

### 安装方式
1. **从市场安装**（推荐）:
   - 打开 BoolTox → 模块中心
   - 搜索"[插件名称]"
   - 点击"安装"

2. **手动安装**:
   ```bash
   # 下载插件包
   wget https://example.com/plugin.zip

   # 解压到插件目录
   unzip plugin.zip -d ~/.booltox/plugins/
   ```

### 使用步骤
1. 在模块中心找到插件
2. 点击"启动"
3. [具体操作步骤]

---

## 开发指南

### 环境搭建
```bash
# 克隆仓库
git clone https://github.com/example/plugin.git
cd plugin

# 安装依赖
pnpm install

# 启动开发服务器
booltox dev
```

### 核心代码解析

#### 1. Manifest 配置
```json
{
  "id": "com.booltox.example",
  "version": "1.0.0",
  "runtime": {
    "ui": {
      "type": "webview",
      "entry": "dist/index.html"
    },
    "backend": {
      "type": "python",
      "entry": "backend/server.py"
    }
  },
  "permissions": ["backend.register", "backend.message"]
}
```

#### 2. 前端入口 (src/main.ts)
```typescript
// 初始化插件 API
const { sendBackendMessage, onBackendMessage } = window.plugin;

// 发送消息到后端
async function fetchData() {
  const response = await sendBackendMessage({
    method: 'getData',
    params: { id: 123 }
  });
  console.log(response);
}

// 监听后端消息
onBackendMessage((data) => {
  console.log('收到后端消息:', data);
});
```

#### 3. 后端入口 (backend/server.py)
```python
from booltox_sdk import PluginBackend

backend = PluginBackend()

@backend.on_message
async def handle_message(data):
    method = data.get('method')
    if method == 'getData':
        return {'status': 'ok', 'data': [1, 2, 3]}

backend.run()
```

---

## API 参考

### 前端 API

#### `window.plugin.sendBackendMessage(data: any): Promise<any>`
发送消息到后端，返回 Promise。

**示例**:
```typescript
const result = await window.plugin.sendBackendMessage({
  method: 'calculate',
  params: { a: 1, b: 2 }
});
```

#### `window.plugin.onBackendMessage(callback: (data: any) => void): void`
监听后端主动推送的消息。

**示例**:
```typescript
window.plugin.onBackendMessage((msg) => {
  if (msg.type === 'progress') {
    updateProgressBar(msg.value);
  }
});
```

### 后端 API

#### `backend.send_message(data: dict) -> None`
主动向前端推送消息。

**示例**:
```python
backend.send_message({
    'type': 'progress',
    'value': 50
})
```

---

## 配置和权限

### 权限列表
| 权限名称 | 说明 | 风险等级 |
|---------|------|---------|
| `backend.register` | 注册后端服务 | 低 |
| `backend.message` | 前后端通信 | 低 |
| `window.show` | 控制窗口显示 | 中 |
| `system.read` | 读取系统信息 | 中 |
| `file.read` | 读取文件 | 高 |

### 配置文件
插件可以使用 `electron-store` 存储配置：
```typescript
import Store from 'electron-store';
const config = new Store({ name: 'com.booltox.example' });

config.set('apiKey', 'xxx');
const apiKey = config.get('apiKey');
```

---

## 测试

### 单元测试
```bash
pnpm test
```

### 集成测试
1. 在开发模式下启动插件
2. 测试前后端通信是否正常
3. 验证 UI 交互功能

---

## 常见问题

**Q: 插件无法启动？**
A: 检查 manifest.json 是否有效，查看主应用日志。

**Q: 后端脚本报错？**
A: 确认 Python 版本和依赖是否正确安装。

**Q: 如何调试插件？**
A: 使用 Chrome DevTools 调试前端，使用 `print()` 或 `logger` 调试后端。

---

## 更新日志

### 1.0.0 (2025-12-05)
- 初始版本发布
- 实现核心功能

---

**维护者**: [你的名字]
**仓库**: [GitHub 链接]
**反馈**: [Issue 链接或邮箱]
