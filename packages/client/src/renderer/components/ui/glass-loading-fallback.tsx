/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { getGlassStyle } from '@/utils/glass-layers';

/**
 * Apple 风格的懒加载 Fallback 组件
 * 用于路由懒加载时的占位显示
 */
export function GlassLoadingFallback() {
  const { theme } = useTheme();

  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <motion.div
        className="flex flex-col items-center gap-6 rounded-3xl border p-12"
        style={getGlassStyle('CARD', theme, {
          withBorderGlow: true,
          withInnerShadow: true,
        })}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Apple 风格的加载动画 */}
        <div className="relative h-16 w-16">
          {/* 外圈旋转 */}
          <motion.div
            className="absolute inset-0 rounded-full border-4"
            style={{
              borderColor:
                theme === 'dark' ? 'rgba(101, 187, 233, 0.3)' : 'rgba(101, 187, 233, 0.2)',
              borderTopColor:
                theme === 'dark' ? 'rgba(101, 187, 233, 0.8)' : 'rgba(101, 187, 233, 0.6)',
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            }}
          />

          {/* 内圈脉冲 */}
          <motion.div
            className="absolute inset-3 rounded-full"
            style={{
              background:
                theme === 'dark'
                  ? 'radial-gradient(circle, rgba(101, 187, 233, 0.4), transparent 70%)'
                  : 'radial-gradient(circle, rgba(101, 187, 233, 0.3), transparent 70%)',
            }}
            animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.5, 0.8, 0.5] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* 加载文本 */}
        <motion.p
          className={`text-sm font-medium ${theme === 'dark' ? 'text-white/80' : 'text-slate-700'}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          加载中...
        </motion.p>
      </motion.div>
    </div>
  );
}
