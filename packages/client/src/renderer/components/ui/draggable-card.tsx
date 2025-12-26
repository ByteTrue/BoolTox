/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 可拖拽卡片组件
 * 注意：此组件保留 framer-motion 用于拖拽动画
 */

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useState, type ReactNode } from 'react';
import Box from '@mui/material/Box';

export interface DraggableCardProps {
  children: ReactNode;
  onDragEnd?: (info: PanInfo) => void;
  className?: string;
  disabled?: boolean;
}

export function DraggableCard({
  children,
  onDragEnd,
  className = '',
  disabled = false,
}: DraggableCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-100, 0, 100], [-5, 0, 5]);
  const opacity = useTransform(x, [-200, 0, 200], [0.6, 1, 0.6]);

  return (
    <Box
      component={motion.div}
      drag={!disabled}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_, info: PanInfo) => {
        setIsDragging(false);
        onDragEnd?.(info);
      }}
      style={{
        x,
        y,
        rotate,
        opacity,
        cursor: disabled ? 'default' : isDragging ? 'grabbing' : 'grab',
      }}
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      animate={
        isDragging
          ? {
              scale: 0.98,
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }
          : {
              scale: 1,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }
      }
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className={className}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  );
}

/**
 * 可拖拽排序列表
 */
export interface DraggableSortableListProps<T> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  className?: string;
}

export function DraggableSortableList<T>({
  items,
  onReorder,
  renderItem,
  keyExtractor,
  className = '',
}: DraggableSortableListProps<T>) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((item, index) => {
        const key = keyExtractor(item);
        const isDragging = draggedItem === key;

        return (
          <motion.div
            key={key}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: isDragging ? 0.5 : 1,
              y: 0,
              scale: isDragging ? 1.05 : 1,
            }}
            exit={{ opacity: 0, y: -20 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
            }}
          >
            <DraggableCard
              onDragEnd={() => {
                setDraggedItem(null);
                onReorder(items);
              }}
            >
              {renderItem(item, index)}
            </DraggableCard>
          </motion.div>
        );
      })}
    </div>
  );
}
