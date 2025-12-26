# 工具协议规范（booltox.json）

BoolTox 使用 `booltox.json` 文件定义工具的元数据和运行时配置。本文档详细说明了协议规范、配置推断和最佳实践。

---

## 协议版本

当前协议版本：**`2.0.0`**

```json
{
  "protocol": "^2.0.0"
}
```

版本兼容性：
- `^2.0.0`：兼容 2.x.x 所有版本（推荐）
- `~2.0.0`：仅兼容 2.0.x 版本
- `2.0.0`：严格等于 2.0.0

---

## 简化配置 vs 完整配置

BoolTox 支持两种配置模式：

### 简化配置（推荐）

最少配置，BoolTox 自动推断运行时类型：

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8001
}
```

**推断规则**：
- 存在 `port` → 推断为 `http-service`
- 存在 `start`，无 `port` → 推断为 `cli`
- 无 `start`，无 `runtime` → 错误

### 完整配置

显式指定运行时类型：

```json
{
  "name": "我的工具",
  "version": "1.0.0",
  "protocol": "^2.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8001
    }
  }
}
```

**适用场景**：
- 需要精细控制运行时参数
- 使用 `standalone` 或 `binary` 类型
- 需要跨平台入口文件

---

## 必需字段

### `name` (string)

工具显示名称，出现在工具列表和标签页标题。

```json
{
  "name": "我的工具"
}
```

### `version` (string)

语义化版本号（SemVer），用于更新检测。

```json
{
  "version": "1.2.3"
}
```

格式：`MAJOR.MINOR.PATCH`

---

## 可选字段

### `id` (string)

工具唯一标识符。如果未指定，BoolTox 会根据目录名或 `name` 自动生成。

```json
{
  "id": "my-tool"
}
```

**命名规范**：
- 小写字母、数字、连字符、点
- 正则：`^[a-z0-9.-]+$`
- 示例：`my-tool`, `web.dashboard`, `api-client-v2`

### `description` (string)

工具简介，出现在工具卡片和详情页。

```json
{
  "description": "一个快速的 HTTP 调试工具"
}
```

### `protocol` (string)

协议版本约束，默认为当前协议版本。

```json
{
  "protocol": "^2.0.0"
}
```

### `icon` (string)

工具图标，支持三种格式：

```json
// 1. Emoji
{ "icon": "🔧" }

// 2. 相对路径（工具目录）
{ "icon": "assets/icon.png" }

// 3. HTTP URL
{ "icon": "https://example.com/icon.png" }
```

### `author` (string)

工具作者或组织名称。

```json
{
  "author": "ByteTrue"
}
```

### `category` (string)

工具分类，用于工具库筛选。

```json
{
  "category": "开发工具"
}
```

常见分类：`开发工具`, `效率工具`, `网络工具`, `数据分析`, `系统工具`

### `keywords` (string[])

关键词列表，用于搜索。

```json
{
  "keywords": ["http", "debug", "api", "rest"]
}
```

### `screenshots` (string[])

截图 URL 列表，用于工具详情页展示。

```json
{
  "screenshots": [
    "https://example.com/screenshot1.png",
    "https://example.com/screenshot2.png"
  ]
}
```

### `window` (object)

窗口配置（仅 `http-service` 生效）。

```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "minWidth": 800,
    "minHeight": 600,
    "resizable": true
  }
}
```

---

## 简化配置字段

### `start` (string)

启动命令，BoolTox 会根据命令自动推断后端类型。

```json
{
  "start": "python app.py"
}
```

**推断逻辑**：
- `python ...` → `backend.type = 'python'`
- `node ...` → `backend.type = 'node'`
- 其他 → `backend.type = 'process'`

### `port` (number)

HTTP 服务端口，存在则推断为 `http-service`。

```json
{
  "port": 8001
}
```

范围：`1024 - 65535`

---

## 运行时配置 (runtime)

### 1. HTTP Service（Web 应用）

启动本地 HTTP 服务器，在 BoolTox 内嵌浏览器中打开。

**完整配置**：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8001,
      "host": "127.0.0.1",
      "args": ["--debug"],
      "env": {
        "FLASK_ENV": "development"
      },
      "requirements": "requirements.txt"
    },
    "path": "/",
    "readyTimeout": 30000
  }
}
```

