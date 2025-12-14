/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 外观设置页面
 * 包含主题切换和自定义主色调
 */

import { useTheme } from '../components/theme-provider';
import { useCustomThemeContext } from '../contexts/custom-theme-context';
import { ColorPicker } from '../components/ui/color-picker';
import { motion } from 'framer-motion';

export function AppearanceSettings() {
  const { theme, toggleTheme } = useTheme();
  const { config, updateTheme, resetTheme, defaultColors } = useCustomThemeContext();

  return (
    <div className="space-y-8">
      {/* 页面标题 */}
      <div>
        <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          外观设置
        </h2>
        <p className={`text-sm mt-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          自定义 BoolTox 的外观和主题
        </p>
      </div>

      {/* 主题模式 */}
      <section className="space-y-4">
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          主题模式
        </h3>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`flex-1 p-6 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-4xl mb-2">☀️</div>
            <div className="font-semibold">浅色模式</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => theme === 'light' && toggleTheme()}
            className={`flex-1 p-6 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="text-4xl mb-2">🌙</div>
            <div className="font-semibold">深色模式</div>
          </motion.button>
        </div>
      </section>

      {/* 主色调 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              主色调
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
              选择一个你喜欢的颜色作为主题色
            </p>
          </div>
          <button
            onClick={resetTheme}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-white/10 hover:bg-white/15 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
            }`}
          >
            恢复默认
          </button>
        </div>

        <ColorPicker
          value={config.primaryColor}
          onChange={(color) => updateTheme({ primaryColor: color })}
          presetColors={defaultColors}
        />
      </section>

      {/* 提示 */}
      <div
        className="rounded-lg border p-4"
        style={{
          background: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
          borderColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
        }}
      >
        <p className={`text-sm ${theme === 'dark' ? 'text-blue-200' : 'text-blue-700'}`}>
          💡 主色调会影响按钮、链接、高亮等 UI 元素的颜色。选择一个与你的品牌或喜好相符的颜色，让 BoolTox 更具个性！
        </p>
      </div>
    </div>
  );
}
