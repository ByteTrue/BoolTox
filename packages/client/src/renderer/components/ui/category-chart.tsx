/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import { getCategoryLabel } from '@/hooks/use-module-stats';

export interface CategoryChartProps {
  data: Record<string, number>;
  size?: number;
  strokeWidth?: number;
}

/**
 * 分类圆环图组件
 * 使用 SVG 绘制环形统计图
 */
export function CategoryChart({ data, size = 200, strokeWidth = 24 }: CategoryChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { segments, total } = useMemo(() => {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (total === 0) {
      return { segments: [], total: 0 };
    }

    let currentAngle = -90;

    const segments = entries.map(([category, count], index) => {
      const percentage = (count / total) * 100;
      const angle = (percentage / 100) * 360;

      const segment = {
        category,
        label: getCategoryLabel(category),
        count,
        percentage: Math.round(percentage),
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
        color: getSegmentColor(index),
      };

      currentAngle += angle;
      return segment;
    });

    return { segments, total };
  }, [data]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: size, height: size }}>
        <Typography variant="body2" color="text.secondary">
          暂无数据
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      {/* SVG 圆环图 */}
      <Box sx={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* 背景圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            style={{ color: 'var(--mui-palette-action-hover)' }}
          />

          {/* 数据分段 */}
          {segments.map((segment, index) => {
            const dashLength = (segment.percentage / 100) * circumference;
            const dashOffset = segments
              .slice(0, index)
              .reduce((sum, s) => sum + (s.percentage / 100) * circumference, 0);

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={segment.category}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={`${dashLength} ${circumference}`}
                strokeDashoffset={-dashOffset}
                strokeLinecap="round"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  cursor: 'pointer',
                  transition: 'stroke-width 0.2s, filter 0.2s',
                  filter: isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                }}
              />
            );
          })}
        </svg>

        {/* 中心文本 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Fade in>
            <Typography variant="h4" fontWeight={700}>
              {total}
            </Typography>
          </Fade>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
            已启用
          </Typography>
        </Box>
      </Box>

      {/* 图例 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, width: '100%' }}>
        {segments.map((segment, index) => (
          <Button
            key={segment.category}
            variant="text"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              justifyContent: 'flex-start',
              textTransform: 'none',
              bgcolor: hoveredIndex === index ? 'action.hover' : 'transparent',
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: segment.color,
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" fontWeight={500} sx={{ flex: 1, textAlign: 'left' }} noWrap>
              {segment.label}
            </Typography>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              {segment.count}
            </Typography>
          </Button>
        ))}
      </Box>
    </Box>
  );
}

function getSegmentColor(index: number): string {
  const colors = [
    'rgb(101, 187, 233)',
    'rgb(138, 206, 241)',
    'rgb(249, 193, 207)',
    '#FBCFE8',
    '#A78BFA',
    '#60A5FA',
  ];
  return colors[index % colors.length];
}
