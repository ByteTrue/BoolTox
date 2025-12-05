# 跨端工具平台产品系统说明

## 0. 架构决策

### 为什么放弃 Electron，选择 Web + Agent？

经过评估，决定**放弃 Electron 客户端架构，全力投入 Web + Node Agent 方案**。

| 对比维度 | Electron | Web + Agent | 结论 |
|---------|----------|-------------|------|
| 分发门槛 | 需签名、公证、安装包 | 脚本安装，浏览器访问 | ✅ Agent 胜 |
| 获客成本 | 用户需下载安装 | 分享链接即可使用 | ✅ Agent 胜 |
| IPC 性能 | 微秒级 | 毫秒级（localhost HTTP） | ⚠️ Electron 略优，但感知不明显 |
| 原生能力 | 托盘/快捷键/通知 | 通过独立后台进程实现 | 🟰 平手 |
| 代码维护 | 一套代码 | 一套代码 | 🟰 平手 |
| 后台任务 | 主进程运行 | 独立进程运行 | 🟰 平手 |

### 核心认知

> **工具箱的价值是管理和调度，不是自己干活。**

- Electron 的"原生能力"本质上是 Node/Python 进程的能力，不是 Electron 独有
- 剪贴板监控、系统通知、全局快捷键等功能，完全可以用独立后台进程实现
- Agent 定位为**进程调度器**，负责启动、停止、监控后台任务
- 真正干活的是**独立的 Python/Node 后台进程**

---

## 1. 产品目标

- **零安装门槛**：用户访问在线 Web 即可使用工具箱基础能力，检测到本地 Agent 后自动切换到本地连接，断网也能继续工作。
- **能力统一**：React + Vite 前端配合 Node Agent，兼顾 Shell/ADB/文件系统等本地权限，同时对接云端账号、插件市场与配置同步。
- **分发简单**：通过脚本/CLI 静默安装 Node 与 Agent，提供快捷方式或服务启动，避免复杂的签名/安装器依赖。

---

## 2. 场景模式

| 模式 | 特点 | 前端入口 | 能力 |
| --- | --- | --- | --- |
| 在线模式 | 浏览器连接云端，自动探测 Agent | `cloud.booltox` | 账号体系、插件市场、云配置；若本地 Agent 在线则透传其能力 |
| 离线模式 | 浏览器直连本地 Agent | `http://localhost:9527` | 已安装插件、Shell/ADB/Python、本地存储；网络恢复后可与云端同步 |

前端在加载时依次尝试：
1. 检测 `window.__BOOLTOX_AGENT__` 或短轮询 `localhost` 预设端口。
2. 若可达，立即把 SPA 的数据源切到本地 API（或直接 302 到 Agent 托管页面），同时保持与云端心跳以同步账号。
3. 若不可达，保留在线模式 UI，并在市场/设置内提示安装 Agent。

---

## 3. 总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web 前端 (React)                         │
│                      UI / 控制面板 / 状态展示                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / WebSocket
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       本地 Node Agent                            │
│                    「进程调度器 / API 网关」                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────────┐  │
│  │ 插件管理    │ 进程调度    │ 设备服务    │ 本地存储         │  │
│  │ (生命周期)  │ (启停/监控) │ (ADB/串口)  │ (SQLite)        │  │
│  └─────────────┴──────┬──────┴─────────────┴─────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┘
                        │ spawn / 管理
        ┌───────────────┼───────────────┬───────────────┐
        ▼               ▼               ▼               ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ 番茄钟   │   │ 剪贴板   │   │ 自动化   │   │ 其他插件 │
  │ (Python) │   │ (Python) │   │ (Python) │   │ 后台进程 │
  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
   系统通知      监听剪贴板      执行脚本       各自能力
   (plyer)      (pyperclip)    (pyautogui)
