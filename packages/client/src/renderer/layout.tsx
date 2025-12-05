/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import React, { useEffect } from "react"; // 添加 React 导入
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/Toaster"; // 导入 Toaster
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // 为所有 elegant-scroll 元素添加滚动事件监听
    const handleScrollbarAutoHide = () => {
      const scrollElements = document.querySelectorAll('.elegant-scroll');
      
      scrollElements.forEach((element) => {
        let scrollTimer: NodeJS.Timeout;
        
        const handleScroll = () => {
          // 滚动时添加 scrolling 类
          element.classList.add('scrolling');
          
          // 清除之前的定时器
          clearTimeout(scrollTimer);
          
          // 2秒后移除 scrolling 类（隐藏滚动条）
          scrollTimer = setTimeout(() => {
            element.classList.remove('scrolling');
          }, 2000);
        };
        
        element.addEventListener('scroll', handleScroll);
        
        // 清理函数
        return () => {
          element.removeEventListener('scroll', handleScroll);
          clearTimeout(scrollTimer);
        };
      });
    };
    
    // 初始化
    handleScrollbarAutoHide();
    
    // 监听 DOM 变化，处理动态添加的元素
    const observer = new MutationObserver(handleScrollbarAutoHide);
    observer.observe(document.body, { childList: true, subtree: true });
    
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className={'antialiased bg-[var(--shell-background)] text-[var(--text-primary)]'}>
      <ThemeProvider>
        {children}
        <Toaster /> {/* 在这里添加 Toaster */}
      </ThemeProvider>
    </div>
  );
}
