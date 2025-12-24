/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import { FileText, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * 日志管理组件
 * 用于设置页面,提供日志查看和管理功能
 */
interface LogManagerProps {
  showHeader?: boolean;
}

export function LogManager({ showHeader = true }: LogManagerProps) {
  const [logPath, setLogPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 获取日志路径
  const getLogPath = async () => {
    try {
      setLoading(true);
      const path = (await window.ipc.invoke('logger:get-log-path')) as string;
      setLogPath(path);
      setMessage({ type: 'success', text: '日志路径获取成功' });
    } catch (error) {
      setMessage({ type: 'error', text: '获取日志路径失败: ' + String(error) });
    } finally {
      setLoading(false);
    }
  };

  // 打开日志文件夹
  const openLogFolder = async () => {
    try {
      setLoading(true);
      await window.ipc.invoke('logger:open-log-folder');
      setMessage({ type: 'success', text: '日志文件夹已打开' });
    } catch (error) {
      setMessage({ type: 'error', text: '打开日志文件夹失败: ' + String(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3}>
      {showHeader && (
        <Box>
          <Typography variant="h6" fontWeight={700}>
            日志管理
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            查看和管理应用日志文件
          </Typography>
        </Box>
      )}

      {/* 消息提示 */}
      {message && (
        <Alert
          severity={message.type}
          icon={message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      {/* 日志路径显示 */}
      {logPath && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} alignItems="flex-start">
            <FileText size={20} color="var(--mui-palette-primary-main)" />
            <Box flex={1} minWidth={0}>
              <Typography variant="body2" fontWeight={600}>
                日志文件路径
              </Typography>
              <Typography
                variant="caption"
                component="code"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all',
                  color: 'text.secondary',
                }}
              >
                {logPath}
              </Typography>
            </Box>
          </Stack>
        </Paper>
      )}

      {/* 操作按钮 */}
      <Stack direction="row" spacing={2} flexWrap="wrap">
        <Button
          onClick={getLogPath}
          disabled={loading}
          variant="outlined"
          startIcon={<FileText size={16} />}
        >
          {loading ? '获取中...' : '获取日志路径'}
        </Button>

        <Button
          onClick={openLogFolder}
          disabled={loading}
          variant="contained"
          startIcon={<FolderOpen size={16} />}
        >
          {loading ? '打开中...' : '打开日志文件夹'}
        </Button>
      </Stack>

      {/* 说明信息 */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
          日志说明
        </Typography>
        <List dense disablePadding>
          <ListItem disablePadding>
            <Typography variant="caption" color="text.secondary">
              • 日志文件自动按日期归档,单个文件最大 10MB
            </Typography>
          </ListItem>
          <ListItem disablePadding>
            <Typography variant="caption" color="text.secondary">
              • 开发环境日志级别: DEBUG,记录所有信息
            </Typography>
          </ListItem>
          <ListItem disablePadding>
            <Typography variant="caption" color="text.secondary">
              • 生产环境日志级别: INFO,仅记录重要信息
            </Typography>
          </ListItem>
          <ListItem disablePadding sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              • 日志文件位置:
            </Typography>
          </ListItem>
          <Box sx={{ pl: 2 }}>
            <ListItem disablePadding>
              <Typography variant="caption" color="text.secondary">
                - Windows: %APPDATA%/Roaming/BoolTox/logs/
              </Typography>
            </ListItem>
            <ListItem disablePadding>
              <Typography variant="caption" color="text.secondary">
                - macOS: ~/Library/Application Support/BoolTox/logs/
              </Typography>
            </ListItem>
            <ListItem disablePadding>
              <Typography variant="caption" color="text.secondary">
                - Linux: ~/.config/BoolTox/logs/
              </Typography>
            </ListItem>
          </Box>
        </List>
      </Paper>
    </Stack>
  );
}
