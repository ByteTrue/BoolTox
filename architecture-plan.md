# BoolTox 后台管理系统架构设计方案

## 📋 项目概述

为 BoolTox 客户端构建一个完整的后台管理系统，提供以下核心功能：
- 🔄 **在线更新管理**：通过 GitHub Release 托管安装包，后台同步版本信息
- 📦 **模块市场管理**：在线模块安装、版本管理、分发
- 📢 **公告系统**：客户端公告发布和管理
- 📊 **日志收集**：客户端日志上传、存储、查询分析

## 🏗️ Monorepo 项目结构

采用 **Turborepo + pnpm workspace** 架构：

```
BoolTox/
├── packages/
│   ├── client/                 # 现有客户端（Electron + React）
│   │   ├── electron/
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── server/                 # 后台服务（Node.js + Fastify）
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── releases/   # 版本发布模块
│   │   │   │   ├── modules/    # 模块市场
│   │   │   │   ├── announcements/ # 公告管理
│   │   │   │   ├── logs/       # 日志收集
│   │   │   │   └── github/     # GitHub 同步
│   │   │   ├── common/         # 公共模块
│   │   │   ├── config/         # 配置
│   │   │   └── main.ts
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── package.json
│   │
│   ├── shared/                 # 共享类型和工具
│   │   ├── src/
│   │   │   ├── types/          # TypeScript 类型定义
│   │   │   ├── constants/      # 常量
│   │   │   └── utils/          # 工具函数
│   │   └── package.json
│   │
│   └── admin-dashboard/        # 管理后台前端（可选）
│       ├── src/
│       └── package.json
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── README.md
```

### 包职责划分

| 包名 | 职责 | 技术栈 |
|------|------|--------|
| `@booltox/client` | 客户端应用 | Electron + React + Vite |
| `@booltox/server` | 后台 API 服务 | Fastify + Prisma + PostgreSQL |
| `@booltox/shared` | 类型和工具共享 | TypeScript |
| `@booltox/admin` | 管理后台（可选） | React + Vite |

## 🗄️ 数据库设计

### Prisma Schema 概览

```prisma
// 发布版本表
model Release {
  id              String          @id @default(cuid())
  version         String          @unique
  channel         ReleaseChannel  @default(STABLE)
  notes           String?         @db.Text
  mandatory       Boolean         @default(false)
  rolloutPercent  Int             @default(100)
  publishedAt     DateTime?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  assets          ReleaseAsset[]
  
  @@index([channel, publishedAt])
}

// 发布资产表（多平台支持）
model ReleaseAsset {
  id            String    @id @default(cuid())
  releaseId     String
  platform      Platform
  architecture  Arch
  downloadUrl   String
  checksum      String
  signature     String?
  sizeBytes     BigInt
  
  release       Release   @relation(fields: [releaseId], references: [id], onDelete: Cascade)
  
  @@unique([releaseId, platform, architecture])
  @@index([releaseId])
}

// 模块表
model Module {
  id              String          @id @default(cuid())
  name            String          @unique
  displayName     String
  description     String          @db.Text
  author          String
  category        String
  keywords        String[]
  currentVersion  String
  downloads       Int             @default(0)
  rating          Float?
  featured        Boolean         @default(false)
  status          ModuleStatus    @default(ACTIVE)
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  versions        ModuleVersion[]
  
  @@index([category, status])
  @@index([featured, status])
}

// 模块版本表
model ModuleVersion {
  id            String    @id @default(cuid())
  moduleId      String
  version       String
  changelog     String?   @db.Text
  bundleUrl     String
  checksum      String
  sizeBytes     BigInt
  minAppVersion String?
  publishedAt   DateTime  @default(now())
  
  module        Module    @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  
  @@unique([moduleId, version])
  @@index([moduleId, publishedAt])
}

// 公告表
model Announcement {
  id          String            @id @default(cuid())
  title       String
  content     String            @db.Text
  type        AnnouncementType  @default(ANNOUNCEMENT)
  priority    Int               @default(0)
  status      AnnouncementStatus @default(DRAFT)
  publishAt   DateTime?
  expireAt    DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt
  
  @@index([status, publishAt])
  @@index([type, status])
}

// 日志表（分表存储）
model ClientLog {
  id                String    @id @default(cuid())
  clientIdentifier  String
  level             LogLevel
  namespace         String
  message           String    @db.Text
  args              Json?
  context           Json?
  appVersion        String
  platform          String?
  timestamp         DateTime
  receivedAt        DateTime  @default(now())
  
  @@index([clientIdentifier, timestamp])
  @@index([level, receivedAt])
  @@index([namespace, receivedAt])
}

// 枚举类型
enum ReleaseChannel {
  STABLE
  BETA
  ALPHA
}

enum Platform {
  WINDOWS
  MACOS
  LINUX
}

enum Arch {
  X64
  ARM64
}

enum ModuleStatus {
  ACTIVE
  DEPRECATED
  ARCHIVED
}

enum AnnouncementType {
  ANNOUNCEMENT
  UPDATE
  NOTICE
  MAINTENANCE
}

enum AnnouncementStatus {
  DRAFT
  PUBLISHED
  EXPIRED
}

enum LogLevel {
  DEBUG
  INFO
  WARN
  ERROR
}
```

