import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import type { ReactNode, RefObject } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  scrollRef?: RefObject<HTMLDivElement>;
}

/**
 * Apple-style 页面头部 - 超大标题 + 滚动收缩效果
 * 参考 Safari、App Store、系统设置的大标题设计
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  scrollRef,
}: PageHeaderProps) {
  const defaultRef = useRef<HTMLDivElement>(null);
  const targetRef = scrollRef || defaultRef;

  // 监听滚动位置
  const { scrollY } = useScroll({
    container: targetRef,
  });

  // 标题缩放: 1 → 0.7 (滚动 0-300px)
  const titleScale = useTransform(scrollY, [0, 300], [1, 0.7]);
  
  // 标题透明度: 1 → 0 (滚动 0-200px)
  const titleOpacity = useTransform(scrollY, [0, 200], [1, 0]);
  
  // 副标题透明度: 1 → 0 (滚动 0-150px)
  const subtitleOpacity = useTransform(scrollY, [0, 150], [1, 0]);

  return (
    <header className="px-8 pt-8 pb-6 sticky top-0 z-10 bg-[var(--shell-background)]/80 backdrop-blur-xl">
      <div className="flex items-start justify-between gap-6">
        {/* 左侧: 标题区 */}
        <div className="flex-1 min-w-0">
          <motion.h1
            style={{
              scale: titleScale,
              opacity: titleOpacity,
              transformOrigin: 'left center',
            }}
            className="text-5xl font-semibold tracking-tight text-[var(--text-primary)]"
          >
            {title}
          </motion.h1>
          
          {subtitle && (
            <motion.p
              style={{ opacity: subtitleOpacity }}
              className="mt-2 text-[17px] text-[var(--text-secondary)]"
            >
              {subtitle}
            </motion.p>
          )}
        </div>

        {/* 右侧: 操作区 */}
        {actions && (
          <div className="flex-none">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * 工具栏 - 滚动后显示小标题
 */
interface ToolbarProps {
  title?: string;
  show: boolean;
  children?: ReactNode;
}

export function Toolbar({ title, show, children }: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: show ? 1 : 0,
        y: show ? 0 : -10,
      }}
      transition={{ duration: 0.2 }}
      className="h-12 px-8 flex items-center justify-between border-b border-[var(--shell-border)] bg-[var(--shell-background)]/95 backdrop-blur-xl"
    >
      {title && (
        <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
          {title}
        </h2>
      )}
      {children}
    </motion.div>
  );
}
