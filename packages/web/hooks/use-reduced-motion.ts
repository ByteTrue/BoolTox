/**
 * 检测用户是否偏好减少动画
 * 用于可访问性支持，尊重用户系统设置
 */

import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // 检查媒体查询
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // 设置初始值
    setPrefersReducedMotion(mediaQuery.matches);

    // 监听变化
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // 兼容旧版浏览器
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // @ts-ignore - 兼容 Safari < 14
      mediaQuery.addListener(handleChange);
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

/**
 * 根据减少动画偏好返回过渡配置
 */
export function useAnimationConfig<T>(config: T, fallback: T): T {
  const prefersReducedMotion = useReducedMotion();
  return prefersReducedMotion ? fallback : config;
}
