/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo, useState, useEffect } from 'react';
import type { ElementType, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUpdate } from '@/contexts/update-context';
import { APP_VERSION } from '@/config/app-info';
import { LogManager } from './settings/log-manager';
import {
  Settings as SettingsIcon,
  Info,
  RefreshCw,
  Download,
  CheckCircle2,
  Loader2,
  Package,
  FileText,
  Sliders,
  Sun,
  Moon,
  Rocket,
  Minimize2,
} from 'lucide-react';
import { useTheme } from './theme-provider';

export function SettingsPanel() {
  const { theme, setThemeMode } = useTheme();
  const { state, details, retryCheck, downloadUpdate, installUpdate } = useUpdate();
  const [showNotes, setShowNotes] = useState(false);
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [isLoadingAutoLaunch, setIsLoadingAutoLaunch] = useState(false);
  const [closeToTray, setCloseToTray] = useState(true);
  const [isLoadingCloseToTray, setIsLoadingCloseToTray] = useState(false);

  // 加载开机启动状态
  useEffect(() => {
    if (window.appSettings) {
      window.appSettings
        .getAutoLaunch()
        .then(enabled => {
          setAutoLaunch(enabled);
        })
        .catch(err => {
          console.error('Failed to load auto launch status:', err);
        });
    }
  }, []);

  // 加载关闭到托盘状态
  useEffect(() => {
    if (window.appSettings) {
      window.appSettings
        .getCloseToTray()
        .then(enabled => {
          setCloseToTray(enabled);
        })
        .catch(err => {
          console.error('Failed to load close to tray status:', err);
        });
    }
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

  const primaryAction = useMemo(() => {
    switch (state.phase) {
      case 'available':
        return { label: '立即下载', icon: Download, handler: downloadUpdate, disabled: false, spinning: false } as const;
      case 'downloading':
        return { label: '下载中...', icon: Loader2, handler: undefined, disabled: true, spinning: true } as const;
      case 'downloaded':
        return { label: '安装更新', icon: CheckCircle2, handler: installUpdate, disabled: false, spinning: false } as const;
      case 'checking':
        return { label: '检查中...', icon: Loader2, handler: undefined, disabled: true, spinning: true } as const;
      case 'error':
        return { label: '重新检查', icon: RefreshCw, handler: retryCheck, disabled: false, spinning: false } as const;
      case 'idle':
      default:
        return { label: '检查更新', icon: RefreshCw, handler: retryCheck, disabled: false, spinning: false } as const;
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
        {/* 标题 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SettingsIcon size={28} />
          <Typography variant="h5" fontWeight="bold">
            设置
          </Typography>
        </Box>

        {/* 两列布局 */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* 左列：应用信息 */}
          <SettingCard title="应用信息" icon={Info}>
            <Stack spacing={1.5}>
              <SettingItem label="应用名称" value="BoolTox" />
              <SettingItem label="当前版本" value={APP_VERSION} />
            </Stack>
          </SettingCard>

          {/* 右列：偏好设置 */}
          <SettingCard title="偏好设置" icon={Sliders}>
            <Stack spacing={2}>
              {/* 主题切换 */}
              <SettingToggle
                label="主题模式"
                description={theme === 'dark' ? '深色' : '浅色'}
                icon={theme === 'dark' ? Moon : Sun}
                checked={theme === 'dark'}
                onChange={() => setThemeMode(theme === 'dark' ? 'light' : 'dark')}
              />

              {/* 开机启动 */}
              <SettingToggle
                label="开机启动"
                description={autoLaunch ? '已启用' : '未启用'}
                icon={Rocket}
                checked={autoLaunch}
                onChange={handleAutoLaunchToggle}
                disabled={isLoadingAutoLaunch}
              />

              {/* 关闭到托盘 */}
              <SettingToggle
                label="关闭到托盘"
                description={closeToTray ? '关闭窗口时最小化到托盘' : '关闭窗口时直接退出'}
                icon={Minimize2}
                checked={closeToTray}
                onChange={handleCloseToTrayToggle}
                disabled={isLoadingCloseToTray}
              />
            </Stack>
          </SettingCard>
        </Box>

        {/* 版本更新（独占一行） */}
        <SettingCard title="版本更新" icon={Package}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                  <Button variant="outlined" size="small" startIcon={<FileText size={16} />} onClick={() => setShowNotes(true)}>
                    更新详情
                  </Button>
                )}

                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PrimaryIcon size={16} className={primaryAction.spinning ? 'animate-spin' : ''} />}
                  onClick={handlePrimaryAction}
                  disabled={primaryAction.disabled}
                >
                  {primaryAction.label}
                </Button>
              </Box>
            </Box>

            {details && (
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
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

        {/* 日志管理（独占一行） */}
        <SettingCard title="日志管理" icon={FileText}>
          <LogManager />
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

function SettingCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
}) {
  return (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Icon size={18} />
        <Typography variant="subtitle1" fontWeight="bold">
          {title}
        </Typography>
      </Box>
      {children}
    </Paper>
  );
}

function SettingItem({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>
        {value}
      </Typography>
    </Box>
  );
}

function SettingToggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  description: string;
  icon: ElementType;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon size={16} />
        <Box>
          <Typography variant="body2" fontWeight={500}>
            {label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {description}
          </Typography>
        </Box>
      </Box>
      <Switch checked={checked} onChange={onChange} disabled={disabled} size="small" />
    </Box>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
