import { useState, type ReactElement } from "react";
import { motion } from "framer-motion";
import { Sparkles, Heart, Coffee, Zap, Star, Moon, Sun } from "lucide-react";
import { cardHover, iconButtonInteraction, buttonInteraction } from "@/utils/animation-presets";

interface Card {
  id: string;
  title: string;
  description: string;
  icon: ReactElement;
  color: string;
}

const cards: Card[] = [
  {
    id: "1",
    title: "创意灵感",
    description: "玻璃拟态设计让界面更具现代感和层次感",
    icon: <Sparkles className="h-6 w-6" />,
    color: "from-blue-400 to-blue-500",
  },
  {
    id: "2",
    title: "优雅设计",
    description: "半透明效果营造出轻盈飘逸的视觉体验",
    icon: <Heart className="h-6 w-6" />,
    color: "from-pink-400 to-pink-500",
  },
  {
    id: "3",
    title: "专注工作",
    description: "模糊背景帮助用户专注于当前内容",
    icon: <Coffee className="h-6 w-6" />,
    color: "from-orange-400 to-orange-500",
  },
  {
    id: "4",
    title: "高性能",
    description: "backdrop-filter 提供原生级别的性能体验",
    icon: <Zap className="h-6 w-6" />,
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "5",
    title: "现代美学",
    description: "结合渐变和阴影打造精致的视觉效果",
    icon: <Star className="h-6 w-6" />,
    color: "from-pink-500 to-rose-400",
  },
  {
    id: "6",
    title: "主题切换",
    description: "浅蓝、淡粉、淡橙的柔和配色方案",
    icon: <Moon className="h-6 w-6" />,
    color: "from-orange-500 to-amber-400",
  },
];