## 🔌 API 接口设计

### 1. 发布版本管理 API

#### 获取最新版本
```typescript
GET /api/public/releases/latest
Query: {
  version: string          // 当前版本
  platform: Platform       // 平台
  architecture: Arch       // 架构
  channel: ReleaseChannel  // 发布渠道
}
Response: {
  data: {
    updateAvailable: boolean
    release: {
      id: string
      version: string
      channel: string
      notes: string | null
      mandatory: boolean
      rolloutPercent: number
      publishedAt: string
      asset: {
        id: string
        downloadUrl: string
        checksum: string
        signature: string | null
        sizeBytes: number
        platform: string
        architecture: string
      }
    } | null
  }
}
```

#### 管理端：创建发布版本
```typescript
POST /api/admin/releases
Body: {
  version: string
  channel: ReleaseChannel
  notes?: string
  mandatory?: boolean
  rolloutPercent?: number
  assets: Array<{
    platform: Platform
    architecture: Arch
    downloadUrl: string
    checksum: string
    sizeBytes: number
  }>
}
```

#### 管理端：同步 GitHub Release
```typescript
POST /api/admin/releases/sync-github
Body: {
  repository: string  // e.g., "owner/repo"
  tag: string        // Release tag
}
```

### 2. 模块市场 API

#### 获取模块列表
```typescript
GET /api/public/modules
Query: {
  category?: string
  search?: string
  featured?: boolean
  page?: number
  limit?: number
}
Response: {
  data: {
    modules: Module[]
    pagination: {
      total: number
      page: number
      limit: number
    }
  }
}
```

#### 获取模块详情
```typescript
GET /api/public/modules/:id
Response: {
  data: {
    module: Module & {
      versions: ModuleVersion[]
    }
  }
}
```

#### 下载模块
```typescript
GET /api/public/modules/:id/download
Query: {
  version?: string  // 不指定则下载最新版本
}
Response: 重定向到 CDN 下载地址或返回下载信息
```

### 3. 公告系统 API

#### 获取公告列表
```typescript
GET /api/public/announcements
Query: {
  limit?: number
  type?: AnnouncementType
}
Response: {
  data: Announcement[]
}
```

### 4. 日志收集 API

#### 上传日志
```typescript
POST /api/logs/ingest
Headers: {
  x-ingest-secret?: string
  x-client-token?: string
}
Body: {
  clientIdentifier: string
  payload: string           // Base64 编码的日志数据
  checksum?: string         // SHA-256 校验和
  metadata: {
    appVersion: string
    mode?: string
    batchSize: number
    userAgent?: string
    locale?: string
    timestamp: number
  }
}
```

#### 管理端：查询日志
```typescript
GET /api/admin/logs
Query: {
  clientIdentifier?: string
  level?: LogLevel
  namespace?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}
```

## 🔄 GitHub Release 同步策略

### 同步机制设计

```mermaid
graph TD
    A[GitHub Release 发布] -->|Webhook| B[后台接收通知]
    B --> C[解析 Release 信息]
    C --> D[下载并计算 Checksum]
    D --> E[存储到数据库]
    E --> F[更新 CDN 缓存]
    
    G[定时任务每小时] --> H[检查新 Release]
    H --> I{有新版本?}
    I -->|是| C
    I -->|否| J[结束]
```

