# 测试通用依赖安装器

## 🎯 测试目标

验证 Node.js 和 Python 工具的依赖自动安装功能：
- ✅ 启动工具时自动检测并安装依赖
- ✅ 显示独立的依赖安装窗口（类似 Python）
- ✅ 支持镜像源选择（npm/PyPI）
- ✅ 实时显示安装日志
- ✅ 用户可取消安装

## 📋 测试步骤

### 准备工作

1. **确保客户端已构建**：
   ```bash
   cd packages/client
   pnpm build
   ```

2. **删除测试工具的依赖**（模拟首次安装）：
   ```bash
   cd examples/backend-node-demo
   rm -rf node_modules

   cd ../frontend-only-demo
   rm -rf node_modules
   ```

### 测试 1: Node.js 工具依赖安装（backend-node-demo）

#### 步骤

1. **启动 BoolTox 客户端**：
   ```bash
   pnpm dev:client
   ```

2. **在客户端中点击"正则表达式测试器"**

3. **预期行为**：

   ✅ **弹出依赖安装窗口**：
   ```
   ┌──────────────────────────────────────┐
   │  📦 正则表达式测试器                   │
   │     Node.js 依赖安装                  │
   ├──────────────────────────────────────┤
   │                                      │
   │  左侧面板：                            │
   │  ┌────────────────────┐              │
   │  │ 📦 依赖目录         │              │
   │  │ ⚠ 未创建            │              │
   │  │ /path/node_modules │              │
   │  ├────────────────────┤              │
   │  │ 🌐 镜像源           │              │
   │  │ [下拉选择框]        │              │
   │  │ - 默认 (npm 官方)   │              │
   │  │ - 淘宝镜像          │              │
   │  ├────────────────────┤              │
   │  │ 📋 依赖列表         │              │
   │  │ express@^4.21.2    │              │
   │  │ @types/express...  │              │
   │  └────────────────────┘              │
   │                                      │
   │  右侧面板：                            │
   │  ┌────────────────────┐              │
   │  │ 📝 安装日志         │              │
   │  │                    │              │
   │  │ 点击"开始安装"...   │              │
   │  └────────────────────┘              │
   │                                      │
   │  [取消]  [开始安装]                   │
   └──────────────────────────────────────┘
   ```

4. **点击"开始安装"按钮**

5. **预期日志输出**：
   ```
   🔧 开始安装 Node.js 依赖...
   📦 运行 npm install...
   npm install
   added 117 packages in 8s
   ✅ npm install 完成
   ✅ 依赖安装完成！
   🚀 即将启动工具...
   ```

6. **窗口自动关闭**，工具在浏览器中打开 ✅

#### 预期结果

- ✅ 依赖安装窗口正确显示
- ✅ 显示所有依赖包列表
- ✅ 实时显示 npm install 日志
- ✅ 安装成功后自动关闭窗口
- ✅ 工具在浏览器中正常运行（http://127.0.0.1:8002）

### 测试 2: 纯前端工具（frontend-only-demo）

#### 步骤

1. **在客户端中点击"密码生成器"**

2. **预期行为**：
   - 弹出依赖安装窗口
   - 显示依赖：`express@^4.21.2`（唯一依赖）
   - 点击安装后快速完成（依赖少）
   - 工具在浏览器打开（http://127.0.0.1:8003）

### 测试 3: Python 工具（backend-demo）

#### 步骤

1. **删除 Python 虚拟环境**（如果已存在）：
   ```bash
   rm -rf ~/Library/Application\ Support/@booltox/client/plugin-envs/com.booltox.backend-demo
   ```

2. **在客户端中点击"系统信息监控"**

3. **预期行为**：
   - 弹出依赖安装窗口（Python 版本）
   - 显示依赖：`psutil`, `fastapi`, `uvicorn` 等
   - 可选择 PyPI 镜像源
   - 显示 Python 环境准备和依赖安装日志
   - 工具在浏览器打开（http://127.0.0.1:8001）

### 测试 4: 已有依赖时的行为

#### 步骤

1. **再次点击已安装依赖的工具**

2. **预期行为**：
   - ✅ **不弹出依赖安装窗口**
   - ✅ 直接启动工具
   - ✅ 工具在浏览器中打开

---

## 🔍 关键测试点

### UI 测试

