# BoolTox 后台服务快速开始指南

## 🚀 5 分钟快速启动

### 使用 Docker（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/ByteTrue/BoolTox.git
cd BoolTox/packages/server

# 2. 配置环境变量
cp .env.example .env

# 3. 启动服务
docker-compose up -d

# 4. 查看日志
docker-compose logs -f api

# 5. 测试 API
curl http://localhost:3000/health
```

✅ 完成！API 现在运行在 `http://localhost:3000`

---

## 📦 本地开发启动

### 前置要求

- Node.js v20+
- PostgreSQL v14+
- pnpm v8+

### 快速步骤

```bash
# 1. 安装依赖
cd BoolTox
pnpm install

# 2. 配置环境
cd packages/server
cp .env.example .env
# 编辑 .env，设置 DATABASE_URL

# 3. 创建数据库
psql -U postgres -c "CREATE DATABASE booltox;"

# 4. 运行迁移
pnpm prisma:migrate

# 5. 启动开发服务器
pnpm dev
```

✅ 服务器运行在 `http://localhost:3000`

---

## 🧪 验证安装

### 健康检查

```bash
curl http://localhost:3000/health
```

**预期输出：**
```json
{
  "status": "ok",
  "timestamp": "2025-01-04T16:00:00.000Z"
}
```

### 测试 API 端点

#### 1. 获取模块列表

```bash
curl http://localhost:3000/api/modules
```

#### 2. 获取 Release 列表

```bash
curl http://localhost:3000/api/releases
```

#### 3. 获取公告列表

```bash
curl http://localhost:3000/api/announcements
```

---

## 📝 基本 API 使用

### 模块管理

#### 创建模块

```bash
curl -X POST http://localhost:3000/api/modules \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{
    "name": "my-module",
    "displayName": "My Module",
    "description": "A test module",
    "version": "1.0.0",
    "type": "builtin"
  }'
```

#### 查询模块

```bash
# 获取所有模块
curl http://localhost:3000/api/modules

# 分页查询
curl "http://localhost:3000/api/modules?page=1&limit=10"

# 搜索模块
curl "http://localhost:3000/api/modules?search=test"
```

#### 更新模块

```bash
curl -X PATCH http://localhost:3000/api/modules/my-module \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{
    "displayName": "Updated Module Name",
    "description": "Updated description"
  }'
```

#### 删除模块

```bash
curl -X DELETE http://localhost:3000/api/modules/my-module \
  -H "x-api-key: your-api-token"
```

### Release 管理

#### 获取最新 Release

```bash
curl http://localhost:3000/api/releases/latest
```

**响应示例：**
```json
{
  "version": "1.0.0",
  "name": "v1.0.0",
  "description": "Release notes...",
  "publishedAt": "2025-01-04T00:00:00.000Z",
  "assets": [
    {
      "name": "BoolTox-Setup-1.0.0.exe",
      "size": 102400000,
      "downloadUrl": "https://github.com/..."
    }
  ]
}
```

#### 获取 Release 列表

```bash
# 获取所有 Release
curl http://localhost:3000/api/releases

# 分页查询
curl "http://localhost:3000/api/releases?page=1&limit=5"

# 包含预发布版本
curl "http://localhost:3000/api/releases?includePrerelease=true"
```

#### 同步 GitHub Releases

```bash
curl -X POST http://localhost:3000/api/releases/sync \
  -H "x-api-key: your-api-token"
```

### 公告管理

#### 创建公告

```bash
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{
    "title": "新功能发布",
    "content": "我们发布了新功能...",
    "type": "info",
    "priority": "high",
    "isActive": true
  }'
```

#### 获取活跃公告

```bash
curl http://localhost:3000/api/announcements/active
```

#### 获取所有公告

```bash
# 分页查询
curl "http://localhost:3000/api/announcements?page=1&limit=10"

# 按类型筛选
curl "http://localhost:3000/api/announcements?type=warning"

# 按优先级筛选
curl "http://localhost:3000/api/announcements?priority=high"
```

### 日志收集

#### 上传日志

```bash
curl -X POST http://localhost:3000/api/logs/ingest \
  -H "Content-Type: application/json" \
  -H "x-ingest-secret: your-ingest-secret" \
  -d '{
    "level": "info",
    "message": "Application started",
    "source": "client",
    "metadata": {
      "version": "1.0.0",
      "platform": "win32"
    }
  }'
```

#### 批量上传日志

```bash
curl -X POST http://localhost:3000/api/logs/ingest/batch \
  -H "Content-Type: application/json" \
  -H "x-ingest-secret: your-ingest-secret" \
  -d '{
    "logs": [
      {
        "level": "info",
        "message": "Log entry 1",
        "source": "client"
      },
      {
        "level": "error",
        "message": "Log entry 2",
        "source": "client"
      }
    ]
  }'
```

#### 查询日志

```bash
# 获取日志列表
curl "http://localhost:3000/api/logs?page=1&limit=50" \
  -H "x-api-key: your-api-token"

# 按级别筛选
curl "http://localhost:3000/api/logs?level=error" \
  -H "x-api-key: your-api-token"

# 按来源筛选
curl "http://localhost:3000/api/logs?source=client" \
  -H "x-api-key: your-api-token"

# 时间范围查询
curl "http://localhost:3000/api/logs?startDate=2025-01-01&endDate=2025-01-31" \
  -H "x-api-key: your-api-token"
```

---

## 🔧 常见场景示例

### 场景 1: 客户端版本检查

```bash
# 1. 获取最新版本
latest=$(curl -s http://localhost:3000/api/releases/latest | jq -r '.version')

# 2. 比较版本
if [ "$current_version" != "$latest" ]; then
  echo "新版本可用: $latest"
fi
```

