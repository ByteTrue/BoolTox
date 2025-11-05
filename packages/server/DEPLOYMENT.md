# BoolTox 后台服务部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [开发环境部署](#开发环境部署)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [数据库迁移](#数据库迁移)
- [环境变量配置](#环境变量配置)
- [性能调优](#性能调优)
- [故障排查](#故障排查)
- [安全建议](#安全建议)

---

## 系统要求

### 最低配置

- **操作系统**: Linux (Ubuntu 20.04+), macOS, Windows 10+
- **Node.js**: v20.0.0 或更高
- **PostgreSQL**: v14.0 或更高
- **内存**: 512MB RAM
- **存储**: 1GB 可用空间
- **包管理器**: pnpm v8.0+

### 推荐配置（生产环境）

- **操作系统**: Ubuntu 22.04 LTS
- **Node.js**: v20 LTS
- **PostgreSQL**: v16
- **内存**: 2GB+ RAM
- **存储**: 10GB+ 可用空间
- **CPU**: 2+ 核心

### 网络要求

- 开放端口 3000（API 服务）
- 开放端口 5432（PostgreSQL，如果外部访问）
- 访问 GitHub API（如需同步 Release）

---

## 快速开始

### 5 分钟快速部署（Docker）

```bash
# 1. 克隆仓库
git clone https://github.com/ByteTrue/BoolTox.git
cd BoolTox/packages/server

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，至少配置 DATABASE_URL

# 3. 启动服务（使用 Docker Compose）
docker-compose up -d

# 4. 查看日志
docker-compose logs -f api

# 5. 访问 API
curl http://localhost:3000/health
```

---

## 开发环境部署

### 前置准备

1. **安装 Node.js**

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

2. **安装 pnpm**

```bash
npm install -g pnpm
```

3. **安装 PostgreSQL**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@16

# 启动服务
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

### 部署步骤

1. **克隆代码**

```bash
git clone https://github.com/ByteTrue/BoolTox.git
cd BoolTox
```

2. **安装依赖**

```bash
# 在项目根目录
pnpm install
```

3. **配置环境变量**

```bash
cd packages/server
cp .env.example .env
```

编辑 `.env` 文件：

```env
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://booltox:your_password@localhost:5432/booltox?schema=public"
GITHUB_TOKEN=your_github_token
# ... 其他配置
```

4. **创建数据库**

```bash
# 连接到 PostgreSQL
psql -U postgres

# 在 psql 中执行
CREATE DATABASE booltox;
CREATE USER booltox WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE booltox TO booltox;
\q
```

5. **运行数据库迁移**

```bash
pnpm prisma:migrate
```

6. **生成 Prisma Client**

```bash
pnpm prisma:generate
```

7. **启动开发服务器**

```bash
# 开发模式（热重载）
pnpm dev

# 或构建后运行
pnpm build
pnpm start
```

8. **验证部署**

```bash
# 检查健康状态
curl http://localhost:3000/health

# 测试 API
curl http://localhost:3000/api/modules
```

---

## 生产环境部署

### 方式 1: 直接部署

1. **准备生产环境**

```bash
# 创建应用目录
sudo mkdir -p /opt/booltox
sudo chown $USER:$USER /opt/booltox

# 克隆代码
cd /opt/booltox
git clone https://github.com/ByteTrue/BoolTox.git .
```

2. **安装依赖**

```bash
pnpm install --frozen-lockfile --prod
```

3. **配置生产环境变量**

```bash
cd packages/server
cp .env.example .env
nano .env  # 或使用其他编辑器
```

关键生产配置：

```env
NODE_ENV=production
PORT=3000
DATABASE_URL="postgresql://booltox:STRONG_PASSWORD@localhost:5432/booltox?schema=public"
CLIENT_API_TOKEN=GENERATE_SECURE_TOKEN_32_CHARS
INGEST_SHARED_SECRET=GENERATE_SECURE_TOKEN_32_CHARS
JWT_SECRET=GENERATE_SECURE_TOKEN_32_CHARS
CORS_ORIGIN=https://your-domain.com
LOG_PRETTY=false
LOG_LEVEL=warn
```

生成安全令牌：

```bash
# 生成 3 个不同的令牌
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

4. **构建应用**

```bash
cd packages/server
pnpm build
```

5. **运行数据库迁移**

```bash
pnpm prisma:migrate:prod
```

6. **使用 PM2 管理进程**

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start dist/main.js --name booltox-api

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs booltox-api
```

### 方式 2: 使用 systemd

1. **创建 systemd 服务文件**

```bash
sudo nano /etc/systemd/system/booltox-api.service
```

```ini
[Unit]
Description=BoolTox API Server
After=network.target postgresql.service

[Service]
Type=simple
User=booltox
WorkingDirectory=/opt/booltox/packages/server
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=booltox-api

[Install]
WantedBy=multi-user.target
```

2. **启动服务**

```bash
sudo systemctl daemon-reload
sudo systemctl enable booltox-api
sudo systemctl start booltox-api

# 查看状态
sudo systemctl status booltox-api

# 查看日志
sudo journalctl -u booltox-api -f
```

### 方式 3: 使用 Nginx 反向代理

1. **安装 Nginx**

```bash
sudo apt install nginx
```

2. **配置 Nginx**

```bash
sudo nano /etc/nginx/sites-available/booltox
```

```nginx
upstream booltox_backend {
    server localhost:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req zone=api_limit burst=20 nodelay;

    # 日志配置
    access_log /var/log/nginx/booltox-access.log;
    error_log /var/log/nginx/booltox-error.log;

    location / {
        proxy_pass http://booltox_backend;
        proxy_http_version 1.1;
        
        # Headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Cache
        proxy_cache_bypass $http_upgrade;
    }

    # 健康检查
    location /health {
        proxy_pass http://booltox_backend/health;
        access_log off;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2)$ {
        proxy_pass http://booltox_backend;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **启用配置并重启 Nginx**

```bash
sudo ln -s /etc/nginx/sites-available/booltox /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **配置 SSL（使用 Let's Encrypt）**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
sudo systemctl reload nginx
```

---

## Docker 部署

### 使用 Docker Compose（推荐）

1. **准备文件**

```bash
cd packages/server
cp .env.example .env
# 编辑 .env 配置生产环境变量
```

2. **启动所有服务**

```bash
# 后台运行
docker-compose up -d

# 查看日志
docker-compose logs -f

# 仅查看 API 日志
docker-compose logs -f api
```

3. **运行数据库迁移**

```bash
docker-compose exec api sh -c "cd /app/packages/server && npx prisma migrate deploy"
```

4. **管理服务**

```bash
# 停止服务
docker-compose stop

# 重启服务
docker-compose restart

# 删除所有容器和卷
docker-compose down -v
```

### 使用 Docker 单独部署

1. **构建镜像**

```bash
# 在项目根目录
docker build -f packages/server/Dockerfile -t booltox-api:latest .
```

2. **运行容器**

```bash
docker run -d \
  --name booltox-api \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL="postgresql://user:pass@host:5432/db" \
  -e CLIENT_API_TOKEN="your-token" \
  --restart unless-stopped \
  booltox-api:latest
```

### 生产环境 Docker 配置

使用生产配置文件：

```bash
# 创建 docker-compose.prod.yml
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    restart: always
    environment:
      NODE_ENV: production
      LOG_PRETTY: "false"
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  postgres:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

---

## 数据库迁移

### 开发环境

```bash
# 创建新迁移
pnpm prisma:migrate dev --name migration_name

# 重置数据库
pnpm prisma:migrate:reset
```

### 生产环境

```bash
# 应用迁移（不生成新的）
pnpm prisma:migrate:deploy

# 或使用 Docker
docker-compose exec api sh -c "cd /app/packages/server && npx prisma migrate deploy"
```

### 回滚迁移

Prisma 不支持自动回滚，需要手动处理：

1. **备份数据库**

```bash
pg_dump -U booltox -d booltox > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **手动编写回滚 SQL**

3. **应用回滚**

```bash
psql -U booltox -d booltox < rollback.sql
```

---

## 环境变量配置

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |
| `DATABASE_URL` | 数据库连接 | `postgresql://...` |
| `CLIENT_API_TOKEN` | 客户端令牌 | 32+ 字符 |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `GITHUB_TOKEN` | GitHub 访问令牌 | - |
| `CORS_ORIGIN` | 允许的源 | `*` |
| `LOG_LEVEL` | 日志级别 | `info` |
| `SYNC_ENABLED` | 启用同步 | `true` |

详细配置请参考 [`.env.example`](.env.example)

---

## 性能调优

### 数据库优化

1. **连接池配置**

```env
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public&connection_limit=20&pool_timeout=20"
```

2. **PostgreSQL 优化**

编辑 `postgresql.conf`:

```conf
# 连接设置
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB

# 查询优化
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL 设置
wal_buffers = 16MB
checkpoint_completion_target = 0.9

# 日志
log_min_duration_statement = 1000
```

### Node.js 优化

1. **启用集群模式**（使用 PM2）

```bash
pm2 start dist/main.js -i max --name booltox-api
```

2. **内存限制**

```bash
node --max-old-space-size=1024 dist/main.js
```

### 缓存策略

1. **使用 Redis（可选）**

```bash
# 安装 Redis
sudo apt install redis-server

# 启动 Redis
sudo systemctl start redis
```

2. **配置缓存中间件**（需要额外开发）

### Nginx 优化

```nginx
# 开启 Gzip
gzip on;
gzip_vary on;
gzip_types text/plain text/css application/json application/javascript;

# 连接优化
keepalive_timeout 65;
keepalive_requests 100;

# 缓冲区
client_body_buffer_size 128k;
client_max_body_size 10m;
```

---

## 故障排查

### 常见问题

#### 1. 无法连接数据库

**症状**: `Error: P1001: Can't reach database server`

**解决方案**:
- 检查 PostgreSQL 是否运行: `sudo systemctl status postgresql`
- 验证 DATABASE_URL 配置
- 检查防火墙规则
- 确认数据库用户权限

```bash
# 测试数据库连接
psql postgresql://booltox:password@localhost:5432/booltox
```

#### 2. 端口已被占用

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

**解决方案**:

```bash
# 查找占用端口的进程
lsof -i :3000
# 或
netstat -tulpn | grep :3000

# 杀死进程
kill -9 <PID>
```

#### 3. Prisma Client 错误

**症状**: `PrismaClient is unable to be run in the browser`

**解决方案**:

```bash
# 重新生成 Prisma Client
pnpm prisma:generate
pnpm build
```

#### 4. GitHub API 限流

**症状**: `API rate limit exceeded`

**解决方案**:
- 确保配置了 GITHUB_TOKEN
- 减少同步频率（SYNC_INTERVAL）
- 使用缓存减少 API 调用

#### 5. 内存溢出

**症状**: `JavaScript heap out of memory`

**解决方案**:

```bash
# 增加内存限制
NODE_OPTIONS="--max-old-space-size=4096" pnpm start
```

### 日志查看

```bash
# PM2 日志
pm2 logs booltox-api

# systemd 日志
sudo journalctl -u booltox-api -f

# Docker 日志
docker-compose logs -f api

# Nginx 日志
tail -f /var/log/nginx/booltox-error.log
```

### 健康检查

```bash
# 检查 API 健康状态
curl http://localhost:3000/health

# 检查数据库连接
curl http://localhost:3000/api/modules | jq
```

---

## 安全建议

### 1. 环境变量安全

- ✅ 使用强密码（32+ 字符）
- ✅ 定期轮换密钥
- ✅ 不要提交 `.env` 到版本控制
- ✅ 使用密钥管理服务（AWS Secrets Manager, HashiCorp Vault）

### 2. 数据库安全

```sql
-- 限制数据库用户权限
REVOKE ALL ON DATABASE booltox FROM PUBLIC;
GRANT CONNECT ON DATABASE booltox TO booltox;
GRANT ALL ON ALL TABLES IN SCHEMA public TO booltox;

-- 启用 SSL 连接
ALTER SYSTEM SET ssl = on;
```

### 3. API 安全

- ✅ 启用 HTTPS（SSL/TLS）
- ✅ 配置 CORS 白名单
- ✅ 实施速率限制
- ✅ 使用 API 密钥认证
- ✅ 定期更新依赖

```bash
# 检查依赖漏洞
pnpm audit
pnpm audit fix
```

### 4. 防火墙配置

```bash
# UFW 配置示例
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 5. 日志和监控

- ✅ 启用访问日志
- ✅ 监控错误率
- ✅ 设置告警阈值
- ✅ 定期审查日志

---

## 备份和恢复

### 数据库备份

```bash
# 手动备份
pg_dump -U booltox booltox > backup_$(date +%Y%m%d).sql

# 定时备份（crontab）
0 2 * * * /usr/bin/pg_dump -U booltox booltox > /backups/booltox_$(date +\%Y\%m\%d).sql
```

### 数据库恢复

```bash
# 恢复数据库
psql -U booltox booltox < backup_20250104.sql
```

### 自动化备份脚本

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
RETENTION_DAYS=7
DB_NAME="booltox"
DB_USER="booltox"

# 创建备份
pg_dump -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# 删除旧备份
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $(date)"
```

---

## 更新和升级

### 应用更新

```bash
# 1. 备份数据库
pg_dump -U booltox booltox > backup_before_update.sql

# 2. 拉取最新代码
git pull origin main

# 3. 安装依赖
pnpm install

# 4. 运行迁移
pnpm prisma:migrate:deploy

# 5. 构建应用
pnpm build

# 6. 重启服务
pm2 restart booltox-api
# 或
sudo systemctl restart booltox-api
```

### 零停机部署

使用 PM2 集群模式：

```bash
pm2 reload booltox-api
```

---

## 监控和维护

### 性能监控

```bash
# PM2 监控
pm2 monit

# 系统资源
htop
iotop
```

### 健康检查脚本

```bash
#!/bin/bash
# health_check.sh

HEALTH_URL="http://localhost:3000/health"
MAX_RETRIES=3

for i in $(seq 1 $MAX_RETRIES); do
  if curl -f $HEALTH_URL > /dev/null 2>&1; then
    echo "Health check passed"
    exit 0
  fi
  sleep 5
done

echo "Health check failed after $MAX_RETRIES attempts"
# 发送告警或重启服务
exit 1
```

---

## 附录

### 端口列表

| 服务 | 端口 | 协议 |
|------|------|------|
| API Server | 3000 | HTTP |
| PostgreSQL | 5432 | TCP |
| PgAdmin | 5050 | HTTP |
| Nginx | 80/443 | HTTP/HTTPS |

### 有用的命令

```bash
# 查看进程
ps aux | grep node

# 查看端口
netstat -tulpn | grep LISTEN

# 查看磁盘空间
df -h

# 查看内存使用
free -h

# 查看数据库大小
psql -U booltox -c "SELECT pg_size_pretty(pg_database_size('booltox'));"
```

---

## 支持和联系

如有问题，请：
1. 查看 [故障排查](#故障排查) 部分
2. 查看 [GitHub Issues](https://github.com/ByteTrue/BoolTox/issues)
3. 查看 [操作手册](./OPERATIONS.md)

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-04  
**维护者**: BoolTox Team