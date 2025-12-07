'use client';

import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltMaxAngle?: number;
  scale?: number;
  transitionSpeed?: number;
  glareEnable?: boolean;
}

/**
 * 3D 倾斜卡片组件
 *
 * 特性：
 * - 鼠标跟随 3D 倾斜效果
 * - 可选的光晕效果
 * - 平滑的弹簧动画
 * - 完全可定制
 *
 * 使用示例：
 * ```tsx
 * <TiltCard>
 *   <div className="p-6 bg-card rounded-xl">
 *     卡片内容
 *   </div>
 * </TiltCard>
 * ```
 */
export function TiltCard({
  children,
  className,
  tiltMaxAngle = 15,
  scale = 1.05,
  transitionSpeed = 300,
  glareEnable = true,
}: TiltCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // 使用弹簧动画使运动更平滑
  const mouseXSpring = useSpring(x, {
    stiffness: transitionSpeed,
    damping: 20,
  });
  const mouseYSpring = useSpring(y, {
    stiffness: transitionSpeed,
    damping: 20,
  });

  // 计算旋转角度
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], [`${tiltMaxAngle}deg`, `-${tiltMaxAngle}deg`]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [`-${tiltMaxAngle}deg`, `${tiltMaxAngle}deg`]);

  // 光晕位置
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={cn('relative', className)}
    >
      {/* 卡片内容 */}
      <div style={{ transform: 'translateZ(50px)' }}>{children}</div>

      {/* 光晕效果 */}
      {glareEnable && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-inherit opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.2) 0%, transparent 60%)`,
          }}
        />
      )}
    </motion.div>
  );
}

/**
 * 简化版 3D 卡片（性能优先）
 *
 * 仅在悬停时启用 3D 效果，性能更好
 */
export function SimpleTiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{
        rotateX: 5,
        rotateY: 5,
        scale: 1.02,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      style={{
        transformStyle: 'preserve-3d',
      }}
      className={cn('relative', className)}
    >
      {children}

      {/* 简单光晕 */}
      {isHovered && (
        <div className="pointer-events-none absolute inset-0 rounded-inherit bg-gradient-to-br from-white/10 to-transparent opacity-50" />
      )}
    </motion.div>
  );
}
