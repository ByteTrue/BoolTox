/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode, WheelEvent } from 'react';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';

export interface HorizontalScrollProps {
  /** 子元素 */
  children: ReactNode;
  /** 间距 */
  gap?: number;
  /** 是否显示滚动条 */
  showScrollbar?: boolean;
}

/**
 * 横向滚动容器组件
 * 支持鼠标滚轮横向滚动和美化的滚动条
 */
export function HorizontalScroll({
  children,
  gap = 24,
  showScrollbar = true,
}: HorizontalScrollProps) {
  const { theme } = useTheme();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 处理鼠标滚轮事件，实现横向滚动
  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    if (scrollRef.current) {
      // 如果按住 Shift 或者滚动的是横向滚动条，使用默认行为
      if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        return;
      }

      // 阻止默认的纵向滚动
      e.preventDefault();

      // 将纵向滚动转换为横向滚动
      scrollRef.current.scrollLeft += e.deltaY;
    }
  };

  return (
    <div
      ref={scrollRef}
      className={`horizontal-scroll-container overflow-x-auto py-2 ${
        showScrollbar ? '' : 'scrollbar-hide'
      }`}
      onWheel={handleWheel}
      style={{
        scrollBehavior: 'smooth',
      }}
    >
      <motion.div
        className="flex"
        style={{ gap: `${gap}px` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {children}
      </motion.div>

      <style>{`
        .horizontal-scroll-container {
          /* WebKit 浏览器滚动条样式 */
          &::-webkit-scrollbar {
            height: 8px;
          }

          &::-webkit-scrollbar-track {
            background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
            border-radius: 4px;
          }

          &::-webkit-scrollbar-thumb {
            background: ${
              theme === 'dark' ? 'rgba(101, 187, 233, 0.5)' : 'rgba(101, 187, 233, 0.6)'
            };
            border-radius: 4px;
            transition: background 0.3s ease;
          }

          &::-webkit-scrollbar-thumb:hover {
            background: ${
              theme === 'dark' ? 'rgba(101, 187, 233, 0.7)' : 'rgba(101, 187, 233, 0.8)'
            };
          }

          /* Firefox 滚动条样式 */
          scrollbar-width: thin;
          scrollbar-color: ${
            theme === 'dark'
              ? 'rgba(101, 187, 233, 0.5) rgba(255, 255, 255, 0.05)'
              : 'rgba(101, 187, 233, 0.6) rgba(0, 0, 0, 0.05)'
          };
        }

        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;

          &::-webkit-scrollbar {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
