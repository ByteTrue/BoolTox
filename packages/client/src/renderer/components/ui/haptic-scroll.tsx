/**
 * 触觉滚动容器
 * 
 * 带有橡皮筋边界效果的滚动容器
 * 模拟 iOS 原生滚动的触觉反馈
 */

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { useTheme } from '../theme-provider';
import { scrollBounceHapticFeedback } from '../../utils/haptic-feedback';

export interface HapticScrollContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
  showScrollbar?: boolean;
  enableBounce?: boolean;
}

export function HapticScrollContainer({
  children,
  maxHeight = '600px',
  className = '',
  showScrollbar = true,
  enableBounce = true,
}: HapticScrollContainerProps) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverscrolling, setIsOverscrolling] = useState(false);

  const { scrollY, scrollYProgress } = useScroll({
    container: containerRef,
  });

  // 平滑滚动进度
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
  });

  // 监听滚动边界
  useEffect(() => {
    if (!containerRef.current || !enableBounce) return;

    const container = containerRef.current;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isAtTop = scrollTop === 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

      if (isAtTop || isAtBottom) {
        setIsOverscrolling(true);
        setTimeout(() => setIsOverscrolling(false), 300);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [enableBounce]);

  return (
    <motion.div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{
        maxHeight,
        scrollbarWidth: showScrollbar ? 'thin' : 'none',
        scrollbarColor: theme === 'dark' 
          ? 'rgba(255, 255, 255, 0.3) transparent'
          : 'rgba(0, 0, 0, 0.3) transparent',
      }}
      animate={isOverscrolling ? { scale: [1, 0.98, 1] } : { scale: 1 }}
      transition={
        isOverscrolling
          ? { type: 'spring', stiffness: 300, damping: 30, duration: 0.3 }
          : undefined
      }
    >
      {/* 滚动进度指示器 */}
      {enableBounce && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-1 z-50 pointer-events-none"
          style={{
            scaleX: smoothProgress,
            transformOrigin: 'left',
            backgroundColor: theme === 'dark' 
              ? 'rgba(101, 187, 233, 0.6)'
              : 'rgba(101, 187, 233, 0.8)',
          }}
        />
      )}

      {children}
    </motion.div>
  );
}

/**
 * 橡皮筋拉伸视图
 * 模拟下拉刷新的触觉反馈
 */
export interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const { theme } = useTheme();
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldRefresh = pullDistance >= threshold;

  const handleDragEnd = async () => {
    if (shouldRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setIsPulling(false);
    setPullDistance(0);
  };

  return (
    <motion.div
      className={`relative ${className}`}
      drag={!isRefreshing ? 'y' : false}
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragStart={() => setIsPulling(true)}
      onDrag={(_, info) => {
        if (info.offset.y > 0) {
          setPullDistance(info.offset.y);
        }
      }}
      onDragEnd={handleDragEnd}
      animate={{
        y: isRefreshing ? threshold : 0,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
      }}
    >
      {/* 刷新指示器 */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{
          height: pullDistance,
          opacity: pullProgress,
        }}
      >
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-t-transparent"
          style={{
            borderColor: theme === 'dark'
              ? 'rgba(101, 187, 233, 0.6)'
              : 'rgba(101, 187, 233, 0.8)',
          }}
          animate={
            isRefreshing
              ? { rotate: 360 }
              : { rotate: pullProgress * 360 }
          }
          transition={
            isRefreshing
              ? { duration: 1, repeat: Infinity, ease: 'linear' }
              : { duration: 0 }
          }
        />
      </motion.div>

      {/* 内容区 */}
      <motion.div
        style={{
          paddingTop: isPulling ? pullDistance : 0,
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
