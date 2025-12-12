# BoolTox 示例工具

本目录包含 4 个示例工具，展示不同的工具开发模式。

## 🎯 核心理念

**BoolTox = 进程管理器 + 工具市场**，不是工具运行容器。

所有工具都：
- ✅ **完全独立**：可以手动启动，不依赖 BoolTox
- ✅ **零 SDK 依赖**：不需要 `@booltox/tool-sdk`
- ✅ **标准技术栈**：使用标准的 Python/Node.js 技术

## 📦 示例工具列表

### 1. backend-demo (Python/FastAPI)
**系统信息监控** - 实时监控系统 CPU、内存、磁盘和进程信息

- **技术栈**: Python + FastAPI + React
- **端口**: 8001
- **类型**: http-service

### 2. backend-node-demo (Node.js/Express)
**正则表达式测试器** - 专业的正则调试器，支持实时验证、模板库、替换预览

- **技术栈**: Node.js + Express + TypeScript + React
- **端口**: 8002
- **类型**: http-service

### 3. frontend-only-demo (静态服务)
**密码生成器** - 支持自定义规则、实时强度分析、预设模板

- **技术栈**: Node.js + Express (静态文件服务) + TypeScript
- **端口**: 8003
- **类型**: http-service

### 4. python-standalone-demo (PySide6/Qt)
**番茄钟计时器** - 现代 Fluent Design UI 的番茄工作法计时器

- **技术栈**: Python + PySide6 + QFluentWidgets
- **类型**: standalone（原生 GUI）

---

## 🚀 快速开始

### ⚠️ 重要说明

**这些示例工具不参与 pnpm workspace**，必须在各自目录下独立安装依赖。

### 方式 1：批量设置（推荐）

```bash
# 在 examples 目录运行一键设置脚本
./setup-all.sh
```

这会自动：
- 清理所有 pnpm 软链接
- 使用 npm 独立安装依赖
- 构建所有工具

### 方式 2：手动设置单个工具

```bash
# ❌ 错误：在根目录运行 pnpm install（会创建软链接）
# ✅ 正确：在每个工具目录独立安装

cd examples/backend-node-demo
rm -rf node_modules package-lock.json  # 清理旧的
npm install --legacy-peer-deps          # 独立安装
npm run build                           # 构建
```

### 独立运行工具

#### backend-demo (Python)

```bash
cd backend-demo

# 安装 Python 依赖
pip install -r requirements.txt

# 构建前端
npm install
npm run build

# 运行服务器
python backend/http_server.py
# 访问 http://127.0.0.1:8001
```

#### backend-node-demo (Node.js)

```bash
cd backend-node-demo

# 安装依赖（使用 npm，不要用 pnpm）
npm install

# 构建
npm run build

# 运行服务器
node backend/dist/http_server.js
# 访问 http://127.0.0.1:8002
```

#### frontend-only-demo (静态服务)

```bash
cd frontend-only-demo

# 安装依赖
npm install

# 构建前端
npm run build

# 运行服务器
node server.js
# 访问 http://127.0.0.1:8003
```

#### python-standalone-demo (原生 GUI)

```bash
cd python-standalone-demo

# 安装依赖
pip install -r requirements.txt

# 运行（会启动原生 Qt 窗口）
python main.py
```

---

## 📁 目录结构

### HTTP Service 模式

```
tool-name/
├── manifest.json          # 工具配置
├── package.json           # Node.js 依赖
├── requirements.txt       # Python 依赖（如有）
├── backend/
│   ├── http_server.py     # Python HTTP 服务器
│   └── (或) dist/
│       └── http_server.js # Node.js HTTP 服务器
├── dist/                  # 构建后的前端
│   ├── index.html
│   └── assets/
└── README.md
```

### Standalone 模式

```
tool-name/
├── manifest.json          # 工具配置
├── requirements.txt       # Python 依赖
├── main.py                # 应用入口
└── README.md
```

---

## 🔧 manifest.json 配置示例

### HTTP Service 模式

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",  // 或 "node"
      "entry": "backend/http_server.py",
      "requirements": "requirements.txt",  // Python 依赖
      "port": 8004,
      "host": "127.0.0.1"
    }
  }
}
```

### Standalone 模式

```json
{
  "id": "com.example.my-tool",
  "name": "我的工具",
  "version": "1.0.0",
  "runtime": {
    "type": "standalone",
    "backend": {
      "type": "python",
      "entry": "main.py"
    }
  }
}
```

---

## ❓ 常见问题

### Q1: 为什么工具启动失败（找不到 express 模块）？

**A**: 工具目录的 `node_modules` 是 pnpm 创建的软链接。必须清理并独立安装：

```bash
cd examples/your-tool
rm -rf node_modules package-lock.json  # 清理 pnpm 软链接
npm install --legacy-peer-deps          # 使用 npm 独立安装
```

或者运行 `./setup-all.sh` 批量设置所有工具。

### Q2: "纯前端工具"为什么需要"后端"？

**A**: 这是新架构的核心设计：

#### 为什么需要 HTTP 服务器？

1. **浏览器安全限制**：
   - ❌ 不能直接用 `file://` 协议打开 HTML（有跨域限制）
   - ✅ 必须通过 `http://` 协议访问

2. **工具独立性**：
   - 工具可以独立运行（不依赖 BoolTox）
   - 用户可以手动 `node server.js` 启动

#### "后端"是什么？

| 工具 | "后端"的作用 |
|------|------------|
| **backend-demo** | FastAPI 提供实时 API（系统监控） |
| **backend-node-demo** | Express 提供 API（正则测试） |
| **frontend-only-demo** | Express **仅提供静态文件服务** ⭐ |

**frontend-only-demo 的 server.js**：

```javascript
// 这就是"后端"，但它只做一件事：提供静态文件
const app = express();
app.use(express.static('dist'));  // 静态文件服务
app.listen(8003);
```

它不是真正的后端 API，只是一个 HTTP 文件服务器（类似 `python -m http.server`）。

#### 命名解释

- **纯前端工具**：所有业务逻辑都在浏览器中运行（JS/TS）
- **后端进程**：提供 HTTP 服务的进程（即使只是静态文件服务）
- **http-service 模式**：工具通过 HTTP 在浏览器中运行
- **standalone 模式**：工具创建自己的原生窗口（如 Qt）

### Q3: 为什么不能用 pnpm？

**A**: pnpm workspace 会提升依赖到根目录，导致工具运行时找不到模块。示例工具需要完全独立的依赖。

### Q: 如何调试工具？

**A**: 直接在工具目录下独立运行，使用浏览器开发者工具：

```bash
# Python
python backend/http_server.py

# Node.js
node backend/dist/http_server.js

# 然后在浏览器中打开对应端口并使用 DevTools 调试
```

### Q: 端口冲突怎么办？

**A**: 在 `manifest.json` 中修改 `runtime.backend.port`：

```json
{
  "runtime": {
    "backend": {
      "port": 8100  // 改为其他端口
    }
  }
}
```

---

## 📚 参考文档

- [迁移指南](../../../docs/migration/webview-to-http-service.md) - 从旧架构迁移
- [根目录 CLAUDE.md](../../../CLAUDE.md) - 项目整体架构
- [客户端 CLAUDE.md](../../CLAUDE.md) - 客户端架构

---

**祝开发愉快！** 🎉