**字段说明**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `backend.type` | `'python'` \| `'node'` \| `'process'` | ✅ | 后端类型 |
| `backend.entry` | `string` | ✅ | 入口文件（相对于工具目录） |
| `backend.port` | `number` | ✅ | 服务端口 |
| `backend.host` | `string` | ❌ | 主机（默认 `127.0.0.1`） |
| `backend.args` | `string[]` | ❌ | 启动参数 |
| `backend.env` | `Record<string, string>` | ❌ | 环境变量 |
| `backend.requirements` | `string` | ❌ | Python 依赖文件路径 |
| `path` | `string` | ❌ | URL 路径（默认 `/`） |
| `readyTimeout` | `number` | ❌ | 健康检查超时（毫秒，默认 30000） |

**简化配置**：
```json
{
  "start": "python main.py",
  "port": 8001
}
```

**适用场景**：
- Flask / FastAPI / Django 应用
- Express / Koa Web 应用
- 任何提供 HTTP 接口的服务

---

### 2. CLI（命令行工具）

在系统终端中运行，不返回输出到 BoolTox。

**完整配置**：
```json
{
  "runtime": {
    "type": "cli",
    "backend": {
      "type": "python",
      "entry": "cli.py",
      "args": ["--interactive"],
      "env": {
        "PYTHONUNBUFFERED": "1"
      }
    },
    "cwd": ".",
    "title": "我的 CLI 工具",
    "keepOpen": true
  }
}
```

**字段说明**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `backend.type` | `'python'` \| `'node'` \| `'process'` | ✅ | 后端类型 |
| `backend.entry` | `string` | ✅ | 入口文件 |
| `backend.args` | `string[]` | ❌ | 启动参数 |
| `backend.env` | `Record<string, string>` | ❌ | 环境变量 |
| `cwd` | `string` | ❌ | 工作目录（相对于工具目录） |
| `title` | `string` | ❌ | 终端窗口标题 |
| `keepOpen` | `boolean` | ❌ | 退出后保持终端打开（默认 `true`） |

**简化配置**：
```json
{
  "start": "python cli.py"
}
```

**适用场景**：
- 交互式命令行脚本
- 批处理工具
- 数据处理管道

---

### 3. Standalone（独立 GUI）

启动独立窗口的 GUI 应用（如 Tkinter / PyQt）。

**完整配置**：
```json
{
  "runtime": {
    "type": "standalone",
    "entry": "gui.py",
    "args": ["--windowed"],
    "env": {
      "QT_AUTO_SCREEN_SCALE_FACTOR": "1"
    },
    "requirements": "requirements.txt"
  }
}
```

**字段说明**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `entry` | `string` | ✅ | Python 脚本路径 |
| `args` | `string[]` | ❌ | 启动参数 |
| `env` | `Record<string, string>` | ❌ | 环境变量 |
| `requirements` | `string` | ❌ | 依赖文件路径 |

**适用场景**：
- Tkinter / PyQt / wxPython 应用
- Electron 打包的独立应用

---

### 4. Binary（原生可执行文件）

运行原生编译的二进制文件（Go / Rust / C++）。

**完整配置**：
```json
{
  "runtime": {
    "type": "binary",
    "command": "bin/my-tool",
    "args": ["--config", "config.json"],
    "env": {
      "LOG_LEVEL": "info"
    },
    "cwd": "."
  }
}
```

**跨平台配置**：
```json
{
  "runtime": {
    "type": "binary",
    "command": {
      "darwin-arm64": "bin/my-tool-macos-arm64",
      "darwin-x64": "bin/my-tool-macos-x64",
      "win32-x64": "bin/my-tool-windows.exe",
      "linux-x64": "bin/my-tool-linux"
    }
  }
}
```

