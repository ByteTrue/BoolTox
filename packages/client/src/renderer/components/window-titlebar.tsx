/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

"use client";

import React, { type CSSProperties } from "react";
import { Moon, Sun, Minus, Square, X, Menu } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "./theme-provider";
import { getGlassStyle } from "@/utils/glass-layers";
import { getBlurStyle } from "@/utils/blur-effects";
import { iconButtonInteraction } from "@/utils/animation-presets";

export function WindowTitlebar() {
  const { theme, toggleTheme } = useTheme();

  const handleDoubleClick = () => {
    if (typeof window === "undefined") return;
    void window.electron.window.toggleMaximize();
  };

  const handleMinimize = (event: React.MouseEvent) => {
    event.stopPropagation();
    void window.electron.window.minimize();
  };

  const handleMaximize = (event: React.MouseEvent) => {
    event.stopPropagation();
    void window.electron.window.toggleMaximize();
  };

  const handleClose = (event: React.MouseEvent) => {
    event.stopPropagation();
    void window.electron.window.close();
  };

  const handleThemeToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleTheme();
  };

  const buttonStyle = getGlassStyle('BUTTON', theme);
  
  // 增强的标题栏模糊效果
  const titlebarBlur = getBlurStyle('titlebar', theme, 'medium');

  const titlebarStyle = {
    height: 'var(--titlebar-height)',
    WebkitAppRegion: 'drag',
    ...titlebarBlur,
    background: theme === 'dark'
      ? 'linear-gradient(135deg, rgba(101, 187, 233, 0.08) 0%, rgba(249, 193, 207, 0.06) 100%), rgba(28, 30, 35, 0.88)'
      : 'linear-gradient(135deg, rgba(101, 187, 233, 0.15) 0%, rgba(249, 193, 207, 0.12) 100%), rgba(255, 255, 255, 0.75)',
    borderColor: theme === 'dark'
      ? 'rgba(71, 85, 105, 0.35)'
      : 'rgba(148, 163, 184, 0.35)',
  } as CSSProperties;

  const noDragStyle = { WebkitAppRegion: 'no-drag' } as CSSProperties;

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 border-b transition-[box-shadow,border-color] duration-500 ease-gentle ${theme === 'dark' ? 'shadow-unified-lg-dark' : 'shadow-unified-lg'}`}
      style={titlebarStyle}
      onDoubleClick={handleDoubleClick}
    >
      {/* 左侧：折叠 + 主题切换 */}
      <div className="flex items-center gap-2" style={noDragStyle}>
        <motion.button
          {...iconButtonInteraction}
          type="button"
          aria-label="折叠侧边栏"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-unified-sm dark:shadow-unified-sm-dark transition-shadow duration-250 ease-swift hover:shadow-unified-md hover:dark:shadow-unified-md-dark outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          style={getGlassStyle('BUTTON', theme)}
          onClick={(event) => {
            event.stopPropagation();
            window.dispatchEvent(new CustomEvent('sidebar-toggle'));
          }}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <Menu className="h-4 w-4" />
        </motion.button>
        <motion.button
          {...iconButtonInteraction}
          type="button"
          aria-label={`切换为${theme === "light" ? "夜间" : "日间"}模式`}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-unified-sm dark:shadow-unified-sm-dark transition-shadow duration-250 ease-swift hover:shadow-unified-md hover:dark:shadow-unified-md-dark outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          style={buttonStyle}
          onClick={handleThemeToggle}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </motion.button>
      </div>

      {/* 中间：标题 - 移除 pointer-events-none 以允许双击穿透 */}
      <div className={`select-none text-xs font-semibold uppercase tracking-[0.32em] ${theme === 'dark' ? 'text-white/50' : 'text-slate-500'}`}>
        BOOLTOX
      </div>

      {/* 右侧：窗口控制按钮 */}
      <div className="flex items-center gap-1.5" style={noDragStyle}>
        <motion.button
          {...iconButtonInteraction}
          type="button"
          aria-label="最小化"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-unified-sm dark:shadow-unified-sm-dark transition-shadow duration-250 ease-swift hover:shadow-unified-md hover:dark:shadow-unified-md-dark outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          style={buttonStyle}
          onClick={handleMinimize}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <Minus className="h-4 w-4" />
        </motion.button>
        <motion.button
          {...iconButtonInteraction}
          type="button"
          aria-label="最大化/还原"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-unified-sm dark:shadow-unified-sm-dark transition-shadow duration-250 ease-swift hover:shadow-unified-md hover:dark:shadow-unified-md-dark outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          style={buttonStyle}
          onClick={handleMaximize}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <Square className="h-4 w-4" />
        </motion.button>
        <motion.button
          {...iconButtonInteraction}
          type="button"
          aria-label="关闭"
          className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border shadow-unified-sm dark:shadow-unified-sm-dark transition-[shadow,border-color,background-color,color] duration-250 ease-swift hover:shadow-unified-md hover:dark:shadow-unified-md-dark hover:border-red-400 hover:bg-red-500/20 hover:text-red-500 outline-none ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
          style={buttonStyle}
          onClick={handleClose}
          onDoubleClick={(event) => event.stopPropagation()}
        >
          <X className="h-[18px] w-[18px]" />
        </motion.button>
      </div>
    </div>
  );
}