### 同步策略实现

#### 1. GitHub Webhook（推荐）
```typescript
// 在 GitHub Repository Settings 配置 Webhook
POST /api/webhooks/github
Event: release.published
Payload: {
  action: "published"
  release: {
    tag_name: string
    name: string
    body: string
    assets: Array<{
      name: string
      browser_download_url: string
      size: number
    }>
  }
}
```

#### 2. 定时同步（备用方案）
```typescript
// 使用 node-cron 每小时检查一次
cron.schedule('0 * * * *', async () => {
  const releases = await fetchGitHubReleases();
  await syncReleasesToDatabase(releases);
});
```

#### 3. 手动同步
```typescript
// 管理后台提供手动同步按钮
POST /api/admin/releases/sync-github
```

### GitHub API 集成

```typescript
// github.service.ts
import { Octokit } from '@octokit/rest';

class GitHubService {
  private octokit: Octokit;

  constructor(token: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getLatestRelease(owner: string, repo: string) {
    const { data } = await this.octokit.repos.getLatestRelease({
      owner,
      repo,
    });
    return data;
  }

  async getReleaseByTag(owner: string, repo: string, tag: string) {
    const { data } = await this.octokit.repos.getReleaseByTag({
      owner,
      repo,
      tag,
    });
    return data;
  }

  async downloadAsset(url: string): Promise<Buffer> {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }

  calculateChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
```

## 📦 模块市场实现

### 模块分发流程

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant CDN as CDN/GitHub

    C->>S: GET /api/public/modules
    S->>DB: Query modules
    DB-->>S: Return modules list
    S-->>C: Return modules

    C->>S: GET /api/public/modules/:id/download
    S->>DB: Get module version
    DB-->>S: Return download URL
    S-->>C: Redirect to CDN
    C->>CDN: Download module bundle
```

### 模块安装流程

客户端已有的模块安装器（[`installer.ts`](booltox-client/src/core/modules/installer.ts:1)）可以直接使用：

```typescript
// 客户端代码
import { ModuleInstaller } from '@/core/modules/installer';

const installer = new ModuleInstaller();
await installer.install({
  id: 'module-id',
  bundleUrl: 'https://cdn.example.com/module.js',
  checksum: 'sha256-hash',
});
```

## 📊 日志收集方案

### 日志处理流程

```mermaid
graph LR
    A[客户端日志] -->|批量上传| B[API 接收]
    B -->|Base64 解码| C[验证 Checksum]
    C -->|解析 JSON| D[写入数据库]
    D -->|异步| E[日志分析]
    E --> F[生成报表]
    E --> G[告警通知]
```

### 日志存储优化

1. **分表策略**：按月分表存储，提高查询性能
2. **索引优化**：为常用查询字段建立索引
3. **归档策略**：3个月以上的日志归档到冷存储
4. **压缩存储**：JSON 字段使用 JSONB 类型压缩

### 日志查询 API

```typescript
// 按客户端查询
GET /api/admin/logs?clientIdentifier=xxx&startDate=2025-01-01

// 按级别查询
GET /api/admin/logs?level=ERROR&limit=100

// 按命名空间查询
GET /api/admin/logs?namespace=module:installer&page=1
```

## 🚀 技术栈详细说明

### 后端技术栈

| 组件 | 技术选型 | 理由 |
|------|---------|------|
| 运行时 | Node.js 20+ | LTS 版本，稳定可靠 |
| Web 框架 | Fastify | 高性能，TypeScript 友好 |
| ORM | Prisma | 类型安全，迁移方便 |
| 数据库 | PostgreSQL 15+ | 功能强大，JSON 支持好 |
| 验证 | Zod | 类型安全的数据验证 |
| 任务调度 | node-cron | 简单可靠的定时任务 |
| 日志 | Pino | 高性能 JSON 日志 |

### 开发工具

| 工具 | 用途 |
|------|------|
| Turborepo | Monorepo 构建和缓存 |
| pnpm | 包管理器 |
| tsx | TypeScript 执行器 |
| ESLint | 代码检查 |
| Prettier | 代码格式化 |

## 📁 Monorepo 配置文件

### pnpm-workspace.yaml
```yaml
packages:
  - 'packages/*'