**字段说明**：

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `command` | `string` \| `PlatformSpecificEntry` | ✅ | 可执行文件路径 |
| `args` | `string[]` | ❌ | 启动参数 |
| `env` | `Record<string, string>` | ❌ | 环境变量 |
| `cwd` | `string` | ❌ | 工作目录 |
| `localExecutablePath` | `string` | ❌ | 本地原始路径（内部使用） |

**平台标识符**：
- `darwin-arm64`: macOS Apple Silicon
- `darwin-x64`: macOS Intel
- `win32-x64`: Windows x64
- `linux-x64`: Linux x64
- `linux-arm64`: Linux ARM64

**适用场景**：
- Go / Rust / C++ 编译的工具
- 跨平台分发的命令行工具

---

## 依赖管理

### Python 工具

在 `requirements.txt` 中声明依赖：

```text
flask==2.3.0
requests>=2.28.0
pandas
```

BoolTox 会：
1. 为每个工具创建独立 venv（`~/.booltox/tool-envs/{toolId}/`）
2. 使用 SHA256 哈希检测 `requirements.txt` 变化
3. 仅在依赖变化时重新安装（避免重复安装）

**指定依赖文件路径**：
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8001,
      "requirements": "backend/requirements.txt"
    }
  }
}
```

### Node.js 工具

在 `package.json` 中声明依赖：

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.4.0"
  }
}
```

BoolTox 会：
1. 在工具目录中运行 `npm install`（或 `pnpm install`）
2. 每次启动前检查 `node_modules` 是否存在

---

## 配置推断流程

BoolTox 的配置推断逻辑（`manifest-infer.service.ts`）：

```
1. 检查是否存在 runtime 字段
   ├─ 是：跳过推断，使用完整配置
   └─ 否：进入推断流程

2. 检查是否存在 start 字段
   ├─ 是：解析 start 命令
   │   ├─ 提取命令类型（python / node / 其他）
   │   ├─ 提取入口文件
   │   └─ 生成 backend 配置
   └─ 否：抛出错误（缺少 start 或 runtime）

3. 检查是否存在 port 字段
   ├─ 是：推断为 http-service
   │   └─ 生成 ToolHttpServiceRuntimeConfig
   └─ 否：推断为 cli
       └─ 生成 ToolCliRuntimeConfig

4. 返回推断后的完整配置
```

**示例推断**：

输入（简化配置）：
```json
{
  "name": "Flask Demo",
  "version": "1.0.0",
  "start": "python app.py --port 5000",
  "port": 5000
}
```

输出（推断后）：
```json
{
  "id": "flask-demo",
  "name": "Flask Demo",
  "version": "1.0.0",
  "protocol": "^2.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "app.py",
      "port": 5000,
      "args": ["--port", "5000"]
    }
  }
}
```

---

## 完整示例

### HTTP Service（Flask）

```json
{
  "name": "Flask Dashboard",
  "version": "1.0.0",
  "description": "数据可视化仪表板",
  "icon": "📊",
  "author": "ByteTrue",
  "category": "开发工具",
  "keywords": ["flask", "dashboard", "visualization"],
  "start": "python app.py",
  "port": 8080,
  "window": {
    "width": 1400,
    "height": 900,
    "minWidth": 1200,
    "minHeight": 700
  }
}
```

### CLI 工具（Python）

```json
{
  "name": "数据清洗工具",
  "version": "2.1.0",
  "description": "批量处理 CSV 数据",
  "icon": "🧹",
  "start": "python clean.py"
}
```

### Standalone GUI（Tkinter）

```json
{
  "name": "图片编辑器",
  "version": "1.0.0",
  "icon": "🎨",
  "runtime": {
    "type": "standalone",
    "entry": "main.py",
    "requirements": "requirements.txt"
  }
}
```

