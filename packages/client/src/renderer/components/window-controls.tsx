/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import { Minus, Square, X } from 'lucide-react';

// 平台检测（渲染进程安全）
const userAgent = navigator.userAgent.toLowerCase();
const isWin = userAgent.includes('win');
const isLinux = userAgent.includes('linux') && !userAgent.includes('android');

export default function WindowControls() {
  // 仅在 Windows 和 Linux 上显示
  if (!isWin && !isLinux) {
    return null;
  }

  const handleMinimize = () => {
    window.electron?.window?.minimize();
  };

  const handleMaximize = () => {
    window.electron?.window?.toggleMaximize();
  };

  const handleClose = () => {
    window.electron?.window?.close();
  };

  return (
    <Stack
      direction="row"
      spacing={0}
      sx={{
        flexShrink: 0,
        WebkitAppRegion: 'no-drag',
      }}
    >
      {/* 最小化 */}
      <IconButton
        onClick={handleMinimize}
        title="最小化"
        aria-label="最小化"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 0,
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Minus size={14} />
      </IconButton>

      {/* 最大化/还原 */}
      <IconButton
        onClick={handleMaximize}
        title="最大化/还原"
        aria-label="最大化/还原"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 0,
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <Square size={14} />
      </IconButton>

      {/* 关闭 */}
      <IconButton
        onClick={handleClose}
        title="关闭"
        aria-label="关闭"
        sx={{
          width: 48,
          height: 48,
          borderRadius: 0,
          color: 'text.secondary',
          '&:hover': {
            bgcolor: 'error.main',
            color: 'error.contrastText',
          },
        }}
      >
        <X size={17} />
      </IconButton>
    </Stack>
  );
}
