/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../theme-provider';

interface ScreenshotCarouselProps {
  screenshots: string[];
  toolName: string;
}

export function ScreenshotCarousel({ screenshots, toolName }: ScreenshotCarouselProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mb-6">
      <h3 className={`mb-3 text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
        工具截图
      </h3>
      <div className="relative aspect-video overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-900">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={currentIndex}
            src={screenshots[currentIndex]}
            alt={`${toolName} - 截图 ${currentIndex + 1}`}
            className="h-full w-full object-contain"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            onError={e => {
              e.currentTarget.src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%2364748b' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='20'%3E截图加载失败%3C/text%3E%3C/svg%3E";
            }}
          />
        </AnimatePresence>

        {/* 导航按钮 */}
        {screenshots.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors ${
                isDark
                  ? 'bg-black/50 text-white hover:bg-black/70'
                  : 'bg-white/70 text-slate-700 hover:bg-white/90'
              } backdrop-blur-sm`}
              aria-label="上一张"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors ${
                isDark
                  ? 'bg-black/50 text-white hover:bg-black/70'
                  : 'bg-white/70 text-slate-700 hover:bg-white/90'
              } backdrop-blur-sm`}
              aria-label="下一张"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            {/* 指示器 */}
            <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentIndex
                      ? isDark
                        ? 'w-6 bg-white'
                        : 'w-6 bg-slate-700'
                      : isDark
                        ? 'bg-white/40 hover:bg-white/60'
                        : 'bg-slate-400 hover:bg-slate-500'
                  }`}
                  aria-label={`跳转到截图 ${index + 1}`}
                />
              ))}
            </div>

            {/* 计数器 */}
            <div
              className={`absolute right-3 top-3 rounded-full px-2 py-1 text-xs font-medium ${
                isDark ? 'bg-black/50 text-white' : 'bg-white/70 text-slate-700'
              } backdrop-blur-sm`}
            >
              {currentIndex + 1} / {screenshots.length}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
