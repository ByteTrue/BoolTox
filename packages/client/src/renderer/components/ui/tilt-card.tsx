/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * TiltCard - 简化版卡片组件
 * 移除 3D 倾斜效果，使用简单的悬停缩放
 */

import { useState, type CSSProperties, type ReactNode } from 'react';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Box from '@mui/material/Box';

export interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  maxScale?: number;
  perspective?: number;
  glareIntensity?: number;
  enableGlare?: boolean;
  enableTilt?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

/**
 * TiltCard 组件 - 简化为 MUI Card with hover effect
 */
export function TiltCard({
  children,
  maxScale = 1.02,
  className = '',
  style = {},
  onClick,
}: TiltCardProps) {
  const [isHovering, setIsHovering] = useState(false);

  const content = (
    <Box
      sx={{
        transition: 'transform 0.2s ease',
        transform: isHovering ? `scale(${maxScale})` : 'scale(1)',
      }}
    >
      {children}
    </Box>
  );

  if (onClick) {
    return (
      <Card
        className={className}
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          ...style,
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <CardActionArea onClick={onClick}>
          {content}
        </CardActionArea>
      </Card>
    );
  }

  return (
    <Card
      className={className}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        ...style,
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {content}
    </Card>
  );
}

/**
 * TiltCardGroup - 卡片组容器
 */
export interface TiltCardGroupProps {
  children: ReactNode;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function TiltCardGroup({
  children,
  className = '',
  columns = 3,
  gap = 'md',
}: TiltCardGroupProps) {
  const gapMap = { sm: 1.5, md: 2, lg: 3 };

  const gridColumns = {
    1: { xs: 1 },
    2: { xs: 1, md: 2 },
    3: { xs: 1, md: 2, lg: 3 },
    4: { xs: 1, md: 2, lg: 4 },
  };

  return (
    <Box
      className={className}
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          md: `repeat(${Math.min(columns, 2)}, 1fr)`,
          lg: `repeat(${columns}, 1fr)`,
        },
        gap: gapMap[gap],
      }}
    >
      {children}
    </Box>
  );
}
