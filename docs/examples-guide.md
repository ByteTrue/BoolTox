# 示例工具指南

BoolTox 提供了完整的示例工具集，展示四种运行时类型（`http-service`, `cli`, `standalone`, `binary`）的实际应用。所有示例均可独立运行，体现了「工具独立运行」的核心设计理念。

**示例位置**：`packages/client/examples/`

---

## 示例列表

### HTTP Service（Web 应用）

| 工具 | 技术栈 | 端口 | 说明 |
|------|--------|------|------|
| **backend-demo** | Python + FastAPI | 8001 | 完整的 RESTful API 示例 |
| **backend-node-demo** | Node.js + Express | 8002 | Node.js 后端服务 |
| **frontend-only-demo** | Node.js (Static Server) | 8003 | 纯前端应用（静态文件服务） |

### CLI（命令行工具）

| 工具 | 技术栈 | 说明 |
|------|--------|------|
| **cli-python-demo** | Python | 交互式 REPL 工具 |
| **cli-node-demo** | Node.js | 交互式菜单工具 |
| **binary-sysmon-demo** | Go (Binary) | 系统监控工具（跨平台二进制） |

### Standalone（独立 GUI）

| 工具 | 技术栈 | 说明 |
|------|--------|------|
| **python-standalone-demo** | Python + PySide6 (Qt) | Qt 桌面应用 |

### 配置示例

| 工具 | 说明 |
|------|------|
| **simplified-demo** | 演示简化配置（`start` + `port`） |

---

## 快速开始

### 批量安装依赖

在 `packages/client/examples/` 目录下运行：

```bash
./setup-all.sh
```

**功能**：
- 为所有 Python 工具安装依赖
- 为所有 Node.js 工具安装依赖并构建
- 跳过 Binary 工具（无需构建）

### 单独运行工具

每个工具都可以独立运行（不依赖 BoolTox）：

```bash
# Python 工具
cd backend-demo
pip install -r requirements.txt
python backend/http_server.py

# Node.js 工具
cd backend-node-demo
npm install --legacy-peer-deps
npm run build
node backend/dist/http_server.js
```

---

## HTTP Service 示例

### backend-demo（Python + FastAPI）

**技术栈**：
- 后端：FastAPI
- 端口：8001
- 依赖：`requirements.txt`

**目录结构**：
```
backend-demo/
├── booltox.json
├── requirements.txt
├── backend/
│   ├── http_server.py         # FastAPI 服务器
│   └── frontend/
│       ├── index.html
│       ├── style.css
│       └── script.js
```

**booltox.json**：
```json
{
  "name": "Python FastAPI 示例",
  "version": "1.0.0",
  "description": "演示 Python + FastAPI 后端服务",
  "icon": "🐍",
  "start": "python backend/http_server.py",
  "port": 8001
}
```

**功能演示**：
- RESTful API 端点（`/api/hello`）
- 静态文件服务（`/`）
- 跨域支持（CORS）
- JSON 响应

**本地运行**：
```bash
cd backend-demo
pip install -r requirements.txt
python backend/http_server.py
# 访问 http://127.0.0.1:8001
```

**API 端点**：
- `GET /api/hello`：返回欢迎消息
- `GET /api/time`：返回服务器时间
- `GET /`：静态页面

---

### backend-node-demo（Node.js + Express）

**技术栈**：
- 后端：Express
- 端口：8002
- 依赖：`package.json`

**目录结构**：
```
backend-node-demo/
├── booltox.json
├── package.json
├── tsconfig.json
├── backend/
│   ├── http_server.ts         # Express 服务器（TypeScript）
│   └── frontend/
│       ├── index.html
│       └── assets/
```

**booltox.json**：
```json
{
  "name": "Node.js Express 示例",
  "version": "1.0.0",
  "description": "演示 Node.js + Express 后端服务",
  "icon": "🟢",
  "start": "node backend/dist/http_server.js",
  "port": 8002
}
```

**功能演示**：
- TypeScript 编写的 Express 服务器
- 静态文件服务
- JSON API
- 环境变量配置

**本地运行**：
```bash
cd backend-node-demo
npm install --legacy-peer-deps
npm run build    # TypeScript 编译
npm start
# 访问 http://127.0.0.1:8002
```

---

### frontend-only-demo（静态文件服务）

