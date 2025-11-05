# Release API 测试指南

## 前置条件

1. 配置环境变量（`.env` 文件）：
```env
DATABASE_URL="postgresql://user:password@localhost:5432/booltox"
GITHUB_TOKEN="ghp_xxxxxxxxxxxxx"  # GitHub Personal Access Token (可选，用于增加 API 速率限制和 Webhook 验证)
GITHUB_OWNER="ByteTrue"
GITHUB_REPO="booltox-client"
CLIENT_API_TOKEN="your-32-char-token-here"
INGEST_SHARED_SECRET="your-32-char-secret-here"
JWT_SECRET="your-32-char-jwt-secret-here"  # 用于管理端认证
```

2. 运行数据库迁移：
```bash
cd packages/server
pnpm db:push
```

3. 启动服务器：
```bash
pnpm dev
```

## API 端点测试

### 1. 客户端查询最新版本（公共 API）

**端点：** `GET /api/public/releases/latest`

**查询参数：**
- `version`: 当前版本号（例如：1.0.0）
- `platform`: WINDOWS | MACOS | LINUX
- `architecture`: X64 | ARM64
- `channel`: STABLE | BETA | ALPHA

**示例请求：**
```bash
curl "http://localhost:3000/api/public/releases/latest?version=1.0.0&platform=WINDOWS&architecture=X64&channel=STABLE"
```

**预期响应：**
```json
{
  "success": true,
  "data": {
    "updateAvailable": true,
    "release": {
      "id": "clxxx...",
      "version": "1.1.0",
      "channel": "STABLE",
      "notes": "Release notes here",
      "mandatory": false,
      "rolloutPercent": 100,
      "publishedAt": "2024-01-01T00:00:00.000Z",
      "asset": {
        "id": "clyyy...",
        "downloadUrl": "https://github.com/ByteTrue/booltox-client/releases/download/v1.1.0/app.exe",
        "checksum": "abc123...",
        "signature": null,
        "sizeBytes": 12345678,
        "platform": "WINDOWS",
        "architecture": "X64"
      }
    }
  }
}
```

### 2. 手动同步 GitHub Release（管理 API）

**端点：** `POST /api/admin/releases/sync-github`

**请求头：**
- `Authorization: Bearer <jwt-token>`

**请求体选项：**

A. 同步最新版本：
```json
{}
```

B. 同步指定 tag：
```json
{
  "tag": "v1.0.0"
}
```

C. 同步所有版本（最多 10 个）：
```json
{
  "syncAll": true,
  "limit": 10
}
```

**示例请求：**
```bash
curl -X POST http://localhost:3000/api/admin/releases/sync-github \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"syncAll": true, "limit": 5}'
```

### 3. 列出所有版本（管理 API）

**端点：** `GET /api/admin/releases`

**查询参数：**
- `channel`: STABLE | BETA | ALPHA（可选）
- `page`: 页码（默认：1）
- `limit`: 每页数量（默认：20，最大：100）

**示例请求：**
```bash
curl "http://localhost:3000/api/admin/releases?channel=STABLE&page=1&limit=10" \
  -H "Authorization: Bearer your-jwt-token"
```

### 4. 创建版本（管理 API）

**端点：** `POST /api/admin/releases`

**请求体：**
```json
{
  "version": "1.0.0",
  "channel": "STABLE",
  "notes": "Initial release",
  "mandatory": false,
  "rolloutPercent": 100,
  "assets": [
    {
      "platform": "WINDOWS",
      "architecture": "X64",
      "downloadUrl": "https://example.com/app.exe",
      "checksum": "sha256-hash-here",
      "signature": null,
      "sizeBytes": 12345678
    }
  ]
}
```

### 5. 更新版本（管理 API）

**端点：** `PUT /api/admin/releases/:id`

**请求体：**
```json
{
  "channel": "STABLE",
  "notes": "Updated release notes",
  "mandatory": true,
  "rolloutPercent": 50,
  "publishedAt": "2024-01-01T00:00:00.000Z"
}
```

### 6. 删除版本（管理 API）

**端点：** `DELETE /api/admin/releases/:id`

**示例请求：**
```bash
curl -X DELETE http://localhost:3000/api/admin/releases/clxxx... \
  -H "Authorization: Bearer your-jwt-token"
```

### 7. GitHub Webhook（公共 API）

**端点：** `POST /api/webhooks/github`

**请求头：**
- `X-Hub-Signature-256`: GitHub webhook 签名
- `X-GitHub-Event`: release

**注意：** 此端点由 GitHub 自动调用，不需要手动测试。

**测试连接：**
```bash
curl http://localhost:3000/api/webhooks/github/ping
```

## 自动化测试流程

### 测试场景 1：从 GitHub 同步 Release

1. 确保 GitHub 仓库有发布版本
2. 调用同步 API：
```bash
curl -X POST http://localhost:3000/api/admin/releases/sync-github \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{"syncAll": true, "limit": 5}'
```
3. 验证响应成功
4. 查询版本列表确认已同步

### 测试场景 2：客户端检查更新

1. 确保数据库中有版本数据
2. 使用旧版本号查询：
```bash
curl "http://localhost:3000/api/public/releases/latest?version=0.0.1&platform=WINDOWS&architecture=X64&channel=STABLE"
```
3. 验证返回 `updateAvailable: true`
4. 使用最新版本号查询，验证返回 `updateAvailable: false`

### 测试场景 3：灰度发布

1. 创建版本，设置 `rolloutPercent: 50`
2. 使用不同的当前版本号多次查询
3. 验证约 50% 的请求能获取到更新

## 定时任务测试

定时任务每小时运行一次，自动同步最新的 GitHub Release。

**查看日志：**
```bash
# 服务器启动时会显示：
# GitHub release sync cron task started (runs every hour)

# 每次执行时会显示：
# Running scheduled GitHub release sync
# Scheduled GitHub release sync completed successfully
```

**立即触发测试（开发环境）：**
可以在代码中调用 `syncCronService.runNow()` 来立即执行一次同步。

## 常见问题

### 1. GitHub API Rate Limit

如果没有配置 `GITHUB_TOKEN`，GitHub API 限制为每小时 60 次请求。配置 token 后可提升至 5000 次。

### 2. 文件下载失败

同步过程中需要下载 Release 资产文件来计算 checksum，确保网络连接正常。

### 3. 平台/架构识别失败

检查 Release 资产文件名是否包含平台和架构信息（如：app-windows-x64.exe）。

### 4. Webhook 签名验证失败

确保 `GITHUB_TOKEN` 配置正确，并在 GitHub 仓库设置中配置相同的 Secret。

## 兼容性验证

客户端期望的响应格式已完全匹配：
- ✅ `updateAvailable` 字段
- ✅ `release` 对象结构
- ✅ `asset` 对象结构
- ✅ 所有字段类型匹配

客户端调用示例见：[`packages/client/src/renderer/lib/update-service.ts`](../client/src/renderer/lib/update-service.ts)