/**
 * 主题定制器组件
 * 允许用户自定义主色调和动画速度
 */

'use client';

import React from 'react';
import { Palette, Zap, X } from 'lucide-react';
import { useHotkeys } from '@/hooks/use-hotkeys';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useUserPreferences, ACCENT_COLORS, type AccentColor, type AnimationSpeed } from '@/store/user-preferences';

const ACCENT_COLOR_OPTIONS: { id: AccentColor; name: string; color: string }[] = [
  { id: 'blue', name: '系统蓝', color: '#3b82f6' },
  { id: 'purple', name: '活力紫', color: '#a855f7' },
  { id: 'green', name: '清新绿', color: '#22c55e' },
  { id: 'orange', name: '热情橙', color: '#f97316' },
  { id: 'pink', name: '甜美粉', color: '#ec4899' },
];

const ANIMATION_SPEED_OPTIONS: { id: AnimationSpeed; name: string; description: string }[] = [
  { id: 'disabled', name: '禁用', description: '完全关闭动画效果' },
  { id: 'fast', name: '快速', description: '更快的动画速度' },
  { id: 'normal', name: '标准', description: '推荐的动画速度' },
  { id: 'slow', name: '慢速', description: '更慢的动画，便于观察' },
];

export function ThemeCustomizer() {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = useFocusTrap({ isActive: isOpen });
  const { accentColor, setAccentColor, animationSpeed, setAnimationSpeed } = useUserPreferences();

  // Cmd+T 打开
  useHotkeys({
    keys: 'mod+t',
    callback: () => setIsOpen(true),
    description: '打开主题定制器',
  });

  // ESC 关闭
  useHotkeys({
    keys: 'escape',
    callback: () => setIsOpen(false),
    enabled: isOpen,
  });

  // 应用主题色到文档（使用 data 属性）
  React.useEffect(() => {
    document.documentElement.setAttribute('data-accent-color', accentColor);
  }, [accentColor]);

  // 应用动画速度
  React.useEffect(() => {
    document.documentElement.setAttribute('data-animation-speed', animationSpeed);

    // 直接修改 CSS 变量控制动画时间
    const multiplier = animationSpeed === 'disabled' ? 0.01 :
                       animationSpeed === 'fast' ? 0.7 :
                       animationSpeed === 'slow' ? 1.5 : 1;

    document.documentElement.style.setProperty('--animation-multiplier', String(multiplier));
  }, [animationSpeed]);

  return (
    <>
      {/* 浮动按钮（右下角） */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-40 p-4 rounded-full bg-primary-500 text-white shadow-soft-lg hover:shadow-soft-lg transition-transform duration-150 hover:scale-105 active:scale-95"
        title="主题定制 (Cmd+T)"
        aria-label="打开主题定制器"
      >
        <Palette size={20} />
      </button>

      {/* 定制器面板 */}
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* 面板 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              ref={containerRef}
              className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-2xl shadow-soft-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden"
              role="dialog"
              aria-modal="true"
              aria-labelledby="theme-customizer-title"
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-500 dark:text-primary-400">
                    <Palette size={24} />
                  </div>
                  <div>
                    <h2
                      id="theme-customizer-title"
                      className="text-2xl font-bold text-neutral-900 dark:text-neutral-100"
                    >
                      主题定制
                    </h2>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">
                      个性化你的 BoolTox
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors active:scale-95"
                  aria-label="关闭"
                >
                  <X size={20} className="text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-8">
                {/* 主题色选择 */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                    主题色
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    {ACCENT_COLOR_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAccentColor(option.id)}
                        className={`relative p-4 rounded-xl border-2 transition-all hover:scale-[1.01] active:scale-95 ${
                          accentColor === option.id
                            ? 'border-current shadow-soft-lg'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                        style={{ color: option.color }}
                        aria-label={`选择${option.name}`}
                        aria-pressed={accentColor === option.id}
                      >
                        <div
                          className="w-full h-12 rounded-lg mb-2"
                          style={{ backgroundColor: option.color }}
                        />
                        <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 text-center">
                          {option.name}
                        </p>
                        {accentColor === option.id && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-white dark:bg-neutral-900 rounded-full flex items-center justify-center">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: option.color }}
                            />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 动画速度 */}
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-primary-500" />
                    动画速度
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {ANIMATION_SPEED_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setAnimationSpeed(option.id)}
                        className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.01] active:scale-95 ${
                          animationSpeed === option.id
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                        }`}
                        aria-label={`选择${option.name}速度`}
                        aria-pressed={animationSpeed === option.id}
                      >
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                          {option.name}
                        </div>
                        <div className="text-sm text-neutral-600 dark:text-neutral-400">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 预览提示 */}
                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50">
                  <p className="text-sm text-primary-900 dark:text-primary-100">
                    💡 提示：设置会立即生效，并自动保存到本地
                  </p>
                </div>
              </div>

              {/* 底部提示 */}
              <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span>
                    按{' '}
                    <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono">
                      Cmd+T
                    </kbd>{' '}
                    快速打开
                  </span>
                  <button
                    onClick={() => {
                      setAccentColor('blue');
                      setAnimationSpeed('normal');
                    }}
                    className="text-primary-500 dark:text-primary-400 hover:underline"
                  >
                    恢复默认
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