### 场景 2: 公告推送

```bash
# 1. 创建紧急公告
curl -X POST http://localhost:3000/api/announcements \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-token" \
  -d '{
    "title": "紧急维护通知",
    "content": "系统将于今晚 22:00 进行维护",
    "type": "warning",
    "priority": "urgent",
    "isActive": true,
    "startDate": "2025-01-04T14:00:00Z",
    "endDate": "2025-01-05T02:00:00Z"
  }'

# 2. 客户端获取活跃公告
curl http://localhost:3000/api/announcements/active
```

### 场景 3: 错误日志监控

```bash
# 1. 查询最近的错误日志
curl "http://localhost:3000/api/logs?level=error&page=1&limit=10" \
  -H "x-api-key: your-api-token" \
  | jq '.data[] | {message, timestamp}'

# 2. 统计错误数量
curl "http://localhost:3000/api/logs/stats?level=error" \
  -H "x-api-key: your-api-token"
```

### 场景 4: 模块使用统计

```bash
# 1. 记录模块安装
curl -X POST http://localhost:3000/api/modules/my-module/install \
  -H "x-api-key: your-api-token"

# 2. 查询模块统计
curl http://localhost:3000/api/modules/my-module/stats \
  -H "x-api-key: your-api-token"
```

---

## 🌐 JavaScript/TypeScript 客户端示例

### Node.js 示例

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const API_KEY = 'your-api-token';

// 创建 axios 实例
const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json',
  },
});

// 获取模块列表
async function getModules() {
  try {
    const response = await client.get('/modules');
    console.log('Modules:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching modules:', error);
  }
}

// 获取最新 Release
async function getLatestRelease() {
  try {
    const response = await client.get('/releases/latest');
    console.log('Latest release:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching latest release:', error);
  }
}

// 创建公告
async function createAnnouncement(data) {
  try {
    const response = await client.post('/announcements', data);
    console.log('Announcement created:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating announcement:', error);
  }
}

// 上传日志
async function uploadLog(logData) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/logs/ingest`,
      logData,
      {
        headers: {
          'x-ingest-secret': 'your-ingest-secret',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Log uploaded:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading log:', error);
  }
}

// 使用示例
(async () => {
  await getModules();
  await getLatestRelease();
  
  await createAnnouncement({
    title: '测试公告',
    content: '这是一个测试公告',
    type: 'info',
    priority: 'medium',
    isActive: true,
  });
  
  await uploadLog({
    level: 'info',
    message: 'Application started',
    source: 'client',
    metadata: {
      version: '1.0.0',
    },
  });
})();
```

### 浏览器示例

```javascript
// 使用 Fetch API
async function fetchModules() {
  try {
    const response = await fetch('http://localhost:3000/api/modules');
    const data = await response.json();
    console.log('Modules:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}

// 使用认证
async function createModule(moduleData) {
  try {
    const response = await fetch('http://localhost:3000/api/modules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'your-api-token',
      },
      body: JSON.stringify(moduleData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Module created:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🛠️ 开发工具

### 使用 Postman

1. 导入 API 集合（如有提供）
2. 设置环境变量：
   - `base_url`: `http://localhost:3000`
   - `api_key`: 你的 API 密钥

### 使用 cURL 测试脚本

创建 `test-api.sh`:

```bash
#!/bin/bash
API_BASE="http://localhost:3000/api"
API_KEY="your-api-token"

# 颜色输出
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Testing BoolTox API..."

# 测试健康检查
echo -e "\n${GREEN}Testing health endpoint...${NC}"
curl -s http://localhost:3000/health | jq

# 测试模块 API
echo -e "\n${GREEN}Testing modules API...${NC}"
curl -s "$API_BASE/modules" | jq '.data[0]'

# 测试 Release API
echo -e "\n${GREEN}Testing releases API...${NC}"
curl -s "$API_BASE/releases/latest" | jq

# 测试公告 API
echo -e "\n${GREEN}Testing announcements API...${NC}"
curl -s "$API_BASE/announcements/active" | jq

echo -e "\n${GREEN}All tests completed!${NC}"
```

运行测试：

```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 📚 下一步

### 深入了解

- 📖 [完整 API 文档](./API.md)（如果有）
- 🚀 [部署指南](./DEPLOYMENT.md)
- 🔧 [运维手册](./OPERATIONS.md)
- 📊 [测试报告](./FINAL_TEST_REPORT.md)

### 常见问题

#### Q: 如何修改 API 端口？

A: 编辑 `.env` 文件中的 `PORT` 变量：

```env
PORT=8080
```

#### Q: 如何启用 GitHub Release 同步？

A: 配置 `.env` 文件：

```env
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_org
GITHUB_REPO=your_repo
SYNC_ENABLED=true
SYNC_INTERVAL=3600000  # 1小时
```

#### Q: 如何查看详细日志？

A: 设置日志级别为 debug：

```env
LOG_LEVEL=debug
LOG_PRETTY=true
```

#### Q: API 需要认证吗？

A: 是的，大部分写操作需要 API 密钥。在请求头中添加：

```bash
-H "x-api-key: your-api-token"
```

#### Q: 如何重置数据库？

A: 开发环境可以使用：

```bash
pnpm prisma:migrate:reset
```

⚠️ 注意：这会删除所有数据！

---

## 🆘 获取帮助

如果遇到问题：

1. 查看 [故障排查](./DEPLOYMENT.md#故障排查)
2. 查看日志：`docker-compose logs -f` 或 `pm2 logs`
3. 提交 [GitHub Issue](https://github.com/ByteTrue/BoolTox/issues)
4. 查看 [完整文档](./README.md)

---

**祝您使用愉快！** 🎉

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-04  
**维护者**: BoolTox Team