'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, Box, Package, Settings, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { drawerAnimation, modalBackdrop } from '@/lib/animation-config';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const containerRef = useFocusTrap({ isActive: isOpen });

  // 阻止背景滚动
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // ESC 键关闭
  React.useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const globalNavItems = [
    { href: '/', label: '首页', icon: <Home size={20} /> },
    { href: '/tools', label: '工具箱', icon: <Box size={20} /> },
    { href: '/docs', label: '文档', icon: <FileText size={20} /> },
  ];

  const toolsNavItems = [
    { href: '/tools', label: '概览', icon: <Home size={20} /> },
    { href: '/tools/installed', label: '我的插件', icon: <Box size={20} /> },
    { href: '/tools/market', label: '插件市场', icon: <Package size={20} /> },
    { href: '/tools/settings', label: '设置', icon: <Settings size={20} /> },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* 侧边栏 */}
          <motion.div
            ref={containerRef}
            variants={drawerAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.4, 0.0, 0.2, 1] }}
            className="fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-neutral-900 z-50 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="移动端导航菜单"
          >
        {/* 头部 */}
        <div className="sticky top-0 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center justify-between">
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            导航菜单
          </span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            aria-label="关闭菜单"
          >
            <X size={20} className="text-neutral-700 dark:text-neutral-300" />
          </button>
        </div>

        {/* 全局导航 */}
        <div className="p-4">
          <div className="mb-3 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
            主要功能
          </div>
          <nav className="space-y-1">
            {globalNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  isActive(item.href)
                    ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* 工具箱导航（仅在工具箱页面显示）*/}
        {pathname.startsWith('/tools') && (
          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
            <div className="mb-3 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
              工具箱
            </div>
            <nav className="space-y-1">
              {toolsNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                    isActive(item.href)
                      ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        )}
      </motion.div>
      </>
    )}
    </AnimatePresence>
  );
}
