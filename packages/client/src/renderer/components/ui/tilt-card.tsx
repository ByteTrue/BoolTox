/**
 * TiltCard - 3D 倾斜卡片组件
 * 
 * 实现 Apple 风格的 3D 倾斜交互效果：
 * - 鼠标跟随倾斜
 * - 光泽效果
 * - 阴影变化
 * - 平滑过渡
 */

import { useState, useRef, CSSProperties } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { getCardTiltStyle, getCardGlareStyle, getMousePosition } from '@/utils/fluid-animations';
import { useTheme } from '../theme-provider';

export interface TiltCardProps {
  children: React.ReactNode;
  /** 最大倾斜角度 (deg) */
  maxTilt?: number;
  /** 最大缩放 */
  maxScale?: number;
  /** 透视距离 (px) */
  perspective?: number;
  /** 光泽强度 (0-1) */
  glareIntensity?: number;
  /** 是否启用光泽效果 */
  enableGlare?: boolean;
  /** 是否启用倾斜 */
  enableTilt?: boolean;
  /** 类名 */
  className?: string;
  /** 样式 */
  style?: CSSProperties;
  /** 点击事件 */
  onClick?: () => void;
}

/**
 * TiltCard 组件
 * 
 * @example
 * <TiltCard maxTilt={15} enableGlare>
 *   <div className="p-6">
 *     <h3>Card Title</h3>
 *     <p>Card content with 3D tilt effect</p>
 *   </div>
 * </TiltCard>
 */
export function TiltCard({
  children,
  maxTilt = 12,
  maxScale = 1.05,
  perspective = 1000,
  glareIntensity = 0.25,
  enableGlare = true,
  enableTilt = true,
  className = '',
  style = {},
  onClick,
}: TiltCardProps) {
  const { theme } = useTheme();
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  
  // 使用 Spring 动画创建平滑的鼠标跟随
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const rotateX = useSpring(mouseX, springConfig);
  const rotateY = useSpring(mouseY, springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!enableTilt || !cardRef.current) return;

    const pos = getMousePosition(event, cardRef.current);
    mouseX.set(pos.x);
    mouseY.set(pos.y);
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative ${className}`}
      style={{
        ...style,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{
        scale: isHovering ? maxScale : 1,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* 主卡片内容 */}
      <motion.div
        style={
          enableTilt
            ? {
                transform: isHovering
                  ? getCardTiltStyle(mouseX.get(), mouseY.get(), {
                      maxTilt,
                      maxScale: 1,
                      perspective,
                    }).transform
                  : 'none',
              }
            : {}
        }
        transition={{
          type: 'spring',
          stiffness: 150,
          damping: 15,
        }}
      >
        {children}
      </motion.div>

      {/* 光泽层 */}
      {enableGlare && isHovering && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{
            ...getCardGlareStyle(mouseX.get(), mouseY.get(), {
              glareIntensity: theme === 'dark' ? glareIntensity : glareIntensity * 0.6,
            }),
            mixBlendMode: theme === 'dark' ? 'soft-light' : 'overlay',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        />
      )}
    </motion.div>
  );
}

/**
 * TiltCardGroup - 卡片组容器
 * 
 * 用于包裹多个 TiltCard，添加统一的交错动画
 */
export interface TiltCardGroupProps {
  children: React.ReactNode;
  className?: string;
  /** 列数 */
  columns?: 1 | 2 | 3 | 4;
  /** 间距 */
  gap?: 'sm' | 'md' | 'lg';
}

export function TiltCardGroup({
  children,
  className = '',
  columns = 3,
  gap = 'md',
}: TiltCardGroupProps) {
  const gapClass = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  }[gap];

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridClass} ${gapClass} ${className}`}>
      {children}
    </div>
  );
}
