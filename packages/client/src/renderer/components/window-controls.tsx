/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { Minus, Square, X } from 'lucide-react';
import { useTheme } from './theme-provider';

// 平台检测（渲染进程安全）
const userAgent = navigator.userAgent.toLowerCase();
const isWin = userAgent.includes('win');
const isLinux = userAgent.includes('linux') && !userAgent.includes('android');

export default function WindowControls() {
  const { theme } = useTheme();

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

  const buttonClass = `flex items-center justify-center w-12 h-12 transition-colors ${
    theme === 'dark'
      ? 'hover:bg-white/10 text-white/80'
      : 'hover:bg-gray-200 text-gray-700'
  }`;

  const closeButtonClass = `flex items-center justify-center w-12 h-12 transition-colors ${
    theme === 'dark'
      ? 'hover:bg-red-600 text-white/80 hover:text-white'
      : 'hover:bg-red-600 text-gray-700 hover:text-white'
  }`;

  return (
    <div
      className="flex items-center flex-shrink-0"
      style={{
        WebkitAppRegion: 'no-drag',
      }}
    >
      {/* 最小化 */}
      <button
        onClick={handleMinimize}
        className={buttonClass}
        title="最小化"
        aria-label="最小化"
      >
        <Minus size={14} />
      </button>

      {/* 最大化/还原 */}
      <button
        onClick={handleMaximize}
        className={buttonClass}
        title="最大化/还原"
        aria-label="最大化/还原"
      >
        <Square size={14} />
      </button>

      {/* 关闭 */}
      <button
        onClick={handleClose}
        className={closeButtonClass}
        title="关闭"
        aria-label="关闭"
      >
        <X size={17} />
      </button>
    </div>
  );
}
