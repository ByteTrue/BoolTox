# BoolTox Server

BoolTox 后台 API 服务

## 技术栈

- **运行时**: Node.js 20+
- **框架**: Fastify 4.x
- **数据库**: PostgreSQL 15+ with Prisma ORM
- **验证**: Zod
- **日志**: Pino
- **语言**: TypeScript

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

**重要**: 在生产环境中，请务必修改所有安全令牌！

生成安全令牌：
```bash
# Linux/Mac
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 3. 数据库设置

确保 PostgreSQL 已运行，然后：

```bash
# 生成 Prisma Client
pnpm db:generate

# 推送 schema 到数据库（开发环境）
pnpm db:push

# 或运行迁移（生产环境）
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动

## 可用脚本

### 开发

- `pnpm dev` - 启动开发服务器（热重载）
- `pnpm type-check` - 运行 TypeScript 类型检查

### 构建

- `pnpm build` - 构建生产版本
- `pnpm start` - 运行构建后的代码
- `pnpm clean` - 清理构建输出

### 测试

- `pnpm test` - 运行所有测试
- `pnpm test:watch` - 监视模式运行测试
- `pnpm test:ui` - 使用 UI 界面运行测试
- `pnpm test:coverage` - 运行测试并生成覆盖率报告

### 数据库

- `pnpm db:generate` - 生成 Prisma Client
- `pnpm db:push` - 推送 schema 到数据库（开发）
- `pnpm db:migrate` - 运行数据库迁移（生产）
- `pnpm db:studio` - 打开 Prisma Studio（数据库 GUI）

## API 端点

### 健康检查

```
GET /health
```

返回服务器和数据库状态。

### 根路径

```
GET /
```

返回 API 信息。

### 发布版本管理

**公共端点**:
- `GET /api/public/releases/check-update` - 检查更新

**管理端点**:
- `GET /api/admin/releases` - 获取版本列表
- `POST /api/admin/releases` - 创建版本
- `GET /api/admin/releases/:id` - 获取版本详情
- `PATCH /api/admin/releases/:id` - 更新版本
- `DELETE /api/admin/releases/:id` - 删除版本

### 模块市场

**公共端点**:
- `GET /api/modules` - 获取模块列表（支持分页、搜索、过滤、排序）
- `GET /api/modules/search` - 搜索模块
- `GET /api/modules/:id` - 获取模块详情
- `GET /api/modules/:id/versions` - 获取模块所有版本
- `GET /api/modules/:id/stats` - 获取模块统计信息
- `POST /api/modules/:id/download` - 获取下载链接并增加下载计数

**管理端点**:
- `POST /api/modules` - 创建模块
- `PATCH /api/modules/:id` - 更新模块
- `DELETE /api/modules/:id` - 删除模块
- `POST /api/modules/:id/versions` - 创建模块版本

### 公告管理

**公共端点**:
- `GET /api/announcements/active` - 获取活跃公告

**管理端点**:
- `GET /api/announcements` - 获取公告列表（支持分页、过滤）
- `GET /api/announcements/:id` - 获取公告详情
- `POST /api/announcements` - 创建公告
- `PATCH /api/announcements/:id` - 更新公告
- `DELETE /api/announcements/:id` - 删除公告
- `POST /api/announcements/:id/publish` - 发布公告
- `POST /api/announcements/:id/unpublish` - 撤回公告
- `POST /api/announcements/:id/expire` - 设置公告过期

### 日志收集

**公共端点**:
- `POST /api/logs` - 上传客户端日志

**管理端点**:
- `GET /api/logs` - 查询日志（支持多维度过滤）
- `GET /api/logs/stats` - 获取日志统计
- `GET /api/logs/errors` - 获取错误日志
- `GET /api/logs/client/:clientIdentifier` - 获取特定客户端日志
- `DELETE /api/logs/cleanup` - 清理旧日志

详细文档请查看 [公告和日志功能文档](./ANNOUNCEMENTS_AND_LOGS.md)。

## 项目结构

```
packages/server/
├── prisma/
│   └── schema.prisma          # 数据库 Schema
├── src/
│   ├── common/                # 公共模块
│   │   ├── middleware/        # 中间件
│   │   ├── error.handler.ts   # 错误处理
│   │   ├── logger.service.ts  # 日志服务
│   │   ├── prisma.service.ts  # Prisma 客户端
│   │   └── response.util.ts   # 响应工具
│   ├── config/                # 配置
│   │   ├── database.config.ts
│   │   ├── env.config.ts
│   │   └── server.config.ts
│   ├── modules/               # 功能模块
│   │   ├── announcements/
│   │   ├── github/
│   │   ├── logs/
│   │   ├── modules/
│   │   └── releases/
│   └── main.ts                # 主入口
├── .env.example               # 环境变量示例
├── package.json
└── tsconfig.json
```

