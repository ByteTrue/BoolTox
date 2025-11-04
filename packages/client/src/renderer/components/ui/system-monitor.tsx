import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { useSystemInfo, formatUptime, getOSIcon } from '@/hooks/use-system-info';
import { ProgressBar } from './progress-bar';
import { SkeletonLoader } from './skeleton-loader';
import { GLASS_BORDERS } from '@/utils/glass-layers';

/**
 * 系统监控面板组件
 * 优化布局：顶部显示系统基本信息（OS、CPU型号、内存总量、运行时长），底部仅显示磁盘使用量
 */
export function SystemMonitor() {
  const { theme } = useTheme();
  const { systemInfo, isLoading, error } = useSystemInfo();

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="list-item" count={3} />
      </div>
    );
  }

  // 错误状态
  if (error || !systemInfo) {
    return (
      <div
        className={`rounded-xl border p-6 text-center ${
          theme === 'dark'
            ? 'border-red-500/30 bg-red-500/10'
            : 'border-red-300 bg-red-50'
        }`}
      >
        <p
          className={`text-sm mb-3 ${
            theme === 'dark' ? 'text-red-400' : 'text-red-600'
          }`}
        >
          {error || '无法获取系统信息'}
        </p>
        <button
          type="button"
          className={`text-xs px-3 py-1.5 rounded-lg ${
            theme === 'dark'
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-red-100 text-red-600 hover:bg-red-200'
          } transition-colors`}
          onClick={() => window.location.reload()}
        >
          刷新页面
        </button>
      </div>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    const units = ['KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = -1;
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }
    return `${value.toFixed(1)} ${units[unitIndex]}`;
  };

  // 简化 CPU 名称
  const formatCpuModel = (model: string): string => {
    // 移除常见的冗余信息
    let simplified = model
      .replace(/\(R\)/gi, '')
      .replace(/\(TM\)/gi, '')
      .replace(/\s+CPU/gi, '')
      .replace(/\s+Processor/gi, '')
      .replace(/\s+@.*$/g, '') // 移除频率信息（我们单独显示）
      .trim();
    
    // 如果还是太长，智能截取
    if (simplified.length > 25) {
      // 尝试保留品牌和型号主要部分
      const parts = simplified.split(/\s+/);
      if (parts.length > 2) {
        // 保留前两个主要部分（如 "Intel Core i7-9750H"）
        simplified = parts.slice(0, 3).join(' ');
      }
    }
    
    return simplified;
  };

  return (
    <div className="space-y-4">
      {/* 系统基本信息卡片 */}
      <motion.div
        className={`rounded-xl border p-5 ${
          theme === 'dark' ? 'bg-white/5' : 'bg-white/50'
        }`}
        style={{
          borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
        }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* 网格布局：2x2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 操作系统 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getOSIcon(systemInfo.os.platform)}</span>
            <div>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                操作系统
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                {systemInfo.os.name}
              </p>
            </div>
          </div>

          {/* CPU */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚡</span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                处理器
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 truncate ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
                title={systemInfo.cpu.model}
              >
                {formatCpuModel(systemInfo.cpu.model)}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                }`}
              >
                {systemInfo.cpu.cores} 核心 @ {(systemInfo.cpu.speed / 1000).toFixed(2)} GHz
              </p>
            </div>
          </div>

          {/* 内存 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <div>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                内存
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                {formatBytes(systemInfo.memory.total)}
              </p>
              <p
                className={`text-xs mt-0.5 ${
                  theme === 'dark' ? 'text-white/50' : 'text-slate-500'
                }`}
              >
                已用 {Math.round((systemInfo.memory.used / systemInfo.memory.total) * 100)}%
              </p>
            </div>
          </div>

          {/* 运行时长 */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏱️</span>
            <div>
              <p
                className={`text-xs ${
                  theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                }`}
              >
                运行时长
              </p>
              <p
                className={`text-sm font-semibold mt-0.5 ${
                  theme === 'dark' ? 'text-white' : 'text-slate-800'
                }`}
              >
                {formatUptime(systemInfo.uptime)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 磁盘使用量（支持多磁盘） */}
      {systemInfo.disks.map((disk, index) => (
        <motion.div
          key={disk.name}
          className={`rounded-xl border p-4 ${
            theme === 'dark' ? 'bg-white/5' : 'bg-white/50'
          }`}
          style={{
            borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 + index * 0.05 }}
        >
          <ProgressBar
            label={`磁盘 ${disk.name}`}
            used={disk.used}
            total={disk.total}
            icon="💾"
          />
        </motion.div>
      ))}
    </div>
  );
}
