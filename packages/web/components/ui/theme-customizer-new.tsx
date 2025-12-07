'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
  color: string; // HSL 格式
  preview: string; // Hex 颜色（用于预览）
}

const THEMES: Theme[] = [
  {
    id: 'blue',
    name: '电光蓝',
    color: '210 100% 56%',
    preview: '#0EA5E9',
  },
  {
    id: 'purple',
    name: '紫罗兰',
    color: '270 80% 65%',
    preview: '#A855F7',
  },
  {
    id: 'green',
    name: '翡翠绿',
    color: '142 76% 36%',
    preview: '#059669',
  },
  {
    id: 'orange',
    name: '热情橙',
    color: '25 95% 53%',
    preview: '#F97316',
  },
  {
    id: 'pink',
    name: '樱花粉',
    color: '330 81% 60%',
    preview: '#EC4899',
  },
  {
    id: 'cyan',
    name: '青色',
    color: '189 94% 43%',
    preview: '#06B6D4',
  },
  {
    id: 'indigo',
    name: '靛蓝',
    color: '239 84% 67%',
    preview: '#6366F1',
  },
  {
    id: 'rose',
    name: '玫瑰红',
    color: '351 83% 63%',
    preview: '#F43F5E',
  },
];

export const ThemeCustomizer = React.memo(function ThemeCustomizer() {
  const [open, setOpen] = React.useState(false);
  const [currentTheme, setCurrentTheme] = React.useState('blue');
  const [mounted, setMounted] = React.useState(false);

  // 应用主题 - 使用 useCallback 避免重复创建
  const applyTheme = React.useCallback((themeId: string) => {
    const theme = THEMES.find((t) => t.id === themeId);
    if (!theme) return;

    // 设置 data-accent-color 属性
    document.documentElement.setAttribute('data-accent-color', themeId);

    // 保存到 localStorage
    localStorage.setItem('accent-color', themeId);
  }, []);

  // 确保只在客户端渲染 Portal
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // 从 localStorage 读取主题
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('accent-color') || 'blue';
    setCurrentTheme(savedTheme);
    applyTheme(savedTheme);
  }, [applyTheme]);

  // 切换主题 - 使用 useCallback
  const handleThemeChange = React.useCallback((themeId: string) => {
    setCurrentTheme(themeId);
    applyTheme(themeId);

    const theme = THEMES.find((t) => t.id === themeId);
    toast.success(`主题已切换`, {
      description: `当前主题：${theme?.name}`,
    });

    // 关闭弹窗，减少渲染负担
    setOpen(false);
  }, [applyTheme]);

  return (
    <>
      {/* 触发按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-lg border border-border bg-background p-2 hover:bg-accent transition-colors"
        title="主题定制"
      >
        <Palette size={18} />
        {/* 当前主题颜色指示器 */}
        <div
          className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background"
          style={{ backgroundColor: THEMES.find((t) => t.id === currentTheme)?.preview }}
        />
      </button>

      {/* 定制器面板 - 使用 Portal 挂载到 body */}
      {mounted && createPortal(
        <AnimatePresence>
          {open && (
            <>
              {/* 背景遮罩 - 移除 backdrop-blur 提升性能 */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-50 bg-black/60"
              />

            {/* 面板 - 居中弹窗 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-1/2 top-[20%] z-50 w-full max-w-lg -translate-x-1/2"
            >
              <div className="flex flex-col rounded-2xl border border-border bg-background shadow-2xl">
                {/* 头部 */}
                <div className="flex items-center justify-between border-b border-border p-6">
                  <div>
                    <h2 className="text-lg font-semibold">主题定制</h2>
                    <p className="text-sm text-muted-foreground">选择你喜欢的主色调</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-2 hover:bg-accent transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* 内容 */}
                <div className="max-h-[500px] overflow-y-auto p-6">
                  <div className="space-y-6">
                    {/* 主题选择器 */}
                    <div>
                      <h3 className="mb-4 text-sm font-medium">主色调</h3>
                      <div className="grid grid-cols-2 gap-3">
                        {THEMES.map((theme) => (
                          <button
                            key={theme.id}
                            onClick={() => handleThemeChange(theme.id)}
                            className={cn(
                              'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                              'hover:scale-105 active:scale-95',
                              currentTheme === theme.id
                                ? 'border-current shadow-md'
                                : 'border-border hover:border-muted-foreground/50'
                            )}
                            style={{
                              borderColor: currentTheme === theme.id ? theme.preview : undefined,
                            }}
                          >
                            {/* 颜色预览圆 */}
                            <div className="relative">
                              <div
                                className="h-12 w-12 rounded-full shadow-lg transition-transform"
                                style={{ backgroundColor: theme.preview }}
                              />
                              {currentTheme === theme.id && (
                                <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in-50 duration-200">
                                  <div className="rounded-full bg-white p-1">
                                    <Check size={16} className="text-black" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* 主题名称 */}
                            <span
                              className={cn(
                                'text-sm font-medium transition-colors',
                                currentTheme === theme.id ? 'text-foreground' : 'text-muted-foreground'
                              )}
                            >
                              {theme.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 说明 - 移除预览区域提升性能 */}
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <p className="text-xs text-muted-foreground">
                        💡 选择颜色后，整个网站会立即应用新主题。设置会自动保存到本地。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 底部 */}
                <div className="border-t border-border p-6">
                  <button
                    onClick={() => {
                      handleThemeChange('blue');
                      toast.info('已重置为默认主题');
                    }}
                    className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                  >
                    重置为默认
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
});
