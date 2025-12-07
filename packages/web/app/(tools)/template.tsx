'use client';

import { useEffect, useRef } from 'react';

/**
 * 性能优化的页面过渡模板
 * 使用 CSS transition 替代 framer-motion
 */
export default function ToolsTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // 添加淡入动画
    element.style.opacity = '0';

    // 强制重绘
    element.offsetHeight;

    // 应用过渡
    element.style.transition = 'opacity 150ms ease-out';
    element.style.opacity = '1';

    return () => {
      element.style.transition = '';
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
