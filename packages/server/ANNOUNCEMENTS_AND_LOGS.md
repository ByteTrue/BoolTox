# 公告管理和日志收集功能文档

本文档介绍 BoolTox 服务器的公告管理和日志收集功能。

## 目录

- [公告管理功能](#公告管理功能)
- [日志收集功能](#日志收集功能)
- [API 端点](#api-端点)
- [使用示例](#使用示例)
- [性能优化](#性能优化)

---

## 公告管理功能

### 概述

公告管理功能允许管理员创建、更新、发布和管理系统公告。客户端可以获取活跃的公告以显示给用户。

### 功能特性

- ✅ 公告列表查询（支持分页、类型过滤、状态过滤）
- ✅ 获取活跃公告（客户端使用）
- ✅ 公告创建、更新、删除
- ✅ 公告发布/撤回功能
- ✅ 公告过期管理
- ✅ 支持优先级排序

### 公告类型

| 类型 | 说明 |
|------|------|
| `ANNOUNCEMENT` | 一般公告 |
| `UPDATE` | 更新公告 |
| `NOTICE` | 重要通知 |
| `MAINTENANCE` | 维护公告 |

### 公告状态

| 状态 | 说明 |
|------|------|
| `DRAFT` | 草稿状态 |
| `PUBLISHED` | 已发布 |
| `EXPIRED` | 已过期 |

### 数据模型

```typescript
interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: number; // 0-100，数字越大优先级越高
  status: AnnouncementStatus;
  publishAt: Date | null;
  expireAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 日志收集功能

### 概述

日志收集功能允许客户端批量上传日志到服务器，用于问题诊断和系统监控。

### 功能特性

- ✅ 批量日志上传（支持 Base64 编码）
- ✅ Checksum 验证
- ✅ 日志查询（支持多种过滤条件）
- ✅ 日志统计和分析
- ✅ 错误日志快速查询
- ✅ 自动清理旧日志

### 日志级别

| 级别 | 说明 |
|------|------|
| `DEBUG` | 调试信息 |
| `INFO` | 一般信息 |
| `WARN` | 警告信息 |
| `ERROR` | 错误信息 |

### 数据模型

```typescript
interface ClientLog {
  id: string;
  clientIdentifier: string;
  level: LogLevel;
  namespace: string;
  message: string;
  args: Record<string, unknown> | null;
  context: Record<string, unknown> | null;
  appVersion: string;
  platform: string | null;
  timestamp: Date;
  receivedAt: Date;
}
```

---

## API 端点

### 公告管理 API

#### 1. 获取公告列表（管理端）

```http
GET /api/announcements
```

**查询参数：**
- `type` (可选): 公告类型
- `status` (可选): 公告状态
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 10，最大 100
- `sortBy` (可选): 排序字段 (`priority`, `publishAt`, `createdAt`, `updatedAt`)，默认 `publishAt`
- `sortOrder` (可选): 排序方向 (`asc`, `desc`)，默认 `desc`

**响应示例：**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "clxxx",
        "title": "系统维护通知",
        "content": "系统将于...",
        "type": "MAINTENANCE",
        "priority": 10,
        "status": "PUBLISHED",
        "publishAt": "2024-01-01T00:00:00Z",
        "expireAt": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

#### 2. 获取活跃公告（客户端）

```http
GET /api/announcements/active
```

**响应示例：**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "title": "欢迎使用 BoolTox",
      "content": "...",
      "type": "ANNOUNCEMENT",
      "priority": 5,
      "status": "PUBLISHED",
      "publishAt": "2024-01-01T00:00:00Z",
      "expireAt": null
    }
  ]
}
```

#### 3. 获取公告详情

```http
GET /api/announcements/:id
```

#### 4. 创建公告（管理端）

```http
POST /api/announcements
```

**请求体：**
```json
{
  "title": "新功能发布",
  "content": "我们很高兴地宣布...",
  "type": "UPDATE",
  "priority": 10,
  "publishAt": "2024-01-01T00:00:00Z",
  "expireAt": "2024-12-31T23:59:59Z"
}
```

#### 5. 更新公告（管理端）

```http
PATCH /api/announcements/:id
```

**请求体：**
```json
{
  "title": "更新后的标题",
  "priority": 15
}
```

#### 6. 删除公告（管理端）

```http
DELETE /api/announcements/:id
```

#### 7. 发布公告（管理端）

```http
POST /api/announcements/:id/publish
```

**请求体（可选）：**
```json
{
  "publishAt": "2024-01-01T00:00:00Z"
}
```

#### 8. 撤回公告（管理端）

```http
POST /api/announcements/:id/unpublish
```

#### 9. 设置公告为过期（管理端）

```http
POST /api/announcements/:id/expire
```

### 日志收集 API

#### 1. 上传日志（客户端）

```http
POST /api/logs
```

**请求体：**
```json
{
  "clientIdentifier": "client-uuid-123",
  "payload": "base64_encoded_logs",
  "checksum": "sha256_checksum_optional",
  "metadata": {
    "appVersion": "1.0.0",
    "mode": "production",
    "batchSize": 10,
    "userAgent": "BoolTox/1.0.0",
    "locale": "zh-CN",
    "timestamp": 1704067200000
  }
}
```

**Payload 解码后格式：**
```json
[
  {
    "level": "INFO",
    "namespace": "app.module",
    "message": "Module loaded successfully",
    "args": ["arg1", "arg2"],
    "context": { "moduleId": "mod-123" },
    "timestamp": 1704067200000
  }
]
```

#### 2. 查询日志（管理端）

```http
GET /api/logs
```

**查询参数：**
- `clientIdentifier` (可选): 客户端标识
- `level` (可选): 日志级别
- `namespace` (可选): 命名空间
- `startDate` (可选): 开始时间（ISO 8601）
- `endDate` (可选): 结束时间（ISO 8601）
- `page` (可选): 页码，默认 1
- `limit` (可选): 每页数量，默认 100，最大 500
- `sortOrder` (可选): 排序方向，默认 `desc`

#### 3. 获取日志统计（管理端）

```http
GET /api/logs/stats
```

**查询参数：**
- `clientIdentifier` (可选): 客户端标识
- `startDate` (可选): 开始时间
- `endDate` (可选): 结束时间

**响应示例：**
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "byLevel": [
      { "level": "INFO", "count": 1000 },
      { "level": "ERROR", "count": 50 },
      { "level": "WARN", "count": 400 },
      { "level": "DEBUG", "count": 50 }
    ],
    "byClient": [
      { "clientIdentifier": "client-1", "count": 800 },
      { "clientIdentifier": "client-2", "count": 700 }
    ],
    "byNamespace": [
      { "namespace": "app", "count": 600 },
      { "namespace": "module", "count": 500 }
    ]
  }
}
```

#### 4. 获取错误日志（管理端）

```http
GET /api/logs/errors
```

查询参数同 `/api/logs`，但自动过滤 `level=ERROR`。

#### 5. 获取特定客户端日志

```http
GET /api/logs/client/:clientIdentifier
```

**查询参数：**
- `limit` (可选): 返回数量，默认 100

#### 6. 清理旧日志（管理端）

```http
DELETE /api/logs/cleanup
```

**查询参数：**
- `days` (必需): 清理多少天前的日志，范围 1-365

**响应示例：**
```json
{
  "success": true,
  "data": {
    "deleted": 500
  }
}
```

---

## 使用示例

### 公告管理示例

#### 创建并发布公告

```typescript
// 1. 创建公告
const response = await fetch('http://localhost:3000/api/announcements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '新版本发布',
    content: 'BoolTox v2.0.0 现已发布！',
    type: 'UPDATE',
    priority: 10
  })
});

