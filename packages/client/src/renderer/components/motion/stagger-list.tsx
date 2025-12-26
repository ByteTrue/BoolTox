/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, durations } from '@/theme/animations';
import { useAnimationConfig } from '@/contexts/animation-context';

interface StaggerListProps {
  children: React.ReactNode;
  /** 自定义className */
  className?: string;
  /** 自定义style */
  style?: React.CSSProperties;
}

interface StaggerItemProps extends StaggerListProps {
  /** 列表项索引，用于计算交错延迟（display: contents 会破坏父子传播，需要手动传递） */
  index?: number;
}

/**
 * Stagger列表容器
 *
 * 为子元素添加逐个淡入的动画效果
 * - 仅在初次加载时生效
 * - 通过AnimationContext自动响应prefers-reduced-motion
 * - 不影响布局(display: contents)
 *
 * @example
 * ```tsx
 * <Box component={StaggerList} sx={{ display: 'grid', gap: 2 }}>
 *   {items.map((item, index) => (
 *     <StaggerItem key={item.id} index={index}>
 *       <Card>{item.name}</Card>
 *     </StaggerItem>
 *   ))}
 * </Box>
 * ```
 */
export function StaggerList({ children, className, style }: StaggerListProps) {
  const { enableStagger } = useAnimationConfig();

  // 如果用户关闭了Stagger动画,直接渲染不加动画
  if (!enableStagger) {
    return (
      <div className={className} style={{ display: 'contents', ...style }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      style={{ display: 'contents', ...style }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger列表项
 *
 * 配合StaggerList使用,每个子项逐个淡入
 * 由于 display: contents 会破坏 Framer Motion 的父子传播，
 * 需要通过 index prop 手动实现交错延迟
 *
 * @example
 * ```tsx
 * <StaggerItem index={0}>
 *   <ToolCard tool={tool} />
 * </StaggerItem>
 * ```
 */
export function StaggerItem({ children, className, style, index = 0 }: StaggerItemProps) {
  const { enableStagger } = useAnimationConfig();

  // 如果用户关闭了Stagger动画,直接渲染不加动画
  if (!enableStagger) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  // 使用 index 计算延迟，模拟交错效果
  // 基础延迟 + 索引 * 间隔时间
  const staggerDelay = 0.02 + index * 0.05;

  return (
    <motion.div
      className={className}
      initial={staggerItem.initial}
      animate={{
        ...staggerItem.animate,
        transition: {
          ...staggerItem.animate.transition,
          delay: staggerDelay,
        },
      }}
      style={style}
    >
      {children}
    </motion.div>
  );
}
