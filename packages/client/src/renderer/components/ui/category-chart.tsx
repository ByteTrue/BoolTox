import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useTheme } from '../theme-provider';
import { buttonInteraction } from '@/utils/animation-presets';
import { getCategoryLabel } from '@/hooks/use-module-stats';

export interface CategoryChartProps {
  /** 分类统计数据 { category: count } */
  data: Record<string, number>;
  /** 图表尺寸 */
  size?: number;
  /** 环形厚度 */
  strokeWidth?: number;
}

/**
 * 分类圆环图组件
 * 使用 SVG + Framer Motion 绘制环形统计图
 */
export function CategoryChart({ data, size = 200, strokeWidth = 24 }: CategoryChartProps) {
  const { theme } = useTheme();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const { segments, total } = useMemo(() => {
    const entries = Object.entries(data);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (total === 0) {
      return { segments: [], total: 0 };
    }

    // 计算每个分类的弧度
    let currentAngle = -90; // 从顶部开始

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
        color: getSegmentColor(index, theme),
      };

      currentAngle += angle;
      return segment;
    });

    return { segments, total };
  }, [data, theme]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  if (total === 0) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
          暂无数据
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* SVG 圆环图 */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* 背景圆环 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            strokeWidth={strokeWidth}
          />

          {/* 数据分段 */}
          {segments.map((segment, index) => {
            const dashLength = (segment.percentage / 100) * circumference;
            const dashOffset = segments
              .slice(0, index)
              .reduce((sum, s) => sum + (s.percentage / 100) * circumference, 0);

            const isHovered = hoveredIndex === index;

            return (
              <motion.circle
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
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{
                  strokeDasharray: `${dashLength} ${circumference}`,
                  strokeWidth: isHovered ? strokeWidth + 4 : strokeWidth,
                }}
                transition={{
                  duration: 1,
                  delay: index * 0.1,
                  ease: 'easeOut',
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
                style={{
                  filter: isHovered ? 'drop-shadow(0 0 8px currentColor)' : 'none',
                }}
              />
            );
          })}
        </svg>

        {/* 中心文本 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.p
            className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
          >
            {total}
          </motion.p>
          <p className={`text-xs uppercase tracking-wider ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            已启用
          </p>
        </div>
      </div>

      {/* 图例 */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {segments.map((segment, index) => (
          <motion.button
            {...buttonInteraction}
            key={segment.category}
            type="button"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-[background-color,transform] duration-250 ease-swift ${
              hoveredIndex === index
                ? theme === 'dark'
                  ? 'bg-white/10'
                  : 'bg-slate-100'
                : 'hover:bg-white/5'
            }`}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.05 }}
          >
            <div
              className="h-3 w-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <div className="flex-1 text-left min-w-0">
              <p
                className={`text-xs font-medium truncate ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                {segment.label}
              </p>
            </div>
            <span
              className={`text-xs font-semibold ${
                theme === 'dark' ? 'text-white/80' : 'text-slate-600'
              }`}
            >
              {segment.count}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/**
 * 根据索引和主题返回分段颜色
 * 使用 Apple 设计系统色彩
 */
function getSegmentColor(index: number, theme: 'light' | 'dark'): string {
  const lightColors = [
    'rgb(101, 187, 233)',  // brand-blue-400
    'rgb(138, 206, 241)',  // brand-blue-300
    'rgb(249, 193, 207)',  // brand-pink-300
    '#FBCFE8',             // 浅粉色（保留）
    '#A78BFA',             // 紫色（保留）
    '#60A5FA',             // 天蓝色（保留）
  ];

  const darkColors = [
    'rgb(101, 187, 233)',  // brand-blue-400
    'rgb(138, 206, 241)',  // brand-blue-300
    'rgb(249, 193, 207)',  // brand-pink-300
    '#FBCFE8',             // 浅粉色（保留）
    '#C4B5FD',             // 紫色（保留）
    '#7DD3FC',             // 天蓝色（保留）
  ];

  const colors = theme === 'dark' ? darkColors : lightColors;
  return colors[index % colors.length];
}
