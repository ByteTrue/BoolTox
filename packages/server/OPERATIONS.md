# BoolTox 后台服务运维手册

## 📋 目录

- [日常运维操作](#日常运维操作)
- [监控和告警](#监控和告警)
- [备份和恢复](#备份和恢复)
- [日志管理](#日志管理)
- [故障排查](#故障排查)
- [性能优化](#性能优化)
- [安全维护](#安全维护)
- [数据库维护](#数据库维护)
- [应急响应](#应急响应)

---

## 日常运维操作

### 服务管理

#### 使用 PM2

```bash
# 查看服务状态
pm2 status

# 启动服务
pm2 start dist/main.js --name booltox-api

# 停止服务
pm2 stop booltox-api

# 重启服务
pm2 restart booltox-api

# 重载服务（零停机）
pm2 reload booltox-api

# 删除服务
pm2 delete booltox-api

# 查看日志
pm2 logs booltox-api

# 查看实时监控
pm2 monit
```

#### 使用 systemd

```bash
# 查看服务状态
sudo systemctl status booltox-api

# 启动服务
sudo systemctl start booltox-api

# 停止服务
sudo systemctl stop booltox-api

# 重启服务
sudo systemctl restart booltox-api

# 重新加载配置
sudo systemctl reload booltox-api

# 启用开机自启
sudo systemctl enable booltox-api

# 禁用开机自启
sudo systemctl disable booltox-api

# 查看日志
sudo journalctl -u booltox-api -f
```

#### 使用 Docker Compose

```bash
# 查看服务状态
docker-compose ps

# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose stop

# 重启服务
docker-compose restart api

# 查看日志
docker-compose logs -f api

# 进入容器
docker-compose exec api sh

# 重建并启动
docker-compose up -d --build
```

### 健康检查

```bash
# API 健康状态
curl http://localhost:3000/health

# 详细健康检查
curl http://localhost:3000/health | jq

# 数据库连接测试
psql -U booltox -d booltox -c "SELECT 1;"

# 端口检查
netstat -tulpn | grep :3000

# 进程检查
ps aux | grep node
```

### 配置更新

1. **更新环境变量**

```bash
# 编辑配置
nano .env

# PM2: 重启服务
pm2 restart booltox-api

# systemd: 重启服务
sudo systemctl restart booltox-api

# Docker: 重建容器
docker-compose up -d --force-recreate
```

2. **验证配置**

```bash
# 检查服务是否正常启动
pm2 logs booltox-api --lines 50

# 测试 API
curl http://localhost:3000/api/modules
```

---

## 监控和告警

### 系统监控

#### 服务器资源

```bash
# CPU 使用率
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}'

# 内存使用
free -m

# 磁盘使用
df -h

# 网络连接
netstat -an | grep :3000 | wc -l
```

#### 应用监控

```bash
# PM2 监控
pm2 monit

# 进程资源使用
pm2 describe booltox-api

# Docker 资源使用
docker stats booltox-api
```

### 数据库监控

```bash
# 连接数
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'booltox';"

# 数据库大小
psql -U postgres -c "SELECT pg_size_pretty(pg_database_size('booltox'));"

# 表大小
psql -U booltox -d booltox -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
"

# 慢查询
psql -U booltox -d booltox -c "
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"

# 活跃连接
psql -U postgres -c "
SELECT pid, usename, application_name, client_addr, state, query
FROM pg_stat_activity
WHERE datname = 'booltox' AND state = 'active';
"
```

### 监控脚本

创建监控脚本 `monitor.sh`:

```bash
#!/bin/bash
# monitor.sh - BoolTox 系统监控脚本

LOG_FILE="/var/log/booltox/monitor.log"
ALERT_EMAIL="admin@example.com"

# 检查 API 健康
check_api_health() {
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
  if [ "$response" != "200" ]; then
    echo "$(date): API health check failed - HTTP $response" >> $LOG_FILE
    # 发送告警
    echo "BoolTox API is down!" | mail -s "Alert: API Down" $ALERT_EMAIL
    return 1
  fi
  return 0
}

# 检查数据库连接
check_database() {
  if ! psql -U booltox -d booltox -c "SELECT 1;" > /dev/null 2>&1; then
    echo "$(date): Database connection failed" >> $LOG_FILE
    echo "BoolTox Database is unreachable!" | mail -s "Alert: DB Down" $ALERT_EMAIL
    return 1
  fi
  return 0
}

# 检查磁盘空间
check_disk_space() {
  usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
  if [ "$usage" -gt 85 ]; then
    echo "$(date): Disk usage is at $usage%" >> $LOG_FILE
    echo "Warning: Disk usage is at $usage%" | mail -s "Alert: High Disk Usage" $ALERT_EMAIL
  fi
}

# 检查内存使用
check_memory() {
  mem_usage=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
  if [ "$mem_usage" -gt 90 ]; then
    echo "$(date): Memory usage is at $mem_usage%" >> $LOG_FILE
    echo "Warning: Memory usage is at $mem_usage%" | mail -s "Alert: High Memory Usage" $ALERT_EMAIL
  fi
}

# 执行检查
echo "$(date): Starting monitoring checks..." >> $LOG_FILE
check_api_health
check_database
check_disk_space
check_memory
echo "$(date): Monitoring checks completed." >> $LOG_FILE
```

设置定时任务：

```bash
# 编辑 crontab
crontab -e

# 每 5 分钟执行一次监控
*/5 * * * * /opt/booltox/monitor.sh
```

### 日志告警

使用 `logrotate` 和 `logwatch`:

```bash
# 安装
sudo apt install logwatch

# 配置每日日志摘要
sudo nano /etc/cron.daily/00logwatch

#!/bin/bash
/usr/sbin/logwatch --output mail --mailto admin@example.com --detail high
```

---

## 备份和恢复

### 自动备份脚本

创建 `backup.sh`:

```bash
#!/bin/bash
# backup.sh - 数据库自动备份脚本

# 配置
BACKUP_DIR="/var/backups/booltox"
DB_NAME="booltox"
DB_USER="booltox"
RETENTION_DAYS=7
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "$(date): Starting database backup..."
pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# 检查备份是否成功
if [ $? -eq 0 ]; then
  echo "$(date): Backup successful: $BACKUP_FILE"
  
  # 删除旧备份
  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete
  echo "$(date): Old backups cleaned up (retention: $RETENTION_DAYS days)"
else
  echo "$(date): Backup failed!"
  exit 1
fi

# 验证备份文件
if [ -f "$BACKUP_FILE" ]; then
  size=$(du -h "$BACKUP_FILE" | cut -f1)
  echo "$(date): Backup size: $size"
fi
```

设置定时备份：

```bash
# 每天凌晨 2 点执行备份
0 2 * * * /opt/booltox/backup.sh >> /var/log/booltox/backup.log 2>&1
```

### 手动备份

```bash
# 完整备份
pg_dump -U booltox booltox > backup_$(date +%Y%m%d).sql

# 压缩备份
pg_dump -U booltox booltox | gzip > backup_$(date +%Y%m%d).sql.gz

# 仅备份数据（不包含表结构）
pg_dump -U booltox --data-only booltox > data_backup_$(date +%Y%m%d).sql

# 仅备份结构（不包含数据）
pg_dump -U booltox --schema-only booltox > schema_backup_$(date +%Y%m%d).sql
```

### 数据恢复

```bash
# 恢复完整备份
psql -U booltox booltox < backup_20250104.sql

# 恢复压缩备份
gunzip -c backup_20250104.sql.gz | psql -U booltox booltox

# 恢复到新数据库
createdb -U postgres booltox_restore
psql -U postgres booltox_restore < backup_20250104.sql
```

### 时间点恢复（PITR）

配置 PostgreSQL 连续归档：

```conf
# postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'
```

---

## 日志管理

### 日志位置

```bash
# PM2 日志
~/.pm2/logs/

# systemd 日志
journalctl -u booltox-api

# Docker 日志
docker logs booltox-api

# Nginx 日志
/var/log/nginx/booltox-access.log
/var/log/nginx/booltox-error.log

# PostgreSQL 日志
/var/log/postgresql/postgresql-16-main.log
```

### 日志查看

```bash
# 实时查看日志
tail -f ~/.pm2/logs/booltox-api-out.log

# 查看最近 100 行
tail -n 100 ~/.pm2/logs/booltox-api-error.log

# 按时间过滤
journalctl -u booltox-api --since "2025-01-04 00:00:00"

# 按关键词搜索
grep "ERROR" ~/.pm2/logs/booltox-api-error.log

# 查看错误日志
pm2 logs booltox-api --err --lines 50
```

### 日志轮转

创建 logrotate 配置：

```bash
sudo nano /etc/logrotate.d/booltox
```

```conf
/var/log/booltox/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 booltox booltox
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 日志分析

```bash
# 统计错误数量
grep -c "ERROR" ~/.pm2/logs/booltox-api-error.log

# 按错误类型分组
awk '/ERROR/ {print $NF}' ~/.pm2/logs/booltox-api-error.log | sort | uniq -c | sort -rn

# 访问日志分析（如使用 Nginx）
cat /var/log/nginx/booltox-access.log | awk '{print $1}' | sort | uniq -c | sort -rn | head

# 响应时间分析
awk '{print $NF}' /var/log/nginx/booltox-access.log | \
  awk '{sum+=$1; count++} END {print "Average:", sum/count "ms"}'
```

---

## 故障排查

### 服务无响应

1. **检查进程**

```bash
ps aux | grep node
pm2 status
```

2. **检查端口**

```bash
netstat -tulpn | grep :3000
lsof -i :3000
```

3. **查看日志**

```bash
pm2 logs booltox-api --lines 100
```

4. **重启服务**

```bash
pm2 restart booltox-api
```

### 数据库连接问题

1. **验证数据库运行**

```bash
sudo systemctl status postgresql
```

2. **测试连接**

```bash
psql -U booltox -d booltox -c "SELECT 1;"
```

3. **检查连接数**

```bash
psql -U postgres -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'booltox';"
```

4. **重启数据库**

```bash
sudo systemctl restart postgresql
```

### 性能问题

1. **检查系统资源**

```bash
# CPU
top

# 内存
free -h

# 磁盘 I/O
iostat -x 1
```

2. **检查慢查询**

```bash
psql -U booltox -d booltox -c "
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
"
```

3. **优化数据库**

```bash
# 分析表
psql -U booltox -d booltox -c "ANALYZE;"

# 清理死行
psql -U booltox -d booltox -c "VACUUM FULL;"
```

### 内存泄漏

1. **监控内存使用**

```bash
pm2 describe booltox-api
```

2. **生成堆快照**

```bash
# 需要在应用中添加 heapdump 模块
node --inspect dist/main.js
```

3. **重启服务释放内存**

```bash
pm2 restart booltox-api
```

---

## 性能优化

### 数据库优化

#### 索引优化

```sql
-- 查看缺失的索引
SELECT
  schemaname,
  tablename,
  attname,
  n_distinct
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
ORDER BY n_distinct DESC;

-- 创建索引
CREATE INDEX idx_logs_created_at ON logs(created_at);
CREATE INDEX idx_modules_name ON modules(name);
```

#### 查询优化

```sql
-- 使用 EXPLAIN 分析查询
EXPLAIN ANALYZE SELECT * FROM modules WHERE name LIKE '%test%';

-- 查看慢查询
SELECT query, calls, mean_exec_time, max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC
LIMIT 10;
```

#### 连接池优化

```env
# .env 配置
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=10"
```

### 应用优化

#### 缓存配置

```typescript
// 示例：添加 Redis 缓存（需要额外实现）
// cache.service.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
});

export async function cacheGet(key: string) {
  return await redis.get(key);
}

export async function cacheSet(key: string, value: string, ttl: number = 3600) {
  return await redis.setex(key, ttl, value);
}
```

#### PM2 集群模式

```bash
# 启动多实例
pm2 start dist/main.js -i max --name booltox-api

# 或指定实例数
pm2 start dist/main.js -i 4 --name booltox-api
```

### 系统优化

#### 文件描述符限制

```bash
# 临时修改
ulimit -n 65536

# 永久修改
sudo nano /etc/security/limits.conf
```

```conf
* soft nofile 65536
* hard nofile 65536
```

#### TCP 优化

```bash
sudo nano /etc/sysctl.conf
```

```conf
# TCP 优化
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.tcp_max_syn_backlog = 8192
net.core.somaxconn = 1024
```

应用配置：

```bash
sudo sysctl -p
```

---

## 安全维护

### 定期安全检查

```bash
# 检查依赖漏洞
pnpm audit

# 修复漏洞
pnpm audit fix

# 更新依赖
pnpm update
```

### 密钥轮换

1. **生成新密钥**

```bash
openssl rand -base64 32
```

2. **更新环境变量**

```bash
nano .env
# 更新 CLIENT_API_TOKEN, JWT_SECRET 等
```

3. **重启服务**

```bash
pm2 restart booltox-api
```

### 访问日志审计

```bash
# 查看异常访问
grep "401\|403\|500" /var/log/nginx/booltox-access.log

# 统计访问 IP
awk '{print $1}' /var/log/nginx/booltox-access.log | sort | uniq -c | sort -rn | head

# 查看可疑请求
grep -E "(\.\.|script|eval)" /var/log/nginx/booltox-access.log
```

---

## 数据库维护

### 日常维护

```sql
-- 分析数据库
ANALYZE;

-- 清理死行
VACUUM;

-- 完全清理（需要停机维护）
VACUUM FULL;

-- 重建索引
REINDEX DATABASE booltox;
```

### 定期任务

创建维护脚本 `db_maintenance.sh`:

```bash
#!/bin/bash
# db_maintenance.sh - 数据库维护脚本

echo "$(date): Starting database maintenance..."

# 分析数据库
psql -U booltox -d booltox -c "ANALYZE;" >> /var/log/booltox/db_maintenance.log 2>&1

# 清理死行
psql -U booltox -d booltox -c "VACUUM;" >> /var/log/booltox/db_maintenance.log 2>&1

echo "$(date): Database maintenance completed."
```

设置定时任务：

```bash
# 每周日凌晨 3 点执行
0 3 * * 0 /opt/booltox/db_maintenance.sh
```

---

## 应急响应

### 服务宕机

1. **快速响应流程**

```bash
# 1. 检查服务状态
pm2 status

# 2. 查看错误日志
pm2 logs booltox-api --err --lines 50

# 3. 尝试重启
pm2 restart booltox-api

# 4. 如果无法启动，回滚
git log --oneline -5
git checkout <previous-commit>
pnpm build
pm2 restart booltox-api
```

2. **通知流程**

```bash
# 发送告警邮件
echo "BoolTox API is down! Investigating..." | \
  mail -s "URGENT: API Down" admin@example.com
```

### 数据库故障

1. **主从切换（如有配置）**

```bash
# 提升备库为主库
pg_ctl promote -D /var/lib/postgresql/14/standby
```

2. **数据恢复**

```bash
# 从最近的备份恢复
gunzip -c /var/backups/booltox/backup_latest.sql.gz | psql -U booltox booltox
```

### 数据丢失

1. **停止所有写操作**

```bash
pm2 stop booltox-api
```

2. **从备份恢复**

```bash
psql -U booltox booltox < /var/backups/booltox/backup_20250104.sql
```

3. **验证数据完整性**

```sql
SELECT count(*) FROM modules;
SELECT count(*) FROM releases;
```

---

## 维护检查清单

### 每日检查

- [ ] 检查服务运行状态
- [ ] 查看错误日志
- [ ] 检查磁盘空间
- [ ] 验证 API 健康状态
- [ ] 查看监控指标

### 每周检查

- [ ] 查看慢查询日志
- [ ] 检查数据库大小
- [ ] 清理旧日志
- [ ] 审查访问日志
- [ ] 更新文档

### 每月检查

- [ ] 数据库维护（VACUUM, ANALYZE）
- [ ] 检查依赖更新
- [ ] 审计安全日志
- [ ] 测试备份恢复
- [ ] 性能基准测试
- [ ] 密钥轮换（如需要）

### 季度检查

- [ ] 全面安全审计
- [ ] 容量规划评估
- [ ] 灾难恢复演练
- [ ] 文档更新
- [ ] 系统优化调整

---

## 常用命令速查

```bash
# 服务管理
pm2 status                    # 查看状态
pm2 restart booltox-api       # 重启服务
pm2 logs booltox-api          # 查看日志
pm2 monit                     # 实时监控

# 数据库
psql -U booltox booltox       # 连接数据库
pg_dump booltox > backup.sql  # 备份数据库
VACUUM;                       # 清理数据库

# 系统
df -h                         # 磁盘空间
free -m                       # 内存使用
top                           # 进程监控
netstat -tulpn                # 端口监听

# 日志
tail -f log.file              # 实时查看
grep "ERROR" log.file         # 搜索错误
journalctl -u service         # systemd 日志
```

---

## 联系和支持

遇到问题？
1. 查看 [故障排查](#故障排查) 部分
2. 参考 [部署文档](./DEPLOYMENT.md)
3. 提交 [GitHub Issue](https://github.com/ByteTrue/BoolTox/issues)

---

**文档版本**: 1.0.0  
**最后更新**: 2025-11-04  
**维护者**: BoolTox Team