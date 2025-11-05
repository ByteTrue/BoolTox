/**
 * 流体动画系统演示页面 - Task 2.5
 * 
 * 展示所有流体动画效果：
 * 1. 页面切换过渡动画
 * 2. 列表交错动画
 * 3. 卡片 3D 倾斜效果
 * 4. 按钮光泽扫过效果
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from './theme-provider';
import { 
  pageTransitionPresets, 
  staggerPresets,
  PageTransitionDirection,
} from '@/utils/fluid-animations';
import { TiltCard, TiltCardGroup } from './ui/tilt-card';
import { ShineButton, ShineButtonGroup } from './ui/shine-button';
import { getGlassStyle } from '@/utils/glass-layers';

const demoPages = [
  { id: '1', title: '页面 1', color: 'from-blue-500 to-cyan-500', icon: '🌊' },
  { id: '2', title: '页面 2', color: 'from-purple-500 to-pink-500', icon: '🌸' },
  { id: '3', title: '页面 3', color: 'from-orange-500 to-red-500', icon: '🔥' },
];

const demoItems = [
  { id: '1', title: '列表项 1', description: '这是第一个列表项', icon: '📱' },
  { id: '2', title: '列表项 2', description: '这是第二个列表项', icon: '💻' },
  { id: '3', title: '列表项 3', description: '这是第三个列表项', icon: '⌚' },
  { id: '4', title: '列表项 4', description: '这是第四个列表项', icon: '🎧' },
  { id: '5', title: '列表项 5', description: '这是第五个列表项', icon: '🎮' },
];

const demoCards = [
  { id: '1', title: 'React', description: '用于构建 UI 的 JavaScript 库', icon: '⚛️', color: 'from-cyan-400 to-blue-500' },
  { id: '2', title: 'TypeScript', description: 'JavaScript 的超集', icon: '📘', color: 'from-blue-500 to-indigo-500' },
  { id: '3', title: 'Framer Motion', description: '生产级 React 动画库', icon: '🎬', color: 'from-purple-500 to-pink-500' },
];

export function FluidAnimationsDemo() {
  const { theme } = useTheme();
  const [currentPageId, setCurrentPageId] = useState('1');
  const [transitionDirection, setTransitionDirection] = useState<PageTransitionDirection>('right');
  const [showList, setShowList] = useState(true);

  const currentPage = demoPages.find(p => p.id === currentPageId) || demoPages[0];

  const handlePageChange = (newPageId: string) => {
    const currentIndex = demoPages.findIndex(p => p.id === currentPageId);
    const newIndex = demoPages.findIndex(p => p.id === newPageId);
    setTransitionDirection(newIndex > currentIndex ? 'right' : 'left');
    setCurrentPageId(newPageId);
  };

  return (
    <div className="space-y-8 p-6">
      {/* 标题 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className={`text-4xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
          流体动画系统
        </h1>
        <p className={`text-lg ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
          Task 2.5: Apple 风格的流畅动画效果
        </p>
      </motion.div>

      {/* Section 1: 页面切换动画 */}
      <section className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            1. 页面切换过渡动画
          </h2>
          
          {/* 页面切换按钮 */}
          <div className="flex gap-3 mb-6">
            {demoPages.map((page) => (
              <button
                key={page.id}
                onClick={() => handlePageChange(page.id)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  currentPageId === page.id
                    ? theme === 'dark'
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'bg-slate-900 text-white shadow-lg'
                    : theme === 'dark'
                      ? 'bg-white/5 text-white/60 hover:bg-white/10'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {page.icon} {page.title}
              </button>
            ))}
          </div>

          {/* 页面内容 */}
          <div className="relative h-64 rounded-xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPageId}
                variants={pageTransitionPresets.swiftSlide}
                initial="initial"
                animate="animate"
                exit="exit"
                className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${currentPage.color} rounded-xl`}
              >
                <div className="text-center text-white">
                  <div className="text-6xl mb-4">{currentPage.icon}</div>
                  <h3 className="text-3xl font-bold">{currentPage.title}</h3>
                  <p className="text-white/80 mt-2">平滑的页面切换动画</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 使用 <code className="px-2 py-1 rounded bg-black/10">AnimatePresence</code> + <code className="px-2 py-1 rounded bg-black/10">motion.div</code> 实现流畅切换
          </div>
        </div>
      </section>

      {/* Section 2: 列表交错动画 */}
      <section className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            2. 列表交错动画 (Stagger)
          </h2>

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setShowList(!showList)}
              className={`px-4 py-2 rounded-xl font-medium transition-all ${
                theme === 'dark'
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }`}
            >
              {showList ? '隐藏列表' : '显示列表'}
            </button>
          </div>

          <AnimatePresence>
            {showList && (
              <motion.div
                variants={staggerPresets.default.container}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-3"
              >
                {demoItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={staggerPresets.default.item}
                    className={`p-4 rounded-xl border ${
                      theme === 'dark'
                        ? 'bg-white/5 border-white/10 hover:bg-white/10'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    } transition-colors cursor-pointer`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{item.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                          {item.title}
                        </h3>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`mt-4 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 使用 <code className="px-2 py-1 rounded bg-black/10">staggerChildren</code> 实现依次进场效果
          </div>
        </div>
      </section>

      {/* Section 3: 卡片 3D 倾斜效果 */}
      <section className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            3. 卡片 3D 倾斜效果
          </h2>

          <TiltCardGroup columns={3} gap="md">
            {demoCards.map((card) => (
              <TiltCard
                key={card.id}
                maxTilt={15}
                enableGlare
                className={`p-6 rounded-2xl border ${
                  theme === 'dark'
                    ? 'bg-white/5 border-white/10'
                    : 'bg-white border-slate-200'
                } shadow-lg cursor-pointer`}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-2xl mb-4`}>
                  {card.icon}
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  {card.title}
                </h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
                  {card.description}
                </p>
              </TiltCard>
            ))}
          </TiltCardGroup>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 鼠标悬停查看 3D 倾斜效果和光泽层
          </div>
        </div>
      </section>

      {/* Section 4: 按钮光泽扫过效果 */}
      <section className="space-y-4">
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-6 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            4. 按钮光泽扫过效果
          </h2>

          <div className="space-y-6">
            {/* Primary 按钮 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                主要按钮 (Primary)
              </h3>
              <ShineButtonGroup direction="horizontal" gap="md">
                <ShineButton variant="primary" size="md" shinePreset="fast">
                  快速扫过
                </ShineButton>
                <ShineButton variant="primary" size="md" shinePreset="default">
                  标准扫过
                </ShineButton>
                <ShineButton variant="primary" size="md" shinePreset="slow">
                  缓慢扫过
                </ShineButton>
              </ShineButtonGroup>
            </div>

            {/* Secondary 按钮 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                次要按钮 (Secondary)
              </h3>
              <ShineButtonGroup direction="horizontal" gap="md">
                <ShineButton variant="secondary" size="md" shinePreset="diagonal">
                  对角扫过
                </ShineButton>
                <ShineButton variant="secondary" size="md" shinePreset="vertical">
                  垂直扫过
                </ShineButton>
                <ShineButton variant="secondary" size="md" shinePreset="default">
                  标准扫过
                </ShineButton>
              </ShineButtonGroup>
            </div>

            {/* Ghost 按钮 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                幽灵按钮 (Ghost)
              </h3>
              <ShineButtonGroup direction="horizontal" gap="md">
                <ShineButton variant="ghost" size="sm" shinePreset="fast">
                  小尺寸
                </ShineButton>
                <ShineButton variant="ghost" size="md" shinePreset="default">
                  中尺寸
                </ShineButton>
                <ShineButton variant="ghost" size="lg" shinePreset="slow">
                  大尺寸
                </ShineButton>
              </ShineButtonGroup>
            </div>

            {/* 状态按钮 */}
            <div>
              <h3 className={`text-sm font-medium mb-3 ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                按钮状态
              </h3>
              <ShineButtonGroup direction="horizontal" gap="md">
                <ShineButton variant="primary" size="md" loading>
                  加载中...
                </ShineButton>
                <ShineButton variant="primary" size="md" disabled>
                  已禁用
                </ShineButton>
                <ShineButton variant="secondary" size="md" fullWidth>
                  全宽按钮
                </ShineButton>
              </ShineButtonGroup>
            </div>
          </div>

          <div className={`mt-6 text-sm ${theme === 'dark' ? 'text-white/60' : 'text-slate-500'}`}>
            💡 鼠标悬停查看光泽扫过动画
          </div>
        </div>
      </section>

      {/* 技术说明 */}
      <section>
        <div
          className={`rounded-2xl border p-6 ${theme === 'dark' ? 'bg-white/5' : 'bg-white/80'}`}
          style={getGlassStyle('PANEL', theme)}
        >
          <h2 className={`text-2xl font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            🎬 技术实现
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                核心技术
              </h3>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                <li>• <strong>Framer Motion</strong> - 动画库</li>
                <li>• <strong>AnimatePresence</strong> - 进入/退出动画</li>
                <li>• <strong>motion.div</strong> - 动画组件</li>
                <li>• <strong>Variants</strong> - 动画变体</li>
                <li>• <strong>Stagger Children</strong> - 交错动画</li>
                <li>• <strong>Spring Physics</strong> - 弹簧物理</li>
              </ul>
            </div>

            <div>
              <h3 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                动画参数
              </h3>
              <ul className={`space-y-2 text-sm ${theme === 'dark' ? 'text-white/70' : 'text-slate-600'}`}>
                <li>• <strong>stiffness</strong>: 300-400 (弹簧刚度)</li>
                <li>• <strong>damping</strong>: 25-35 (阻尼系数)</li>
                <li>• <strong>mass</strong>: 0.8-1.0 (质量)</li>
                <li>• <strong>duration</strong>: 0.25-0.45s (持续时间)</li>
                <li>• <strong>staggerDelay</strong>: 0.03-0.08s (交错延迟)</li>
                <li>• <strong>maxTilt</strong>: 12-15deg (最大倾斜)</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