export default function GlassmorphismDemo() {
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(16);
  const [opacity, setOpacity] = useState(0.15);
  const [isDark, setIsDark] = useState(true);

  // 主题样式配置
  const themeStyles = isDark
    ? {
        bg: "bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900",
        text: "text-white",
        textSecondary: "text-white/80",
        textTertiary: "text-white/60",
        blob1: "bg-blue-400/20",
        blob2: "bg-pink-400/20",
        blob3: "bg-orange-400/20",
        cardBg: `rgba(255, 255, 255, ${opacity})`,
        cardBorder: "rgba(255, 255, 255, 0.2)",
        cardShadow: "shadow-2xl shadow-black/20",
        codeBg: "bg-black/30",
        expandBg: "rgba(255, 255, 255, 0.05)",
      }
    : {
        bg: "bg-gradient-to-br from-blue-100 via-pink-50 to-orange-100",
        text: "text-slate-800",
        textSecondary: "text-slate-600",
        textTertiary: "text-slate-500",
        blob1: "bg-blue-300/50",
        blob2: "bg-pink-300/50",
        blob3: "bg-orange-300/50",
        cardBg: `rgba(255, 255, 255, ${opacity})`,
        cardBorder: "rgba(255, 255, 255, 0.8)",
        cardShadow: "shadow-xl shadow-blue-200/40",
        codeBg: "bg-white/40",
        expandBg: "rgba(255, 255, 255, 0.5)",
      };

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-500 ${themeStyles.bg}`}>
      {/* 装饰性背景元素 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -left-4 top-20 h-64 w-64 animate-pulse rounded-full blur-3xl ${themeStyles.blob1}`} />
        <div className={`absolute right-10 top-40 h-96 w-96 animate-pulse rounded-full blur-3xl ${themeStyles.blob2}`} style={{ animationDelay: '1s' }} />
        <div className={`absolute bottom-20 left-1/3 h-80 w-80 animate-pulse rounded-full blur-3xl ${themeStyles.blob3}`} style={{ animationDelay: '0.5s' }} />
      </div>

      {/* 主内容区 */}
      <div className="relative z-10 flex-1 p-8">
        {/* 头部标题卡片 - 玻璃拟态效果 */}
        <motion.div
          {...cardHover}
          className={`mx-auto mb-8 max-w-4xl rounded-3xl border p-8 transition-shadow duration-250 ease-swift ${themeStyles.cardShadow}`}
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.cardBorder,
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className={`mb-2 text-4xl font-bold drop-shadow-lg ${themeStyles.text}`}>
                玻璃拟态设计演示 ✨
              </h1>
              <p className={`text-lg drop-shadow ${themeStyles.textSecondary}`}>
                探索现代 UI 设计中最流行的视觉风格 - Glassmorphism
              </p>
            </div>

            {/* 主题切换按钮 */}
            <motion.button
              {...iconButtonInteraction}
              onClick={() => setIsDark(!isDark)}
              className={`flex h-12 w-12 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-250 ease-swift ${themeStyles.cardShadow}`}
              style={{
                background: themeStyles.cardBg,
                borderColor: themeStyles.cardBorder,
                backdropFilter: `blur(${blurAmount}px)`,
                WebkitBackdropFilter: `blur(${blurAmount}px)`,
              }}
            >
              {isDark ? (
                <Sun className={`h-5 w-5 ${themeStyles.text}`} />
              ) : (
                <Moon className={`h-5 w-5 ${themeStyles.text}`} />
              )}
            </motion.button>
          </div>

          {/* 控制面板 */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={`mb-2 block text-sm font-semibold ${themeStyles.textSecondary}`}>
                模糊程度: {blurAmount}px
              </label>
              <input
                type="range"
                min="0"
                max="30"
                value={blurAmount}
                onChange={(e) => setBlurAmount(Number(e.target.value))}
                className={`h-2 w-full cursor-pointer appearance-none rounded-lg ${isDark ? 'bg-white/30' : 'bg-blue-200'} ${isDark ? 'accent-blue-400' : 'accent-blue-500'}`}
              />
            </div>
            <div>
              <label className={`mb-2 block text-sm font-semibold ${themeStyles.textSecondary}`}>
                透明度: {(opacity * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="0.7"
                step="0.01"
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                className={`h-2 w-full cursor-pointer appearance-none rounded-lg ${isDark ? 'bg-white/30' : 'bg-pink-200'} ${isDark ? 'accent-pink-400' : 'accent-pink-500'}`}
              />
            </div>
          </div>
        </motion.div>

        {/* 卡片网格 */}
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <motion.div
              {...cardHover}
              key={card.id}
              onClick={() => setActiveCard(activeCard === card.id ? null : card.id)}
              className={`group cursor-pointer rounded-2xl border p-6 transition-shadow duration-250 ease-swift ${themeStyles.cardShadow}`}
              style={{
                background: themeStyles.cardBg,
                borderColor: themeStyles.cardBorder,
                backdropFilter: `blur(${blurAmount}px)`,
                WebkitBackdropFilter: `blur(${blurAmount}px)`,
              }}
            >
              {/* 图标背景 */}
              <div
                className={`mb-4 inline-flex rounded-2xl bg-gradient-to-br p-3 shadow-lg ${card.color} ${isDark ? 'text-white' : 'text-white'}`}
              >
                {card.icon}
              </div>

              <h3 className={`mb-2 text-xl font-bold drop-shadow ${themeStyles.text}`}>
                {card.title}
              </h3>
              <p className={`text-sm drop-shadow-sm ${themeStyles.textSecondary}`}>
                {card.description}
              </p>

              {/* 展开的详情 */}
              {activeCard === card.id && (
                <div
                  className="mt-4 animate-fadeIn rounded-xl border p-4"
                  style={{
                    background: themeStyles.expandBg,
                    borderColor: themeStyles.cardBorder,
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <p className={`text-xs ${themeStyles.textSecondary}`}>
                    这是一个交互式演示。点击卡片可以查看更多信息。玻璃拟态效果通过
                    backdrop-filter 属性实现,创造出独特的透明毛玻璃质感。
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* 底部信息卡 */}
        <div
          className={`mx-auto mt-8 max-w-4xl rounded-2xl border p-6 ${themeStyles.cardShadow}`}
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.cardBorder,
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        >
          <h2 className={`mb-3 text-2xl font-bold drop-shadow ${themeStyles.text}`}>
            核心 CSS 属性
          </h2>
          <div className="space-y-2 font-mono text-sm">
            <div className={`rounded-lg p-3 ${themeStyles.codeBg} ${themeStyles.textSecondary}`}>
              <span className={isDark ? 'text-blue-300' : 'text-blue-600'}>background:</span>{" "}
              {themeStyles.cardBg};
            </div>
            <div className={`rounded-lg p-3 ${themeStyles.codeBg} ${themeStyles.textSecondary}`}>
              <span className={isDark ? 'text-pink-300' : 'text-pink-600'}>backdrop-filter:</span> blur(
              {blurAmount}px);
            </div>
            <div className={`rounded-lg p-3 ${themeStyles.codeBg} ${themeStyles.textSecondary}`}>
              <span className={isDark ? 'text-orange-300' : 'text-orange-600'}>border:</span> 1px solid {themeStyles.cardBorder};
            </div>
          </div>
        </div>
      </div>

      {/* 浮动按钮示例 */}
      <div className="fixed bottom-8 right-8 z-20">
        <motion.button
          {...buttonInteraction}
          className={`group flex items-center gap-2 rounded-full border px-6 py-3 font-semibold transition-[background-color,border-color,transform] duration-250 ease-swift ${themeStyles.text} ${themeStyles.cardShadow}`}
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.cardBorder,
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        >
          <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
          <span>玻璃按钮</span>
        </motion.button>
      </div>
    </div>
  );
}