```

### 关键设计

- **Agent 只是调度器**：不直接执行业务逻辑，只负责启动、停止、监控后台进程
- **后台进程独立运行**：即使关闭浏览器，后台任务仍在运行
- **原生能力由后台进程实现**：
  - 系统通知 → Python `plyer` / Node `node-notifier`
  - 剪贴板监控 → Python `pyperclip` + 轮询
  - 全局快捷键 → Python `pynput` / `keyboard`
  - 定时任务 → Python `schedule` / `APScheduler`
  - UI 自动化 → Python `pyautogui` / `playwright`

---

## 4. Agent 模块

1. **Web 服务层**：统一 HTTP API（REST）与 WebSocket 通道，负责鉴权、速率限制、静态资源托管。

2. **插件管理**：
   - 扫描 `plugins/` 目录 + 开发挂载目录，解析 `manifest.json`
   - 维护运行时状态、权限、通道信息
   - 通过 WebSocket 将 stdout/stderr/log 流式推送到前端

3. **进程调度器**：
   - 启动/停止后台进程
   - 监控进程健康状态，异常重启
   - 管理进程间通信（JSON-RPC over stdio）
   - 支持进程分组、优先级、资源限制

4. **脚本执行器**：
   - Shell：`child_process.spawn`，支持超时、工作目录、环境变量覆写
   - Python：基于 uv 安装运行时/虚拟环境，按插件隔离依赖
   - TypeScript/Node：Node 进程 + SDK 注入

5. **设备服务**：封装 ADB、串口等访问，统一权限控制并可被插件调用。

6. **本地数据层**：SQLite 或等价 KV，存储插件配置、运行历史等；记录 `updated_at`、`synced_at`、`is_dirty` 以备增量同步。

---

## 5. 插件体系（与现有 BoolTox 插件兼容）

### 结构

```
plugin-name/
├─ manifest.json
├─ backend/          # 后台进程入口
│   ├─ main.py       # Python 插件
│   └─ main.ts       # TypeScript 插件
└─ web/              # 可选 UI 入口
    └─ index.html
```

现有插件仓库与 manifest 不需要修改，Agent 将直接复用插件包。

### Manifest 关键字段

```json
{
  "id": "com.booltox.example",
  "name": "示例插件",
  "version": "1.0.0",
  "runtime": "python",
  "permissions": ["shell", "clipboard", "notification"],
  "ui": "iframe",
  "background": true,
  "protocol": "1.0"
}
```

- `runtime`: `python | typescript | shell | standalone`
- `permissions`: `shell`, `clipboard`, `notification`, `device:adb`, `filesystem` 等
- `ui`: `iframe` / `standalone` 配置
- `background`: 是否作为后台进程长期运行
- `protocol`: 与 `@booltox/shared` 中的协议版本保持一致

### 生命周期

```
安装 → 依赖准备 → 启动 → 运行中 → 停止 → 清理
         │           │        │
         ▼           ▼        ▼
      uv sync    spawn    监控/重启
