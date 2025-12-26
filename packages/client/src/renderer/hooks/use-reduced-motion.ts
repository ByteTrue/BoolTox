/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useState } from 'react';

/**
 * 检测用户是否开启"减少动画"偏好
 *
 * 根据系统设置自动降级动画:
 * - Windows: 设置 > 辅助功能 > 视觉效果 > 动画效果
 * - macOS: 系统偏好设置 > 辅助功能 > 显示 > 减弱动态效果
 *
 * @returns {boolean} true表示用户希望减少动画
 *
 * @example
 * ```tsx
 * const shouldReduceMotion = useReducedMotion();
 *
 * return shouldReduceMotion ? (
 *   <div>{children}</div>
 * ) : (
 *   <motion.div variants={fadeIn}>{children}</motion.div>
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // 同步初始化,避免首帧闪烁
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 监听变化
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}
