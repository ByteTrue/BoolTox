/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * GeneralSettings - 通用设置页面
 * 使用新的 SettingCard 和 SettingToggle 组件重构
 */

import { useMemo, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUpdate } from '@/contexts/update-context';
import { APP_VERSION } from '@/config/app-info';
import { useTheme } from '@/components/theme-provider';
import { formatBytes } from '@/utils/format';
import { SettingCard, SettingToggle, SettingInfo, SettingGroup } from '@/components/settings';
import { LogManager } from '@/components/settings/log-manager';
import {
  Info,
  Palette,
  Package,
  FileText,
  Sun,
  Moon,
  Rocket,
  Minimize2,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export function GeneralSettings() {
  const { theme, setThemeMode } = useTheme();
  const { state, details, retryCheck, downloadUpdate, installUpdate } = useUpdate();
  const [showNotes, setShowNotes] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isLoadingAutoLaunch, setIsLoadingAutoLaunch] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);
  const [isLoadingCloseToTray, setIsLoadingCloseToTray] = useState(false);

  // 加载应用设置
  useEffect(() => {
    if (!window.appSettings) return;
    Promise.all([window.appSettings.getAutoLaunch(), window.appSettings.getCloseToTray()])
      .then(([autoLaunchEnabled, closeToTrayEnabled]) => {
        setAutoLaunch(autoLaunchEnabled);
        setCloseToTray(closeToTrayEnabled);
      })
      .catch(err => {
        console.error('Failed to load app settings:', err);
      });
  }, []);

  // 切换开机启动
  const handleAutoLaunchToggle = async () => {
    if (!window.appSettings || isLoadingAutoLaunch) return;

    setIsLoadingAutoLaunch(true);
    try {
      const newState = !autoLaunch;
      const result = await window.appSettings.setAutoLaunch(newState);
      if (result.success) {
        setAutoLaunch(newState);
      } else {
        console.error('Failed to set auto launch:', result.error);
      }
    } catch (error) {
      console.error('Failed to toggle auto launch:', error);
    } finally {
      setIsLoadingAutoLaunch(false);
    }
  };

  // 切换关闭到托盘
  const handleCloseToTrayToggle = async () => {
    if (!window.appSettings || isLoadingCloseToTray) return;

    setIsLoadingCloseToTray(true);
    try {
      const newState = !closeToTray;
      const result = await window.appSettings.setCloseToTray(newState);
      if (result.success) {
        setCloseToTray(newState);
      } else {
        console.error('Failed to set close to tray:', result.error);
      }
    } catch (error) {
      console.error('Failed to toggle close to tray:', error);
    } finally {
      setIsLoadingCloseToTray(false);
    }
  };

  // 更新操作
  const primaryAction = useMemo(() => {
    switch (state.phase) {
      case 'available':
        return {
          label: '立即下载',
          icon: Download,
          handler: downloadUpdate,
          disabled: false,
          spinning: false,
        } as const;
      case 'downloading':
        return {
          label: '下载中...',
          icon: Loader2,
          handler: undefined,
          disabled: true,
          spinning: true,
        } as const;
      case 'downloaded':
        return {
          label: '安装更新',
          icon: CheckCircle2,
          handler: installUpdate,
          disabled: false,
          spinning: false,
        } as const;
      case 'checking':
        return {
          label: '检查中...',
          icon: Loader2,
          handler: undefined,
          disabled: true,
          spinning: true,
        } as const;
      case 'error':
        return {
          label: '重新检查',
          icon: RefreshCw,
          handler: retryCheck,
          disabled: false,
          spinning: false,
        } as const;
      case 'idle':
      default:
        return {
          label: '检查更新',
          icon: RefreshCw,
          handler: retryCheck,
          disabled: false,
          spinning: false,
        } as const;
    }
  }, [state.phase, downloadUpdate, installUpdate, retryCheck]);

  const PrimaryIcon = primaryAction.icon;

  const handlePrimaryAction = async () => {
    if (!primaryAction.handler || primaryAction.disabled) return;
    await primaryAction.handler();
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Stack spacing={3}>
        {/* ============================================================
            第一行：应用信息 + 外观设置
            ============================================================ */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* 应用信息 */}
          <SettingCard title="应用信息" icon={Info}>
            <SettingGroup>
              <SettingInfo label="应用名称" value="BoolTox" />
              <SettingInfo label="当前版本" value={APP_VERSION} />
            </SettingGroup>
          </SettingCard>

          {/* 外观设置 */}
          <SettingCard title="外观" icon={Palette}>
            <SettingGroup>
              <SettingToggle
                label="深色模式"
                description={theme === 'dark' ? '已启用' : '已禁用'}
                icon={theme === 'dark' ? Moon : Sun}
                checked={theme === 'dark'}
                onChange={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
              />
            </SettingGroup>
          </SettingCard>
        </Box>

        {/* ============================================================
            第二行：行为设置
            ============================================================ */}
        <SettingCard title="行为" icon={Rocket}>
          <SettingGroup>
            <SettingToggle
              label="开机启动"
              description={autoLaunch ? '系统启动时自动运行' : '已禁用'}
              icon={Rocket}
              checked={autoLaunch}
              onChange={handleAutoLaunchToggle}
              loading={isLoadingAutoLaunch}
            />
            <SettingToggle
              label="关闭到托盘"
              description={closeToTray ? '关闭窗口时最小化到系统托盘' : '关闭窗口时直接退出'}
              icon={Minimize2}
              checked={closeToTray}
              onChange={handleCloseToTrayToggle}
              loading={isLoadingCloseToTray}
            />
          </SettingGroup>
        </SettingCard>

        {/* ============================================================
            第三行：版本更新
            ============================================================ */}
        <SettingCard title="版本更新" icon={Package}>
          <Stack spacing={2}>
            {/* 更新状态 */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight={500}>
                  更新状态
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {state.phase === 'idle' && '当前版本已是最新'}
                  {state.phase === 'checking' && '正在检查更新...'}
                  {state.phase === 'available' && details && `发现新版本 ${details.version}`}
                  {state.phase === 'downloading' && '正在下载更新包...'}
                  {state.phase === 'downloaded' && '更新包已就绪'}
                  {state.phase === 'error' && `检查失败: ${state.error}`}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {(state.phase === 'checking' || state.phase === 'downloading') && (
                  <CircularProgress size={20} />
                )}
                {state.phase === 'idle' && <CheckCircle2 size={20} color="green" />}
                {state.phase === 'available' && <Download size={20} color="blue" />}
                {state.phase === 'downloaded' && <CheckCircle2 size={20} color="green" />}

                {details && (
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<FileText size={16} />}
                    onClick={() => setShowNotes(true)}
                  >
                    更新详情
                  </Button>
                )}

                <Button
                  variant="contained"
                  size="small"
                  startIcon={
                    <Box
                      component={PrimaryIcon}
                      size={16}
                      sx={
                        primaryAction.spinning
                          ? {
                              animation: 'spin 1s linear infinite',
                              '@keyframes spin': {
                                '0%': { transform: 'rotate(0deg)' },
                                '100%': { transform: 'rotate(360deg)' },
                              },
                            }
                          : undefined
                      }
                    />
                  }
                  onClick={handlePrimaryAction}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              </Box>
            </Box>

            {/* 版本详情 */}
            {details && (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500} sx={{ mb: 0.5 }}>
                      版本 {details.version}
                    </Typography>
                    {details.notes && (
                      <Typography variant="caption" color="text.secondary">
                        {details.notes}
                      </Typography>
                    )}
                  </Box>
                  {details.sizeBytes && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        安装包大小
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>
                        {formatBytes(details.sizeBytes)}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Paper>
            )}
          </Stack>
        </SettingCard>

        {/* ============================================================
            第四行：日志管理
            ============================================================ */}
        <SettingCard title="日志" icon={FileText}>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              查看和管理应用日志文件，用于问题排查
            </Typography>
            <LogManager showHeader={false} />
          </Stack>
        </SettingCard>
      </Stack>

      {/* 更新说明对话框 */}
      <Dialog open={showNotes} onClose={() => setShowNotes(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{details?.name || `版本 ${details?.version || ''} 更新说明`}</DialogTitle>
        <DialogContent>
          {details?.date && (
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              发布于 {new Date(details.date).toLocaleDateString()}
            </Typography>
          )}
          <Box sx={{ '& p': { my: 1 }, '& ul': { pl: 2 }, '& li': { my: 0.5 } }}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {details?.notes || '暂无更新说明'}
            </ReactMarkdown>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNotes(false)}>关闭</Button>
          {state.phase === 'available' && (
            <Button
              variant="contained"
              onClick={() => {
                setShowNotes(false);
                downloadUpdate();
              }}
            >
              立即更新
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
