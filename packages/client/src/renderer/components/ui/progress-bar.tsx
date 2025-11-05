import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { formatBytes, calculatePercentage, getUsageColor } from '@/hooks/use-system-info';

export interface ProgressBarProps {
  /** 标签 */
  label: string;
  /** 已使用量（字节） */
  used: number;
  /** 总量（字节） */
  total: number;
  /** 图标 */
  icon?: string;
}

/**
 * 进度条组件
 * 用于显示内存、磁盘等资源使用情况
 */
export function ProgressBar({ label, used, total, icon }: ProgressBarProps) {
  const { theme } = useTheme();

  const percentage = calculatePercentage(used, total);
  const color = getUsageColor(percentage);

  // 颜色配置
  const colorConfig = {
    green: {
      bg: 'from-green-500 to-emerald-500',
      shadow: theme === 'dark' ? 'shadow-green-500/30' : 'shadow-green-500/20',
      text: theme === 'dark' ? 'text-green-400' : 'text-green-600',
    },
    yellow: {
      bg: 'from-yellow-500 to-orange-500',
      shadow: theme === 'dark' ? 'shadow-yellow-500/30' : 'shadow-yellow-500/20',
      text: theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600',
    },
    red: {
      bg: 'from-red-500 to-rose-500',
      shadow: theme === 'dark' ? 'shadow-red-500/30' : 'shadow-red-500/20',
      text: theme === 'dark' ? 'text-red-400' : 'text-red-600',
    },
  };

  const currentColor = colorConfig[color];

  return (
    <div className="space-y-2">
      {/* 标签行 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          <span
            className={`text-sm font-medium ${
              theme === 'dark' ? 'text-white/80' : 'text-slate-700'
            }`}
          >
            {label}
          </span>
        </div>
        <span
          className={`text-xs font-semibold ${
            theme === 'dark' ? 'text-white/60' : 'text-slate-500'
          }`}
        >
          {formatBytes(used)} / {formatBytes(total)}
        </span>
      </div>

      {/* 进度条 */}
      <div
        className={`relative h-2 overflow-hidden rounded-full ${
          theme === 'dark' ? 'bg-white/10' : 'bg-slate-200'
        }`}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${currentColor.bg} ${currentColor.shadow} shadow-lg`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
        />
      </div>

      {/* 百分比 */}
      <div className="flex justify-end">
        <span className={`text-xs font-bold ${currentColor.text}`}>
          {percentage.toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
