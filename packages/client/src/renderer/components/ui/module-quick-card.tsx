import { motion } from 'framer-motion';
import type { ModuleInstance } from '@core/modules/types';
import { useTheme } from '../theme-provider';
import { getGlassStyle, GLASS_BORDERS } from '@/utils/glass-layers';
import { cardHover } from '@/utils/animation-presets';

export interface ModuleQuickCardProps {
  /** 模块实例 */
  module: ModuleInstance;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 模块快速卡片组件
 * 用于快速启动面板和最近使用模块展示
 */
export function ModuleQuickCard({ module, onClick }: ModuleQuickCardProps) {
  const { theme } = useTheme();

  const isEnabled = module.runtime.status === 'enabled';
  const isLoading = module.runtime.loading;

  return (
    <motion.button
      {...cardHover}
      type="button"
      className="group relative overflow-hidden rounded-2xl border p-6 text-left transition-[shadow,transform] duration-250 ease-swift hover:scale-[1.02]"
      style={{
        ...getGlassStyle('BUTTON', theme, {
          withBorderGlow: true,
          withInnerShadow: true,
        }),
        minHeight: '140px',
        // 增强卡片的浮起感
        boxShadow: theme === 'dark'
          ? '0 4px 12px rgba(0, 0, 0, 0.4), 0 0.5px 0 0 rgba(255, 255, 255, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.08)'
          : '0 4px 16px rgba(0, 0, 0, 0.08), 0 0.5px 0 0 rgba(0, 0, 0, 0.06), inset 0 1px 0 0 rgba(255, 255, 255, 0.6)',
      }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      whileHover={{
        boxShadow: theme === 'dark'
          ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0.5px 0 0 rgba(255, 255, 255, 0.2), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)'
          : '0 8px 32px rgba(0, 0, 0, 0.12), 0 0.5px 0 0 rgba(0, 0, 0, 0.08), inset 0 1px 0 0 rgba(255, 255, 255, 0.8)',
      }}
    >
      {/* 背景渐变效果 */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            theme === 'dark'
              ? 'radial-gradient(circle at 50% 50%, rgba(101, 187, 233, 0.15), transparent 70%)'
              : 'radial-gradient(circle at 50% 50%, rgba(101, 187, 233, 0.25), transparent 70%)',
        }}
      />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col h-full">
        {/* 模块图标 */}
        <div className="flex items-start justify-between mb-auto">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-lg ${
              isEnabled
                ? 'bg-brand-gradient-secondary'
                : theme === 'dark'
                ? 'bg-white/10'
                : 'bg-slate-200'
            }`}
          >
            {module.definition.icon}
          </div>

          {/* 状态指示器 */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <motion.div
                className="h-2 w-2 rounded-full bg-yellow-500"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
              />
            ) : isEnabled ? (
              <div className="h-2 w-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50" />
            ) : (
              <div
                className={`h-2 w-2 rounded-full ${
                  theme === 'dark' ? 'bg-white/30' : 'bg-slate-400'
                }`}
              />
            )}
          </div>
        </div>

        {/* 模块信息 */}
        <div className="mt-4">
          <h3
            className={`text-sm font-semibold line-clamp-1 ${
              theme === 'dark' ? 'text-white' : 'text-slate-800'
            }`}
          >
            {module.definition.name}
          </h3>

          {module.definition.description && (
            <p
              className={`mt-1 text-xs line-clamp-2 ${
                theme === 'dark' ? 'text-white/70' : 'text-slate-600'
              }`}
            >
              {module.definition.description}
            </p>
          )}
        </div>

        {/* 底部标签 */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border ${
              isEnabled
                ? 'bg-green-500/20 text-green-600 border-green-500/30'
                : theme === 'dark'
                ? 'bg-white/10 text-white/60'
                : 'bg-slate-200 text-slate-600'
            }`}
            style={!isEnabled ? {
              borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
            } : undefined}
          >
            {isLoading ? '加载中...' : isEnabled ? '运行中' : '已停用'}
          </span>

          {/* 分类标签 */}
          {module.definition.category && (
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                theme === 'dark'
                  ? 'bg-white/5 text-white/50'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {getCategoryEmoji(module.definition.category)}{' '}
              {getCategoryLabel(module.definition.category)}
            </span>
          )}
        </div>
      </div>

      {/* 悬停箭头指示器 */}
      <motion.div
        className={`absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
        initial={{ x: -10 }}
        whileHover={{ x: 0 }}
      >
        <svg
          className="h-5 w-5 text-brand-blue-500 dark:text-brand-blue-300"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
      </motion.div>
    </motion.button>
  );
}

/**
 * 获取分类对应的 emoji
 */
function getCategoryEmoji(category: string): string {
  const emojiMap: Record<string, string> = {
    productivity: '⚡',
    design: '🎨',
    utility: '🛠️',
    entertainment: '🎮',
    development: '💻',
    system: '⚙️',
  };
  return emojiMap[category] || '📦';
}

/**
 * 获取分类的显示名称
 */
function getCategoryLabel(category: string): string {
  const labelMap: Record<string, string> = {
    productivity: '效率',
    design: '设计',
    utility: '工具',
    entertainment: '娱乐',
    development: '开发',
    system: '系统',
  };
  return labelMap[category] || category;
}