```

### turbo.json
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    }
  }
}
```

### 根目录 package.json
```json
{
  "name": "booltox-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check",
    "db:migrate": "pnpm --filter @booltox/server db:migrate",
    "db:studio": "pnpm --filter @booltox/server db:studio"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "@booltox/eslint-config": "workspace:*",
    "@booltox/typescript-config": "workspace:*"
  }
}
```

## 🔐 安全考虑

### 1. API 认证
- 公开 API：使用 `x-client-token` 令牌
- 管理 API：使用 JWT + 角色权限
- 日志上传：使用 `x-ingest-secret` 共享密钥

### 2. 数据验证
- 使用 Zod 验证所有输入
- Checksum 验证文件完整性
- SQL 注入防护（Prisma 自动处理）

### 3. 速率限制
```typescript
// 使用 @fastify/rate-limit
fastify.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});
```

## 📈 部署方案

### 推荐部署架构

```
┌─────────────┐
│   客户端     │
└──────┬──────┘
       │ HTTPS
       ↓
┌─────────────┐
│  Nginx/CDN  │  ← 静态资源、负载均衡
└──────┬──────┘
       │
       ↓
┌─────────────┐
│   Fastify   │  ← API 服务
│   Server    │
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ PostgreSQL  │  ← 数据存储
└─────────────┘
```

### 环境变量配置

```env
# 数据库
DATABASE_URL="postgresql://user:pass@localhost:5432/booltox"

# GitHub
GITHUB_TOKEN="ghp_xxx"
GITHUB_OWNER="ByteTrue"
GITHUB_REPO="booltox-client"

# 安全
CLIENT_API_TOKEN="xxx"
INGEST_SHARED_SECRET="xxx"
JWT_SECRET="xxx"

# 服务
PORT=3000
NODE_ENV=production
```

## 🔄 CI/CD 流程

### GitHub Actions 工作流

```yaml
name: Build and Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm run build
      - run: pnpm run lint
      - run: pnpm run type-check
      
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: echo "Deploy to server"
```

## 📝 下一步行动计划

### 阶段 1：项目搭建（1-2天）
1. 初始化 Turborepo + pnpm workspace
2. 创建 packages 结构
3. 配置 shared 包的类型定义
4. 配置 ESLint 和 Prettier

### 阶段 2：后台核心（3-5天）
1. 初始化 Fastify 项目
2. 配置 Prisma 和数据库
3. 实现发布版本 API
4. 实现 GitHub 同步逻辑

### 阶段 3：功能完善（3-5天）
1. 实现模块市场 API
2. 实现公告系统 API
3. 实现日志收集 API
4. 添加认证和权限

### 阶段 4：测试和优化（2-3天）
1. 编写单元测试
2. 性能优化
3. 文档完善
4. 部署准备

## 🎯 关键技术决策总结

| 决策点 | 选择 | 原因 |
|--------|------|------|
| Monorepo 工具 | Turborepo | 性能好、配置简单、适合中小型项目 |
| Web 框架 | Fastify | 高性能、TypeScript 原生支持 |
| ORM | Prisma | 类型安全、迁移方便、开发体验好 |
| 数据库 | PostgreSQL | 功能强大、JSON 支持、生态成熟 |
| Release 托管 | GitHub Release | 免费、稳定、带宽充足 |
| Release 同步 | 数据库缓存 | 稳定性高、可扩展、便于统计 |

## 📚 参考资料

- [Turborepo 文档](https://turbo.build/repo/docs)
- [Fastify 文档](https://fastify.dev/)
- [Prisma 文档](https://www.prisma.io/docs)
- [GitHub API 文档](https://docs.github.com/en/rest)
- [客户端更新系统文档](booltox-client/docs/online-update-system.md)

---

## ✅ 架构设计完成

这份设计方案涵盖了：
- ✅ 完整的 Monorepo 结构设计
- ✅ 详细的数据库 Schema
- ✅ 完整的 API 接口规范
- ✅ GitHub Release 同步策略
- ✅ 模块市场实现方案
- ✅ 日志收集处理方案
- ✅ 部署和 CI/CD 流程
- ✅ 安全和性能考虑

**准备好进入实施阶段了吗？** 🚀