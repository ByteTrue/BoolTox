# 生产环境日志系统

## 概述

BoolTox 使用 `electron-log` 实现持久化日志记录,支持自动归档和分级管理。

## 日志位置

### Windows
```
%APPDATA%\Roaming\BoolTox\logs\main.log
```
完整路径示例: `C:\Users\YourName\AppData\Roaming\BoolTox\logs\main.log`

### macOS
```
~/Library/Application Support/BoolTox/logs/main.log
```

### Linux
```
~/.config/BoolTox/logs/main.log
```

## 日志级别

- **开发环境**: DEBUG - 记录所有详细信息
- **生产环境**: INFO - 仅记录重要信息和错误

## 日志格式

```
[2025-11-23 13:30:45.123] [INFO] 日志内容
[年-月-日 时:分:秒.毫秒] [级别] 消息
```

## 日志归档

- 单个日志文件最大: 10MB
- 超过大小自动归档到 `logs/archive/` 目录
- 归档文件命名: `main-2025-11-23T13-30-45.log`

## 在应用中查看日志

### 方法 1: 设置页面

1. 打开 BoolTox 应用
2. 进入"设置"页面
3. 在"日志管理"部分:
   - 点击"获取日志路径"查看日志文件位置
   - 点击"打开日志文件夹"直接打开日志目录

### 方法 2: 手动访问

**Windows 快速访问:**
1. 按 `Win + R` 打开运行对话框
2. 输入: `%APPDATA%\BoolTox\logs`
3. 按回车

**macOS 快速访问:**
```bash
open ~/Library/Application\ Support/BoolTox/logs/
```

**Linux 快速访问:**
```bash
xdg-open ~/.config/BoolTox/logs/
```

## 代码中使用日志

### 主进程 (Electron)

```typescript
import { createLogger } from './utils/logger.js';

const logger = createLogger('MyModule');

logger.info('应用启动');
logger.warn('警告信息');
logger.error('错误信息', error);
logger.debug('调试信息');
```

### 渲染进程

渲染进程的 `console.log/warn/error` 会自动记录到主进程日志文件中。

```typescript
console.log('普通日志');
console.warn('警告');
console.error('错误', error);
```

## 日志配置

配置文件: `electron/utils/logger.ts`

可配置项:
- 日志级别
- 文件大小限制
- 归档策略
- 日志格式

## 常见问题排查

### 1. 找不到日志文件

确认应用是否正确启动。首次启动会自动创建日志目录。

### 2. 日志文件过大

日志会自动归档,检查 `logs/archive/` 目录中的历史日志。

### 3. 日志内容不完整

- 检查日志级别设置
- 开发环境使用 DEBUG 级别
- 生产环境使用 INFO 级别

## 调试技巧

### 实时查看日志 (Windows)

使用 PowerShell 实时监控日志:
```powershell
Get-Content "$env:APPDATA\BoolTox\logs\main.log" -Wait -Tail 50
```

### 实时查看日志 (macOS/Linux)

```bash
tail -f ~/Library/Application\ Support/BoolTox/logs/main.log
```

### 搜索特定错误

```bash
# Windows (PowerShell)
Select-String -Path "$env:APPDATA\BoolTox\logs\main.log" -Pattern "ERROR"

# macOS/Linux
grep "ERROR" ~/Library/Application\ Support/BoolTox/logs/main.log
```

## 支持与反馈

如遇到问题,请提供以下信息:
1. 完整的日志文件 (`main.log`)
2. 系统信息 (操作系统版本)
3. BoolTox 版本号
4. 问题复现步骤
