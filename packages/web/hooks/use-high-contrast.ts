/**
 * 高对比度模式 Hook
 * 支持 prefers-contrast: high 媒体查询
 */

import { useEffect, useState } from 'react';

export function useHighContrast(): boolean {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    // 检查媒体查询
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');

    // 设置初始值
    setPrefersHighContrast(mediaQuery.matches);

    // 监听变化
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersHighContrast(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return prefersHighContrast;
}