- [ ] 窗口标题正确显示工具名称
- [ ] 左侧面板显示依赖信息
- [ ] 右侧日志面板实时滚动
- [ ] 安装中按钮禁用
- [ ] 进度正确显示
- [ ] 窗口可以最小化/最大化
- [ ] 窗口关闭时取消安装

### 功能测试

- [ ] 自动检测 `package.json` / `requirements.txt`
- [ ] 自动检测 `node_modules` / venv 是否存在
- [ ] npm/pip 进程正常启动
- [ ] 日志实时输出
- [ ] 安装成功后工具正常运行
- [ ] 安装失败显示错误信息
- [ ] 用户取消时清理资源

### 镜像源测试（Node.js）

- [ ] 默认使用 npm 官方源
- [ ] 选择淘宝镜像后生效
- [ ] 镜像源参数正确传递（通过环境变量或 .npmrc）

### 错误处理

- [ ] 网络错误时显示友好提示
- [ ] npm 不存在时给出安装指引
- [ ] 依赖冲突时显示详细错误
- [ ] 用户取消安装后工具不启动

---

## 📝 测试日志示例

### Node.js 工具（成功）

```
[ToolRunner] 工具 com.booltox.backend-node-demo 需要安装 Node.js 依赖，显示安装窗口
[deps-installer] 开始安装 Node.js 依赖: /path/to/tool
[deps-installer] [npm] npm install --legacy-peer-deps --no-audit --no-fund
[deps-installer] [npm] added 117 packages in 8s
[deps-installer] Node.js 依赖安装成功
[ToolRunner] 工具 com.booltox.backend-node-demo 依赖安装成功
[ToolRunner] 后端进程已启动 (PID: 12345)
[ToolRunner] HTTP 服务已就绪，打开浏览器: http://127.0.0.1:8002/
```

### Python 工具（成功）

```
[ToolRunner] 工具 com.booltox.backend-demo 需要安装 Python 依赖，显示安装窗口
[deps-installer] 开始准备 Python 环境...
[deps-installer] 🌐 使用镜像源: https://pypi.tuna.tsinghua.edu.cn/simple
[deps-installer] [download] Python 环境就绪
[deps-installer] 📦 开始安装依赖...
[deps-installer] [install] Installing dependencies...
[deps-installer] [install] Successfully installed psutil-6.1.1 fastapi-0.115.6 uvicorn-0.34.0
[deps-installer] Python 依赖安装成功
[ToolRunner] 工具 com.booltox.backend-demo 依赖安装成功
[ToolRunner] 后端进程已启动 (PID: 12346)
```

### 跳过安装（已有依赖）

```
[ToolRunner] 工具 com.booltox.backend-node-demo 已有 node_modules，跳过依赖安装
[ToolRunner] 后端进程已启动 (PID: 12347)
```

### 用户取消

```
[ToolRunner] 工具 com.booltox.backend-node-demo 需要安装 Node.js 依赖，显示安装窗口
[deps-installer] 用户取消了安装
[ToolRunner] 工具 com.booltox.backend-node-demo: 用户取消了依赖安装
[ToolRunner] 工具启动失败: 用户取消了依赖安装
```

---

## 🚀 快速测试命令

```bash
# 1. 删除所有工具的依赖（模拟首次安装）
cd packages/client/examples
rm -rf */node_modules

# 2. 启动客户端
cd ../..
pnpm dev:client

# 3. 在 BoolTox 中依次测试：
#    - 正则表达式测试器（Node.js）
#    - 密码生成器（Node.js 静态服务）
#    - 系统信息监控（Python）

# 4. 观察终端日志
```

---

## ✅ 成功标志

测试通过的标准：

1. **窗口显示正确**：
   - Node.js 工具显示"Node.js 依赖安装"
   - Python 工具显示"Python 依赖安装"
   - 依赖列表正确显示

2. **安装过程流畅**：
   - 日志实时输出
   - 无卡顿或假死
   - 进度提示清晰

3. **工具正常运行**：
   - 依赖安装完成
   - 后端进程启动
   - 浏览器自动打开
   - 工具功能正常

4. **错误处理完善**：
   - 用户取消时不报错
   - 网络错误有提示
   - 安装失败可重试

---

**现在可以开始测试了！** 🎉

删除 `backend-node-demo` 和 `frontend-only-demo` 的 `node_modules`，然后在 BoolTox 中启动它们，应该会看到新的依赖安装窗口。