const { data: announcement } = await response.json();

// 2. 发布公告
await fetch(`http://localhost:3000/api/announcements/${announcement.id}/publish`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    publishAt: new Date().toISOString()
  })
});

// 3. 客户端获取活跃公告
const activeResponse = await fetch('http://localhost:3000/api/announcements/active');
const { data: activeAnnouncements } = await activeResponse.json();
console.log('活跃公告:', activeAnnouncements);
```

### 日志上传示例

```typescript
// 准备日志数据
const logs = [
  {
    level: 'INFO',
    namespace: 'app',
    message: 'Application started',
    timestamp: Date.now()
  },
  {
    level: 'ERROR',
    namespace: 'module.loader',
    message: 'Failed to load module',
    args: ['module-id-123'],
    context: { error: 'Module not found' },
    timestamp: Date.now()
  }
];

// Base64 编码
const payload = Buffer.from(JSON.stringify(logs)).toString('base64');

// 计算 checksum（可选）
const crypto = require('crypto');
const checksum = crypto.createHash('sha256').update(payload).digest('hex');

// 上传日志
const response = await fetch('http://localhost:3000/api/logs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    clientIdentifier: 'my-client-uuid',
    payload,
    checksum,
    metadata: {
      appVersion: '1.0.0',
      batchSize: logs.length,
      timestamp: Date.now()
    }
  })
});

const result = await response.json();
console.log('上传结果:', result);
// { success: true, data: { received: 2, inserted: 2 } }
```

---

## 性能优化

### 公告管理优化

1. **数据库索引**
   - `status` + `publishAt` 复合索引（活跃公告查询）
   - `type` + `status` 复合索引（分类查询）

2. **查询优化**
   - 活跃公告查询使用时间范围过滤
   - 分页查询避免大量数据传输

### 日志收集优化

1. **批量插入**
   - 使用 `createMany` 批量插入日志
   - 支持 `skipDuplicates` 避免重复

2. **数据库索引**
   - `clientIdentifier` + `timestamp` 复合索引
   - `level` + `receivedAt` 复合索引
   - `namespace` + `receivedAt` 复合索引

3. **存储优化**
   - Base64 编码减少传输数据大小
   - 支持批量上传（最多 1000 条）
   - 自动清理旧日志（建议定期执行）

4. **查询优化**
   - 分页查询限制最大 500 条
   - 使用时间范围过滤减少扫描数据
   - 统计查询使用 `groupBy` 聚合

### 建议的维护策略

1. **日志清理**
   ```bash
   # 每天清理 30 天前的日志
   curl -X DELETE "http://localhost:3000/api/logs/cleanup?days=30"
   ```

2. **公告过期管理**
   - 定期检查并过期已到期的公告
   - 建议使用 cron 任务自动执行

3. **监控指标**
   - 日志上传成功率
   - 日志存储大小
   - 查询响应时间
   - 公告查看次数

---

## 测试覆盖

- ✅ 公告服务单元测试：14 个测试用例
- ✅ 日志服务单元测试：15 个测试用例
- ✅ 总计：29 个测试用例全部通过

### 运行测试

```bash
cd packages/server
npm test -- announcements.service.test.ts logs.service.test.ts
```

---

## 错误处理

所有 API 都使用统一的错误响应格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

常见错误码：
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 参数验证失败
- `INTERNAL_ERROR`: 服务器内部错误
- `DATABASE_ERROR`: 数据库操作失败

---

## 总结

公告管理和日志收集功能已完整实现，包括：

✅ 完整的 API 端点
✅ 数据验证和错误处理
✅ 性能优化（批量操作、索引）
✅ 完善的单元测试
✅ 详细的文档和示例

这两个功能为 BoolTox 系统提供了重要的运营和监控能力。