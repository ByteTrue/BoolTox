/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * DeveloperSettings - 开发者模式设置页面
 * 使用新的 SettingCard 组件重构
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { alpha, useTheme } from '@mui/material/styles';
import { Trash2, FileText, RefreshCw, Terminal, AlertTriangle } from 'lucide-react';
import { SettingCard, SettingAction, SettingGroup, SettingInfo } from '@/components/settings';

export function DeveloperSettings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
    window.location.reload();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* ============================================================
            快速操作
            ============================================================ */}
        <SettingCard title="快速操作" icon={Terminal}>
          <Stack spacing={1.5}>
            <SettingAction
              label="打开日志文件夹"
              description="查看应用日志，用于问题排查"
              icon={<FileText size={20} />}
              onClick={handleOpenLogs}
            />
            <SettingAction
              label="清空缓存"
              description="删除临时文件和下载缓存"
              icon={<Trash2 size={20} />}
              onClick={handleClearCache}
              variant="danger"
            />
            <SettingAction
              label="重新加载工具"
              description="刷新工具列表（重启应用）"
              icon={<RefreshCw size={20} />}
              onClick={handleReloadTools}
            />
          </Stack>
        </SettingCard>

        {/* ============================================================
            环境信息
            ============================================================ */}
        <SettingCard title="环境信息" icon={Terminal}>
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              fontFamily: 'monospace',
              bgcolor: isDark ? alpha('#000', 0.2) : alpha('#000', 0.02),
            }}
          >
            <SettingGroup>
              <SettingInfo
                label="环境模式"
                value={import.meta.env.MODE === 'development' ? '开发环境' : '生产环境'}
              />
              <SettingInfo
                label="Electron"
                value={typeof window !== 'undefined' && window.electron ? '已启用' : '未启用'}
              />
            </SettingGroup>
          </Paper>
        </SettingCard>

        {/* ============================================================
            警告提示
            ============================================================ */}
        <Alert severity="warning" icon={<AlertTriangle size={20} />} sx={{ borderRadius: 2 }}>
          <Typography variant="body2">
            开发者模式仅供调试使用。修改配置可能影响应用稳定性，请谨慎操作。
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
}