**技术栈**：
- 后端：Node.js http-server
- 端口：8003
- 依赖：无（使用全局 `http-server`）

**目录结构**：
```
frontend-only-demo/
├── booltox.json
├── public/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
```

**booltox.json**：
```json
{
  "name": "纯前端示例",
  "version": "1.0.0",
  "description": "演示纯前端应用（无后端）",
  "icon": "🌐",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "process",
      "entry": "npx",
      "args": ["http-server", "public", "-p", "8003"],
      "port": 8003
    }
  }
}
```

**功能演示**：
- 纯静态页面
- CSS 动画
- Vanilla JavaScript

**本地运行**：
```bash
cd frontend-only-demo
npx http-server public -p 8003
# 访问 http://127.0.0.1:8003
```

---

## CLI 示例

### cli-python-demo（Python 交互式 REPL）

**技术栈**：
- Python 3.x
- 标准库

**目录结构**：
```
cli-python-demo/
├── booltox.json
├── requirements.txt
└── cli.py
```

**booltox.json**：
```json
{
  "name": "Python CLI 示例",
  "version": "1.0.0",
  "description": "演示 Python 命令行交互工具",
  "icon": "💻",
  "start": "python cli.py"
}
```

**功能演示**：
- 交互式 REPL
- 命令解析
- 彩色输出
- 用户输入处理

**本地运行**：
```bash
cd cli-python-demo
pip install -r requirements.txt
python cli.py
```

**交互示例**：
```
欢迎使用 Python CLI 工具
输入 'help' 查看帮助

> help
可用命令:
  hello   - 打印欢迎消息
  time    - 显示当前时间
  exit    - 退出程序

> hello
Hello from BoolTox CLI!
```

---

### cli-node-demo（Node.js 交互式菜单）

**技术栈**：
- Node.js
- inquirer（交互式命令行库）

**目录结构**：
```
cli-node-demo/
├── booltox.json
├── package.json
└── index.js
```

**booltox.json**：
```json
{
  "name": "Node.js CLI 示例",
  "version": "1.0.0",
  "description": "演示 Node.js 交互式菜单",
  "icon": "📟",
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "node",
      "entry": "index.js"
    }
  }
}
```

**功能演示**：
- 交互式菜单
- 彩色输出（chalk）
- 用户选择（inquirer）

**本地运行**：
```bash
cd cli-node-demo
npm install
node index.js
```

---

### binary-sysmon-demo（Go 系统监控工具）

**技术栈**：
- Go（预编译二进制）
- 跨平台（macOS/Windows/Linux）

**目录结构**：
```
binary-sysmon-demo/
├── booltox.json
├── bin/
│   ├── sysmon-darwin-arm64   # macOS Apple Silicon
│   ├── sysmon-darwin-x64     # macOS Intel
│   ├── sysmon-windows.exe    # Windows
│   └── sysmon-linux          # Linux
```

**booltox.json**（跨平台配置）：
```json
{
  "name": "系统监控工具",
  "version": "1.0.0",
  "description": "演示跨平台二进制工具",
  "icon": "📊",
  "runtime": {
    "type": "binary",
    "command": {
      "darwin-arm64": "bin/sysmon-darwin-arm64",
      "darwin-x64": "bin/sysmon-darwin-x64",
      "win32-x64": "bin/sysmon-windows.exe",
      "linux-x64": "bin/sysmon-linux"
    }
  }
}
```

**功能演示**：
- 实时系统资源监控
- CPU / 内存使用率
- 跨平台二进制分发

**本地运行**：
```bash
cd binary-sysmon-demo
./bin/sysmon-darwin-arm64  # macOS Apple Silicon
./bin/sysmon-linux          # Linux
```

---

## Standalone 示例

### python-standalone-demo（PySide6 GUI）

**技术栈**：
- Python + PySide6 (Qt)
- Qt Designer

**目录结构**：
```
python-standalone-demo/
├── booltox.json
├── requirements.txt
└── gui.py
```

**booltox.json**：
```json
{
  "name": "Python Qt GUI 示例",
  "version": "1.0.0",
  "description": "演示 Python 独立 GUI 应用",
  "icon": "🖥️",
  "runtime": {
    "type": "standalone",
    "entry": "gui.py",
    "requirements": "requirements.txt"
  }
}
```

**功能演示**：
- Qt 窗口应用
- 按钮交互
- 文本输入/输出
- 样式定制

