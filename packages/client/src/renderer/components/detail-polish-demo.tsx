/**
 * 细节打磨演示页面 - Task 2.6 & 2.7
 * 
 * 展示所有细节优化效果：
 * 1. Scrollbar 样式优化
 * 2. Focus 状态环优化
 * 3. Loading 状态动画
 * 4. Skeleton 加载占位
 * 5. Empty 空状态插图
 * 6. 响应式布局与断点展示（Task 2.7）
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './theme-provider';
import { getGlassStyle } from '@/utils/glass-layers';
import { getScrollbarClassName, getFocusRingClassName } from '@/utils/detail-polish';
import {
  getBreakpoint,
  getResponsiveFontSize,
  getResponsiveSpacing,
} from '@/utils/responsive-scale';
import {
  LoadingSpinner,
  LoadingDots,
  LoadingPulse,
  LoadingProgress,
  LoadingInline,
  LoadingOverlay,
} from './ui/loading';
import {
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonList,
  SkeletonImage,
} from './ui/skeleton';
import { EmptyState } from './ui/empty-state';
import { GlassButton } from './ui/glass-button';

export function DetailPolishDemo() {
  const { theme } = useTheme();
  const [progress, setProgress] = useState(60);
  const [showOverlay, setShowOverlay] = useState(false);
  const [breakpoint, setBreakpoint] = useState<string>(getBreakpoint());

  // 监听窗口尺寸变化
  useEffect(() => {
    function onResize() {
      setBreakpoint(getBreakpoint());
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="space-y-8 p-6">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1
          className={`font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
          style={getResponsiveFontSize('2xl')}
        >
          细节打磨 & 响应式布局
        </h1>
        <p
          className={`${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}
          style={getResponsiveFontSize('md')}
        >
          Task 2.6 & 2.7: Apple 风格细节优化 + 响应式断点适配
        </p>
        {/* 当前断点指示器 */}
        <div
          className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
            theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
          }`}
        >
          <span>当前断点：</span>
          <span className="font-mono text-lg">{breakpoint}</span>
          <span className="text-xs opacity-70">({window.innerWidth}px)</span>
        </div>
      </motion.div>

      {/* Section 0: 响应式字体与间距演示 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${
            theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
          }`}
          style={getGlassStyle('CARD', theme)}
        >
          <h2
            className={`font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}
            style={getResponsiveFontSize('xl')}
          >
            📐 响应式字体 & 间距
          </h2>
          <p
            className={`mb-6 ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
            style={getResponsiveFontSize('base')}
          >
            所有字体和间距随视口宽度流畅缩放（使用 CSS clamp()）。
            尝试调整窗口大小观察变化。
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 字体演示 */}
            <div
              className={`rounded-xl border p-4 ${
                theme === 'dark' ? 'bg-white/3 border-white/5' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <h3
                className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                style={getResponsiveFontSize('lg')}
              >
                字体规模
              </h3>
              <div className="space-y-2">
                <p style={getResponsiveFontSize('xs')} className={theme === 'dark' ? 'text-white/70' : 'text-slate-600'}>
                  超小文本 (xs): 10-12px
                </p>
                <p style={getResponsiveFontSize('sm')} className={theme === 'dark' ? 'text-white/70' : 'text-slate-600'}>
                  小文本 (sm): 12-14px
                </p>
                <p style={getResponsiveFontSize('base')} className={theme === 'dark' ? 'text-white/80' : 'text-slate-700'}>
                  基础文本 (base): 14-16px
                </p>
                <p style={getResponsiveFontSize('md')} className={theme === 'dark' ? 'text-white/80' : 'text-slate-700'}>
                  中等文本 (md): 16-18px
                </p>
                <p style={getResponsiveFontSize('lg')} className={theme === 'dark' ? 'text-white' : 'text-slate-800'}>
                  大文本 (lg): 18-22px
                </p>
                <p style={getResponsiveFontSize('xl')} className={theme === 'dark' ? 'text-white' : 'text-slate-900'}>
                  超大文本 (xl): 24-32px
                </p>
              </div>
            </div>

            {/* 间距演示 */}
            <div
              className={`rounded-xl border p-4 ${
                theme === 'dark' ? 'bg-white/3 border-white/5' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <h3
                className={`font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
                style={getResponsiveFontSize('lg')}
              >
                间距规模
              </h3>
              <div className="space-y-2">
                <div style={getResponsiveSpacing('xs', 'padding')} className={`rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <p className="text-xs">xs: 4-6px</p>
                </div>
                <div style={getResponsiveSpacing('sm', 'padding')} className={`rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <p className="text-xs">sm: 8-12px</p>
                </div>
                <div style={getResponsiveSpacing('base', 'padding')} className={`rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <p className="text-xs">base: 12-16px</p>
                </div>
                <div style={getResponsiveSpacing('md', 'padding')} className={`rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <p className="text-xs">md: 16-24px</p>
                </div>
                <div style={getResponsiveSpacing('lg', 'padding')} className={`rounded ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                  <p className="text-xs">lg: 24-32px</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 1: Scrollbar 样式 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            1. Scrollbar 样式优化
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 自定义滚动条示例 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                自定义滚动条 (macOS 风格)
              </h3>
              <div
                className={`h-64 overflow-y-auto rounded-xl border p-4 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                } ${getScrollbarClassName(theme)}`}
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <p key={i} className={`mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    第 {i + 1} 行 - 滚动查看自定义滚动条效果
                  </p>
                ))}
              </div>
            </div>

            {/* 标准滚动条对比 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                标准滚动条 (对比)
              </h3>
              <div
                className={`h-64 overflow-y-auto rounded-xl border p-4 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                {Array.from({ length: 20 }).map((_, i) => (
                  <p key={i} className={`mb-2 ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}>
                    第 {i + 1} 行 - 使用浏览器默认滚动条
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 细窄半透明滚动条，Hover 时显示
          </div>
        </div>
      </section>

      {/* Section 2: Focus 状态环 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            2. Focus 状态环优化
          </h2>

          <div className="space-y-6">
            {/* Input 示例 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                输入框 Focus Ring
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="点击查看 Focus Ring"
                  className={`px-4 py-2 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  } ${getFocusRingClassName(theme)}`}
                />
                <input
                  type="email"
                  placeholder="电子邮件"
                  className={`px-4 py-2 rounded-xl border ${
                    theme === 'dark'
                      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                      : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
                  } ${getFocusRingClassName(theme)}`}
                />
              </div>
            </div>

            {/* Button 示例 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                按钮 Focus Ring
              </h3>
              <div className="flex gap-4">
                <button
                  className={`px-6 py-2 rounded-xl font-medium ${
                    theme === 'dark'
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  } ${getFocusRingClassName(theme)}`}
                >
                  主要按钮
                </button>
                <button
                  className={`px-6 py-2 rounded-xl font-medium border ${
                    theme === 'dark'
                      ? 'bg-white/10 text-white border-white/20 hover:bg-white/15'
                      : 'bg-slate-100 text-slate-900 border-slate-200 hover:bg-slate-200'
                  } ${getFocusRingClassName(theme)}`}
                >
                  次要按钮
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 蓝色发光环，使用 Tab 键导航查看效果
          </div>
        </div>
      </section>

      {/* Section 3: Loading 状态动画 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            3. Loading 状态动画
          </h2>

          <div className="space-y-8">
            {/* Spinner */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Spinner (旋转)
              </h3>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>小</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="md" />
                  <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>中</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <LoadingSpinner size="lg" />
                  <span className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-slate-400'}`}>大</span>
                </div>
              </div>
            </div>

            {/* Dots */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Dots (三点跳跃)
              </h3>
              <div className="flex items-center gap-8">
                <LoadingDots size="sm" />
                <LoadingDots size="md" />
                <LoadingDots size="lg" />
              </div>
            </div>

            {/* Pulse */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Pulse (脉冲)
              </h3>
              <div className="flex items-center gap-8">
                <LoadingPulse size={32} />
                <LoadingPulse size={40} />
                <LoadingPulse size={48} />
              </div>
            </div>

            {/* Progress */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Progress (进度条)
              </h3>
              <div className="space-y-4">
                <LoadingProgress progress={progress} />
                <LoadingProgress indeterminate />
                <div className="flex gap-3">
                  <button
                    onClick={() => setProgress(Math.max(0, progress - 10))}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-white/10 hover:bg-white/15' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => setProgress(Math.min(100, progress + 10))}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      theme === 'dark' ? 'bg-white/10 hover:bg-white/15' : 'bg-slate-100 hover:bg-slate-200'
                    }`}
                  >
                    +10%
                  </button>
                  <span className={`px-3 py-1 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                    {progress}%
                  </span>
                </div>
              </div>
            </div>

            {/* Inline */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Inline (内联)
              </h3>
              <LoadingInline text="正在加载数据..." />
            </div>

            {/* Overlay */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                Overlay (遮罩)
              </h3>
              <button
                onClick={() => setShowOverlay(true)}
                className={`px-6 py-2 rounded-xl font-medium ${
                  theme === 'dark'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                显示加载遮罩
              </button>
            </div>
          </div>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 多种加载动画风格，适应不同场景
          </div>
        </div>
      </section>

      {/* Section 4: Skeleton 加载占位 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            4. Skeleton 加载占位
          </h2>

          <div className="space-y-6">
            {/* 文本骨架 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                文本 Skeleton
              </h3>
              <SkeletonText lines={3} lastLineWidth="70%" />
            </div>

            {/* 头像骨架 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                头像 Skeleton
              </h3>
              <div className="flex gap-4">
                <SkeletonAvatar size={40} shape="circle" />
                <SkeletonAvatar size={48} shape="circle" />
                <SkeletonAvatar size={56} shape="square" />
              </div>
            </div>

            {/* 卡片骨架 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                卡片 Skeleton
              </h3>
              <SkeletonCard avatar contentLines={2} />
            </div>

            {/* 列表骨架 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                列表 Skeleton
              </h3>
              <SkeletonList count={3} itemHeight={50} />
            </div>

            {/* 图片骨架 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                图片 Skeleton
              </h3>
              <SkeletonImage width="100%" height={150} />
            </div>
          </div>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 闪烁渐变动画，提升加载体验
          </div>
        </div>
      </section>

      {/* Section 5: Empty 空状态 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            5. Empty 空状态插图
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 无数据 */}
            <div
              className={`rounded-xl border p-4 ${
                theme === 'dark' ? 'bg-white/3 border-white/5' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <EmptyState
                icon={<span className="text-6xl">📭</span>}
                title="暂无数据"
                description="这里还没有任何内容"
              />
            </div>

            {/* 无搜索结果 */}
            <div
              className={`rounded-xl border p-4 ${
                theme === 'dark' ? 'bg-white/3 border-white/5' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <EmptyState
                icon={<span className="text-6xl">🔍</span>}
                title="未找到结果"
                description="尝试使用不同的关键词搜索"
              />
            </div>

            {/* 内联空状态 */}
            <div className="md:col-span-2">
              <div
                className={`flex items-center gap-3 py-4 px-4 rounded-xl ${
                  theme === 'dark' ? 'bg-white/5' : 'bg-slate-50'
                }`}
              >
                <span className="text-2xl">📋</span>
                <span
                  className={`text-sm ${
                    theme === 'dark' ? 'text-white/60' : 'text-slate-500'
                  }`}
                >
                  暂无内容
                </span>
              </div>
            </div>

            {/* 完整空状态 */}
            <div className="md:col-span-2">
              <EmptyState
                icon={<span className="text-8xl">📭</span>}
                title="暂无数据"
                description="这里还没有任何内容"
                actions={
                  <GlassButton variant="primary" onClick={() => alert('刷新数据')}>
                    刷新
                  </GlassButton>
                }
              />
            </div>
          </div>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 5 种空状态预设，支持自定义图标和文案
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      <LoadingOverlay
        show={showOverlay}
        text="加载中，请稍候..."
        blur
      />

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => setShowOverlay(false)}>
          <button className="absolute top-4 right-4 text-white/60 hover:text-white">
            ✕ 点击关闭
          </button>
        </div>
      )}
    </div>
  );
}
