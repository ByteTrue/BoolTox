/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 开发者模式设置页面
 * 包含调试工具和开发配置
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import { Trash2, FileText, RefreshCw } from 'lucide-react';

export function DeveloperSettings() {
  const handleOpenLogs = async () => {
    await window.ipc?.invoke('logger:open-log-folder');
    window.toast?.success('日志文件夹已打开');
  };

  const handleClearCache = async () => {
    if (!confirm('确定要清空所有缓存吗？这将删除下载的临时文件。')) return;

    // TODO: 调用清理缓存的 IPC
    window.toast?.success('缓存已清空');
  };

  const handleReloadTools = async () => {
    // 刷新页面重新加载工具
    window.location.reload();
  };

  const actionButtons = [
    {
      icon: <FileText size={20} />,
      label: '打开日志文件夹',
      description: '查看应用日志，用于问题排查',
      onClick: handleOpenLogs,
      variant: 'default' as const,
    },
    {
      icon: <Trash2 size={20} />,
      label: '清空缓存',
      description: '删除临时文件和下载缓存',
      onClick: handleClearCache,
      variant: 'danger' as const,
    },
    {
      icon: <RefreshCw size={20} />,
      label: '重新加载工具',
      description: '刷新工具列表（重启应用）',
      onClick: handleReloadTools,
      variant: 'default' as const,
    },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {/* 页面标题 */}
      <Box>
        <Typography variant="h5" fontWeight={700}>
          开发者模式
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          调试工具和开发配置
        </Typography>
      </Box>

      {/* 快速操作 */}
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          快速操作
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {actionButtons.map(action => (
            <Button
              key={action.label}
              onClick={action.onClick}
              variant="outlined"
              color={action.variant === 'danger' ? 'error' : 'inherit'}
              sx={{
                justifyContent: 'flex-start',
                textAlign: 'left',
                p: 2,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': {
                  transform: 'scale(1.01)',
                },
                transition: 'transform 0.15s',
              }}
            >
              <Box
                sx={{
                  mr: 2,
                  color: action.variant === 'danger' ? 'error.main' : 'primary.main',
                }}
              >
                {action.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color={action.variant === 'danger' ? 'error.main' : 'text.primary'}
                >
                  {action.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {action.description}
                </Typography>
              </Box>
            </Button>
          ))}
        </Box>
      </Box>

      {/* 环境信息 */}
      <Box component="section" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          环境信息
        </Typography>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            borderRadius: 2,
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              环境模式:
            </Typography>
            <Typography variant="body2" color="success.main">
              {import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Electron:
            </Typography>
            <Typography variant="body2">
              {typeof window !== 'undefined' && window.electron ? '已启用' : '未启用'}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* 提示 */}
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        开发者模式仅供调试使用。修改配置可能影响应用稳定性，请谨慎操作。
      </Alert>
    </Box>
  );
}
