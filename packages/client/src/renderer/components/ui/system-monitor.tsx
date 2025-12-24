/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Fade from '@mui/material/Fade';
import { useSystemInfo, formatUptime, getOSIcon } from '@/hooks/use-system-info';
import { ProgressBar } from './progress-bar';
import { SkeletonLoader } from './skeleton-loader';

/**
 * 系统监控面板组件
 * 优化布局：顶部显示系统基本信息（OS、CPU型号、内存总量、运行时长），底部仅显示磁盘使用量
 */
export function SystemMonitor() {
  const { systemInfo, isLoading, error } = useSystemInfo();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SkeletonLoader type="list-item" count={3} />
      </Box>
    );
  }

  if (error || !systemInfo) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => window.location.reload()}>
            刷新页面
          </Button>
        }
        sx={{ borderRadius: 2 }}
      >
        {error || '无法获取系统信息'}
      </Alert>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = -1;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatCpuModel = (model: string): string => {
    let simplified = model
      .replace(/\(R\)/gi, '')
      .replace(/\(TM\)/gi, '')
      .replace(/\s+CPU/gi, '')
      .replace(/\s+Processor/gi, '')
      .replace(/\s+@.*$/g, '')
      .trim();

    if (simplified.length > 25) {
      const parts = simplified.split(/\s+/);
      if (parts.length > 2) {
        simplified = parts.slice(0, 3).join(' ');
      }
    }

    return simplified;
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* 系统基本信息卡片 */}
      <Fade in timeout={300}>
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
            {/* 操作系统 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.75rem' }}>
                {getOSIcon(systemInfo.os.platform)}
              </Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  操作系统
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {systemInfo.os.name}
                </Typography>
              </Box>
            </Box>

            {/* CPU */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.75rem' }}>⚡</Typography>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  处理器
                </Typography>
                <Typography variant="body2" fontWeight={600} noWrap title={systemInfo.cpu.model}>
                  {formatCpuModel(systemInfo.cpu.model)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  {systemInfo.cpu.cores} 核心 @ {(systemInfo.cpu.speed / 1000).toFixed(2)} GHz
                </Typography>
              </Box>
            </Box>

            {/* 内存 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.75rem' }}>🧠</Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  内存
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatBytes(systemInfo.memory.total)}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  已用 {Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100)}%
                </Typography>
              </Box>
            </Box>

            {/* 运行时长 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{ fontSize: '1.75rem' }}>⏱️</Typography>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  运行时长
                </Typography>
                <Typography variant="body2" fontWeight={600}>
                  {formatUptime(systemInfo.uptime)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>

      {/* 磁盘使用量 */}
      {systemInfo.disks.map((disk, index) => (
        <Fade in key={disk.name} timeout={350 + index * 50}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <ProgressBar
              label={`磁盘 ${disk.name}`}
              used={disk.used}
              total={disk.total}
              icon="💾"
            />
          </Paper>
        </Fade>
      ))}
    </Box>
  );
}
