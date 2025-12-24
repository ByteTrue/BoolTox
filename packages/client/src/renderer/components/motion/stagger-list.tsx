/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/theme/animations';
import { useAnimationConfig } from '@/contexts/animation-context';

interface StaggerListProps {
  children: React.ReactNode;
  /** 自定义className */
  className?: string;
  /** 自定义style */
  style?: React.CSSProperties;
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
 *   {items.map(item => (
 *     <StaggerItem key={item.id}>
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
 *
 * @example
 * ```tsx
 * <StaggerItem>
 *   <ToolCard tool={tool} />
 * </StaggerItem>
 * ```
 */
export function StaggerItem({ children, className, style }: StaggerListProps) {
  const { enableStagger } = useAnimationConfig();

  // 如果用户关闭了Stagger动画,直接渲染不加动画
  if (!enableStagger) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div className={className} variants={staggerItem} style={style}>
      {children}
    </motion.div>
  );
}
