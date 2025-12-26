# 密码生成器工具

演示如何创建一个**完全独立**的纯前端工具，使用简单的 HTTP 服务器在浏览器中运行。

## 🎯 设计理念

**BoolTox = 进程管理器 + 工具市场**，不是工具运行容器。

- ✅ 工具完全独立，可以手动启动：`node server.js`
- ✅ 不依赖任何 BoolTox SDK
- ✅ 在系统默认浏览器中运行
- ✅ BoolTox 只负责：发现、安装、启动、停止工具

## 功能特性

### 🔐 密码生成
- **可配置长度**: 4-128 位可调
- **字符类型选择**: 大写字母、小写字母、数字、特殊符号
- **排除易混淆字符**: 自动排除 0/O, 1/l/I 等易混淆字符
- **自定义排除**: 支持自定义排除特定字符
- **密码短语**: 生成易记的多单词组合密码

### 📊 强度分析
- **实时评估**: 即时显示密码强度（极弱/弱/中等/强/极强）
- **熵值计算**: 显示密码的信息熵值
- **破解时间估算**: 估算暴力破解所需时间
- **可视化指示器**: 彩色进度条直观展示强度

### 📋 预设模板
- **PIN 码**: 4-6 位纯数字
- **简单密码**: 8 位字母数字
- **标准密码**: 12 位混合字符
- **强密码**: 16 位全字符
- **超强密码**: 24 位全字符

### 📜 历史记录
- **本地存储**: 最近 20 条生成记录
- **一键复制**: 快速复制历史密码
- **强度标记**: 显示每条记录的强度等级
- **时间戳**: 记录生成时间

## 📁 项目结构

```
frontend-only-demo/
├── booltox.json            # 声明 runtime.type = "http-service"
├── package.json            # Express 依赖
├── server.js               # 简单的静态文件服务器
├── src/
│   ├── main.ts             # 主应用逻辑
│   ├── style.css           # 样式文件
│   ├── generator.ts        # 密码生成核心
│   └── ...
├── dist/                   # 构建后的静态文件
└── README.md
```

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 构建前端

```bash
npm run build
```

### 3. 独立运行

```bash
node server.js
```

服务器将在 `http://127.0.0.1:8003` 启动，在浏览器中打开即可使用。

### 4. 在 BoolTox 中使用

BoolTox 会自动：
1. 检测并安装 Node.js 依赖（express）
2. 启动 HTTP 服务器
3. 在系统默认浏览器中打开工具
4. 管理进程生命周期（启动/停止）

## 技术栈

- **前端**: TypeScript + Vite + Web Crypto API
- **服务器**: Node.js + Express（静态文件服务）
- **存储**: LocalStorage（本地历史记录）

## 📝 从旧架构迁移

旧架构（webview）:
```json
{
  "runtime": {
    "ui": { "type": "webview", "entry": "dist/index.html" }
  }
}
```

新架构（http-service）:
```json
{
  "runtime": {
    "type": "http-service",
    "backend": {
      "type": "node",
      "entry": "server.js",
      "port": 8003
    }
  }
}
```

## 开发与调试

### 前端开发
```bash
npm run dev  # Vite 开发服务器
```

### 完整构建
```bash
npm run build  # 构建前端静态文件
```

### 本地测试
```bash
npm run serve  # 启动生产服务器
```

## ✨ 优势

1. **极简设计**: BoolTox 只是进程管理器，不处理渲染
2. **零兼容问题**: 所有工具运行在浏览器中，无 Electron 限制
3. **独立可测**: 每个工具都可以独立启动测试
4. **更好的用户体验**: 用户获得完整的浏览器功能
5. **易于维护**: 不再需要复杂的 IPC 通信逻辑

## 代码亮点

### 1. 安全的随机数生成

使用 Web Crypto API 生成密码学安全的随机数：

```typescript
const array = new Uint32Array(config.length);
crypto.getRandomValues(array);
```

### 2. 科学的强度评估

基于信息熵理论计算密码强度：

```typescript
const entropy = Math.log2(Math.pow(charsetSize, password.length));
```

### 3. 模块化架构

清晰的职责分离：
- `generator.ts`: 密码生成逻辑
- `strength.ts`: 强度分析算法
- `storage.ts`: 数据持久化
- `main.ts`: UI 交互控制

## 安全考虑

1. **密码学安全随机数**: 使用 `crypto.getRandomValues()` 而非 `Math.random()`
2. **不记录敏感信息**: 历史记录仅存储在本地，不上传服务器
3. **内存清理**: 密码字符串在使用后及时清理
4. **XSS 防护**: 使用 `textContent` 而非 `innerHTML` 防止注入

## 浏览器兼容性

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

---

该示例提供最小可行代码，便于第三方工具快速对齐新架构。