### Binary 工具（Go）

```json
{
  "name": "HTTP 压测工具",
  "version": "3.0.0",
  "description": "高性能 HTTP 负载测试",
  "icon": "⚡",
  "runtime": {
    "type": "binary",
    "command": {
      "darwin-arm64": "bin/loadtest-macos-arm64",
      "darwin-x64": "bin/loadtest-macos-x64",
      "win32-x64": "bin/loadtest-windows.exe",
      "linux-x64": "bin/loadtest-linux"
    },
    "args": ["--threads", "4"]
  }
}
```

---

## 最佳实践

### 1. 优先使用简化配置

❌ 不推荐（过度配置）：
```json
{
  "name": "工具",
  "version": "1.0.0",
  "protocol": "^2.0.0",
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "python",
      "entry": "main.py",
      "port": 8000
    }
  }
}
```

✅ 推荐（简化配置）：
```json
{
  "name": "工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8000
}
```

### 2. 使用语义化版本号

✅ 正确：
```json
{ "version": "1.2.3" }
{ "version": "0.1.0-beta" }
```

❌ 错误：
```json
{ "version": "v1.0" }
{ "version": "latest" }
```

### 3. 提供清晰的描述和图标

✅ 推荐：
```json
{
  "name": "HTTP 调试工具",
  "description": "快速测试 RESTful API，支持 GET/POST/PUT/DELETE 请求",
  "icon": "🔧",
  "keywords": ["http", "api", "rest", "debug"]
}
```

### 4. 固定依赖版本（生产工具）

✅ 推荐（精确版本）：
```text
flask==2.3.0
requests==2.28.2
```

⚠️ 谨慎使用（范围版本）：
```text
flask>=2.3.0
requests~=2.28.0
```

❌ 不推荐（无版本）：
```text
flask
requests
```

### 5. 跨平台二进制分发

```json
{
  "runtime": {
    "type": "binary",
    "command": {
      "darwin-arm64": "bin/tool-macos-arm64",
      "win32-x64": "bin/tool-win.exe",
      "linux-x64": "bin/tool-linux"
    }
  }
}
```

### 6. 窗口尺寸建议

```json
{
  "window": {
    "width": 1200,
    "height": 800,
    "minWidth": 800,    // 防止界面变形
    "minHeight": 600,
    "resizable": true
  }
}
```

---

## 验证工具

BoolTox 提供内置验证工具：

```bash
# 验证 booltox.json
booltox validate booltox.json

# 验证整个工具目录
booltox validate .
```

验证规则：
- 必需字段存在且类型正确
- 版本号符合 SemVer 格式
- ID 符合命名规范
- 端口在有效范围内（1024-65535）
- 文件路径存在（entry, requirements）

---

## JSON Schema

完整的 JSON Schema 定义位于：

```
packages/shared/src/schemas/manifest.schema.ts
```

可用于 IDE 自动补全和验证：

```json
{
  "$schema": "https://booltox.dev/schemas/manifest.schema.json",
  "name": "工具名称",
  "version": "1.0.0"
}
```

---

## 协议演进

### 协议版本历史

- **`2.0.0`** (当前)：统一简化配置，支持四种运行时
- **`1.x.x`** (已废弃)：旧版协议，不兼容

### 向后兼容性

BoolTox 2.x 会尝试自动迁移 1.x 配置：

```json
// 1.x 配置（已废弃）
{
  "name": "工具",
  "command": "python main.py",
  "type": "http"
}
```

自动迁移为：
```json
// 2.x 配置
{
  "name": "工具",
  "version": "1.0.0",
  "start": "python main.py",
  "port": 8000
}
```

---

## 参考资料

- **配置推断逻辑**：`packages/client/electron/services/tool/manifest-infer.service.ts`
- **运行时类型定义**：`packages/shared/src/types/protocol.ts`
- **Schema 验证**：`packages/shared/src/schemas/manifest.schema.ts`
- **示例工具**：`examples/` 目录