## 数据库模型

### Release（发布版本）
- 版本管理
- 支持多渠道（STABLE/BETA/ALPHA）
- 灰度发布支持

### ReleaseAsset（发布资产）
- 多平台支持（Windows/macOS/Linux）
- 多架构支持（x64/ARM64）
- 文件校验和签名

### Module（模块）
- 模块基本信息
- 分类和标签
- 下载统计和评分

### ModuleVersion（模块版本）
- 版本历史
- 变更日志
- 最小应用版本要求

### Announcement（公告）
- 多类型公告
- 定时发布和过期
- 优先级排序

### ClientLog（客户端日志）
- 日志收集
- 结构化存储
- 多维度查询

## 环境变量

| 变量 | 说明 | 默认值 |
|-----|------|--------|
| `NODE_ENV` | 运行环境 | `development` |
| `PORT` | 服务器端口 | `3000` |
| `HOST` | 服务器主机 | `0.0.0.0` |
| `DATABASE_URL` | PostgreSQL 连接字符串 | - |
| `GITHUB_TOKEN` | GitHub API Token（可选） | - |
| `CLIENT_API_TOKEN` | 客户端 API 令牌 | - |
| `INGEST_SHARED_SECRET` | 日志收集密钥 | - |
| `JWT_SECRET` | JWT 密钥（可选） | - |
| `CORS_ORIGIN` | CORS 来源 | `*` |
| `RATE_LIMIT_MAX` | 速率限制最大请求数 | `100` |
| `RATE_LIMIT_WINDOW` | 速率限制时间窗口（毫秒） | `60000` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `LOG_PRETTY` | 美化日志输出 | `true` |

## 安全考虑

1. **认证**
   - 客户端 API 使用 `x-client-token` 头
   - 日志 API 使用 `x-ingest-secret` 头
   - 管理 API 使用 JWT（待实现）

2. **速率限制**
   - 默认：100 请求/分钟
   - 可通过环境变量配置

3. **CORS**
   - 默认允许所有来源（开发）
   - 生产环境应配置特定来源

4. **安全头**
   - 使用 @fastify/helmet
   - 防止常见攻击

## 测试

本项目使用 Vitest 作为测试框架，已为核心业务逻辑编写了完善的单元测试。

### 测试覆盖

- ✅ **Version Util**: 版本号比较和验证逻辑（95%+ 覆盖率）
- ✅ **GitHub Service**: GitHub API 交互和数据处理（100% 覆盖率）
- ✅ **Releases Service**: 发布版本管理业务逻辑（85%+ 覆盖率）
- ✅ **Modules Service**: 模块市场业务逻辑（100% 覆盖率，34 个测试用例）
- ✅ **Announcements Service**: 公告管理业务逻辑（100% 覆盖率，14 个测试用例）
- ✅ **Logs Service**: 日志收集业务逻辑（100% 覆盖率，15 个测试用例）

### 运行测试

```bash
# 运行所有测试
pnpm test

# 监视模式（开发时推荐）
pnpm test:watch

# 查看覆盖率报告
pnpm test:coverage

# 使用 UI 界面
pnpm test:ui
```

### 测试报告

详细的测试报告请查看 [TEST_REPORT.md](./TEST_REPORT.md)。

### 测试架构

```
src/
├── __tests__/
│   ├── setup.ts           # 测试环境设置
│   └── mockData/          # Mock 数据
├── common/__tests__/      # 公共模块测试
├── modules/
│   ├── announcements/__tests__/ # 公告模块测试
│   ├── github/__tests__/  # GitHub 模块测试
│   ├── logs/__tests__/    # 日志模块测试
│   ├── modules/__tests__/  # 模块市场测试
│   └── releases/__tests__/ # Releases 模块测试
└── vitest.config.ts       # Vitest 配置
```

## 下一步

查看 [架构设计文档](../../architecture-plan.md) 了解完整的系统设计。

查看 [Release API 测试指南](./RELEASE_API_TESTING.md) 了解如何测试 API 端点。

查看 [公告和日志功能文档](./ANNOUNCEMENTS_AND_LOGS.md) 了解公告管理和日志收集功能。

## License

MIT