/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { Download, Loader2, RefreshCw, XCircle, CheckCircle2, Settings } from 'lucide-react';
import { useUpdate } from '@/contexts/update-context';

interface UpdateBannerProps {
  onNavigate?: (nav: string) => void;
}

export function UpdateBanner({ onNavigate }: UpdateBannerProps) {
  const {
    state,
    details,
    bannerDismissed,
    downloadUpdate,
    cancelDownload,
    dismissUpdate,
    retryCheck,
  } = useUpdate();

  const progressPercent = useMemo(() => {
    if (state.phase !== 'downloading' || !state.progress) return 0;
    if (typeof state.progress.percent === 'number') {
      return Math.round(state.progress.percent);
    }
    const { downloadedBytes, totalBytes } = state.progress;
    if (!totalBytes || totalBytes === 0) {
      return 0;
    }
    return Math.min(100, Math.round((downloadedBytes / totalBytes) * 100));
  }, [state]);

  if (bannerDismissed || state.phase === 'idle' || state.phase === 'checking') {
    return null;
  }

  const sizeLabel = details?.sizeBytes ? formatBytes(details.sizeBytes) : undefined;

  const handleGoToSettings = () => {
    onNavigate?.('settings');
  };

  return (
    <Paper sx={{ mb: 2, p: 2.5, borderRadius: 2 }}>
      {state.phase === 'available' && details ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Download size={16} />
              <Typography variant="subtitle2" color="primary" fontWeight={600}>
                发现新版本
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {details.version}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {details.notes
                ? truncateText(details.notes, 120)
                : '可立即下载安装最新版本以获取最新功能和修复。'}
              {sizeLabel ? ` · 安装包大小约 ${sizeLabel}` : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Settings size={16} />}
              onClick={handleGoToSettings}
              sx={{ borderRadius: 50 }}
            >
              前往更新
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={dismissUpdate}
              disabled={details.mandatory}
              sx={{ borderRadius: 50 }}
            >
              关闭
            </Button>
          </Box>
        </Box>
      ) : null}

      {state.phase === 'downloading' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <Loader2 size={18} className="animate-spin" />
            <Typography variant="body2" fontWeight={500}>
              正在下载更新包
            </Typography>
            {sizeLabel && (
              <Typography variant="caption" color="text.secondary">
                （约 {sizeLabel}）
              </Typography>
            )}
          </Box>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ borderRadius: 1, mb: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              {progressPercent}%
              {state.progress?.totalBytes && (
                <> · {formatBytes(state.progress.downloadedBytes)} / {formatBytes(state.progress.totalBytes)}</>
              )}
            </Typography>
            <Button variant="outlined" size="small" onClick={cancelDownload} sx={{ borderRadius: 50 }}>
              取消下载
            </Button>
          </Box>
        </Box>
      )}

      {state.phase === 'downloaded' && details ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <CheckCircle2 size={24} color="green" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                更新包已准备就绪
              </Typography>
              <Typography variant="caption" color="text.secondary">
                版本 {details.version} 下载完成，点击安装以完成更新。
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Settings size={16} />}
              onClick={handleGoToSettings}
              sx={{ borderRadius: 50 }}
            >
              前往安装
            </Button>
            <Button variant="outlined" size="small" onClick={dismissUpdate} sx={{ borderRadius: 50 }}>
              稍后再说
            </Button>
          </Box>
        </Box>
      ) : null}

      {state.phase === 'error' && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <XCircle size={24} color="red" />
            <Box>
              <Typography variant="body2" fontWeight={600}>
                更新遇到问题
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {state.error ?? '下载或安装过程中发生错误，请重试。'}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {details ? (
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshCw size={16} />}
                onClick={downloadUpdate}
                sx={{ borderRadius: 50 }}
              >
                重新下载
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshCw size={16} />}
                onClick={retryCheck}
                sx={{ borderRadius: 50 }}
              >
                重新检查
              </Button>
            )}
            <Button variant="outlined" size="small" onClick={dismissUpdate} sx={{ borderRadius: 50 }}>
              隐藏提示
            </Button>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

function truncateText(text: string, limit: number) {
  if (text.length <= limit) return text;
  return `${text.slice(0, limit)}…`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = bytes;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(value >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}