**本地运行**：
```bash
cd python-standalone-demo
pip install -r requirements.txt
python gui.py
```

---

## 配置示例

### simplified-demo（简化配置）

**目的**：演示简化配置的自动推断。

**booltox.json**：
```json
{
  "name": "简化配置示例",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8888
}
```

**自动推断为**：
```json
{
  "id": "simplified-demo",
  "name": "简化配置示例",
  "version": "1.0.0",
  "protocol": "^2.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8888
    }
  }
}
```

**推断逻辑**：
- 存在 `port` → `http-service`
- `start: "python main.py"` → `backend.type: "python"`, `entry: "main.py"`

---

## 开发模式加载

在 BoolTox 开发模式下，示例工具会自动加载：

**扫描路径**：
1. `packages/client/examples/`（默认）
2. 环境变量 `BOOLTOX_DEV_TOOLS_DIR` 指定的目录

**标记为开发工具**：
- `isDev: true`
- 不可卸载
- 不会出现在「已安装」列表
- 关闭 BoolTox 后自动消失

**启动开发模式**：
```bash
cd packages/client
pnpm dev:client
```

---

## 创建自定义示例

### 步骤

1. **创建工具目录**：
   ```bash
   cd packages/client/examples
   mkdir my-tool
   cd my-tool
   ```

2. **编写 booltox.json**：
   ```json
   {
     "name": "我的工具",
     "version": "1.0.0",
     "start": "python app.py",
     "port": 9000
   }
   ```

3. **编写代码**：
   ```python
   # app.py
   from flask import Flask
   app = Flask(__name__)

   @app.route('/')
   def index():
       return 'Hello from My Tool!'

   if __name__ == '__main__':
       app.run(host='127.0.0.1', port=9000)
   ```

4. **添加依赖**（可选）：
   ```bash
   echo "flask" > requirements.txt
   pip install -r requirements.txt
   ```

5. **测试独立运行**：
   ```bash
   python app.py
   ```

6. **在 BoolTox 中加载**：
   启动 BoolTox 开发模式，工具会自动出现在工具列表中。

---

## 最佳实践

### 1. 工具必须独立运行

✅ 正确：
```bash
# 不依赖 BoolTox，可独立运行
cd my-tool
python main.py
```

❌ 错误：
```bash
# 依赖 BoolTox 环境变量或 API
import booltox_api  # ❌ 不要这样做
```

### 2. 固定依赖版本

✅ 推荐：
```text
flask==2.3.0
requests==2.28.2
```

❌ 不推荐：
```text
flask
requests
```

### 3. 使用相对路径

✅ 正确（booltox.json）：
```json
{
  "start": "python backend/main.py"
}
```

❌ 错误：
```json
{
  "start": "python /Users/me/projects/tool/backend/main.py"
}
```

### 4. 提供清晰的图标和描述

✅ 推荐：
```json
{
  "name": "API 调试工具",
  "description": "快速测试 RESTful API，支持 GET/POST/PUT/DELETE",
  "icon": "🔧",
  "keywords": ["api", "http", "debug", "rest"]
}
```

### 5. 端口不冲突

建议端口范围：
- 示例工具：`8001 - 8010`
- 用户工具：`8011+`

---

## 故障排查

### 工具无法启动

**问题**：点击启动后工具无响应

**排查步骤**：
1. 检查日志（设置 → 开发者 → 查看日志）
2. 确认依赖已安装（`requirements.txt` / `package.json`）
3. 检查端口是否被占用（`netstat -an | grep <port>`）
4. 测试独立运行（`python main.py`）

### 依赖安装失败

**问题**：Python 依赖安装报错

**解决方案**：
```bash
# 使用国内镜像源
pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
```

### Node.js 工具构建失败

**问题**：TypeScript 编译失败

**解决方案**：
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

---

## 参考资料

- **工具协议规范**：[docs/api/tool-protocol.md](api/tool-protocol.md)
- **工具开发指南**：[docs/plugins/development-guide.md](plugins/development-guide.md)
- **架构概览**：[docs/architecture-overview.md](architecture-overview.md)

---

## 下一步

- 🛠️ **创建自己的工具**：参考示例，开发自定义工具
- 📦 **发布到工具源**：将工具推送到 GitHub，分享给团队
- 🎨 **定制界面**：修改 HTML/CSS，打造独特风格