```

Electron 主进程中的 `plugin-manager`、`plugin-runner`、`python-manager` 等模块会被抽离到 Agent，实现迁移而非重写。

---

## 6. 后台进程能力映射

| 原 Electron 能力 | Web + Agent 实现方式 | 依赖库 |
|-----------------|---------------------|--------|
| 系统托盘 | Agent 作为系统服务运行 | - |
| 全局快捷键 | Python 后台进程监听 | `pynput`, `keyboard` |
| 系统通知 | Python/Node 后台进程调用 | `plyer`, `node-notifier` |
| 剪贴板监控 | Python 后台进程轮询 | `pyperclip`, `pyclip` |
| 文件系统监控 | Python 后台进程 | `watchdog` |
| 定时任务 | Python 后台进程 | `schedule`, `APScheduler` |
| UI 自动化 | Python 后台进程 | `pyautogui`, `playwright` |

---

## 7. 前端行为

1. **Agent SDK**：封装探测、连接、失败回退逻辑；提供 API 调用包装（先本地后云端）。

2. **自动重定向**：在线 Web 在检测到 Agent 时触发 `window.location.replace(localhost)` 或切换 API endpoint，确保断网时仍可继续使用当前界面。

3. **提示安装**：若未找到 Agent，在插件市场/设置页展示"一键安装脚本"（按平台生成命令）。

4. **后台进程状态**：展示所有后台进程的运行状态、资源占用、日志输出。

---

## 8. 云端能力（可选）

- 账号/团队、插件市场、配置与数据同步、插件分发统计。
- 与 Agent 通过安全通道同步脏数据，处理冲突策略（保留最后修改/手动合并）。

---

## 9. 分发与安装

### 安装脚本（推荐）

在线 Web 显示 `curl`/`powershell` 指令，脚本会：

1. 检测/安装 Node（可镜像官方 pkg/msi）
2. 下载 Agent 包（npm 私有源、本地 tarball 等）并全局安装
3. 运行 `booltox-agent setup`：下载 uv、初始化数据库、注册服务/快捷方式、打开浏览器

### 离线启动器

生成桌面快捷方式或 `launchd`/Windows 服务，方便一键进入 `localhost` 模式。

### 内部场景

支持从共享盘/Git 拉取 tarball 安装，或通过私有 registry 发布。

---

## 10. 路线图

### Phase 1：最小可行验证
- [ ] 抽离 Agent HTTP 骨架（Fastify/Express）
- [ ] 实现基础插件加载和进程调度
- [ ] 前端 SDK 探测逻辑
- [ ] 一个简单插件跑通全流程

### Phase 2：核心功能完善
- [ ] 完整的进程生命周期管理
- [ ] Python 环境管理（uv 集成）
- [ ] 插件权限系统
- [ ] 本地存储（SQLite）

### Phase 3：插件迁移
- [ ] 迁移现有 Electron 插件
- [ ] UI 插件 iframe 沙箱
- [ ] 后台插件进程管理
- [ ] 插件间通信

### Phase 4：用户体验
- [ ] 安装脚本（Windows/macOS/Linux）
- [ ] Agent 自动更新
- [ ] 离线模式优化
- [ ] 错误恢复和健康检查

### Phase 5：生态建设
- [ ] 插件市场
- [ ] 账号与团队协作
- [ ] 云端配置同步
- [ ] 插件开发者文档

---

## 11. 风险与注意事项

- macOS 未签名应用无法无感运行，需依赖脚本安装或后续申请证书
- 插件权限需要沙箱与提示，避免恶意脚本滥用设备
- Agent 与云端的冲突处理、身份认证需提前设计（token、双向校验）
- 需要监控 Agent 端口占用、进程崩溃与自动恢复机制
- 后台进程资源占用需要限制，避免影响系统性能

---

## 12. 从 Electron 迁移清单

### 可直接复用的模块

| Electron 模块 | 迁移到 Agent | 改动量 |
|--------------|-------------|--------|
| `plugin-manager.ts` | `agent/plugin-manager.ts` | 小（去除 Electron API） |
| `plugin-runner.ts` | `agent/process-scheduler.ts` | 小 |
| `python-manager.service.ts` | `agent/python-manager.ts` | 小 |
| `plugin-backend-runner.ts` | `agent/backend-runner.ts` | 小 |
| `extension-host.ts` | `agent/extension-host.ts` | 中（IPC → HTTP/WS） |

### 需要重写的模块

| 模块 | 原因 |
|-----|------|
| `preload.ts` | 不再需要，改用 HTTP API |
| `preload-plugin.ts` | 改用 iframe postMessage |
| 窗口管理相关 | 不再需要 |

### 前端改动

- `host-api.ts` → 改为 HTTP/WebSocket 调用
- BrowserView 插件容器 → iframe 容器
- 窗口控制按钮 → 移除或降级处理
