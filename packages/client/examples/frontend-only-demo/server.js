#!/usr/bin/env node
/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 *
 * 简单的 HTTP 静态文件服务器 - 密码生成器
 * 工具完全独立运行，不依赖 BoolTox SDK
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 创建 Express 应用
const app = express();

// 静态文件服务（前端资源）
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// 根路径返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// 启动服务器
const PORT = process.env.PORT || 8003;
const HOST = process.env.HOST || '127.0.0.1';

app.listen(PORT, HOST, () => {
  console.log(`密码生成器运行在: http://${HOST}:${PORT}`);
});
