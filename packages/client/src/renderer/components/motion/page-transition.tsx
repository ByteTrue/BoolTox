/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import { pageTransition } from '@/theme/animations';
import { useAnimationConfig } from '@/contexts/animation-context';

interface PageTransitionProps {
  children: React.ReactNode;
}

/**
 * 页面转场容器
 *
 * 为路由切换添加平滑的淡入淡出动画
 * - 通过AnimationContext自动响应prefers-reduced-motion
 * - 使用AnimatePresence实现退出动画
 * - 不影响页面布局(height: 100%)
 *
 * @example
 * ```tsx
 * // 在app-shell.tsx中使用:
 * <Route path="/" element={<PageTransition><HomePage /></PageTransition>} />
 * ```
 */
export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const { enableAdvanced } = useAnimationConfig();
  const prevPathRef = useRef<string>(location.pathname);

  // 检测是否为设置页内部的子路由切换（前后都在 /settings/ 下）
  const currentPath = location.pathname;
  const prevPath = prevPathRef.current;
  const isSettingsSubNavigation =
    currentPath.startsWith('/settings/') && prevPath.startsWith('/settings/');

  const shouldDisableAnimation = !enableAdvanced || isSettingsSubNavigation;

  // 更新上一个路径
  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // 如果需要禁用动画,直接渲染
  if (shouldDisableAnimation) {
    return <div style={{ height: '100%' }}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ height: '100%' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
