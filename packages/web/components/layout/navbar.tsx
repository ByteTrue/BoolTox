'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';
import { AgentStatus } from '@/components/tools/agent-status';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: '/', label: '首页', exact: true },
    { href: '/tools', label: '工具箱' },
    { href: '/docs', label: '文档' },
    // 未来：博客、论坛等
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className="sticky top-0 z-50 h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl transition-colors"
        aria-label="主导航"
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          {/* 左侧：Logo + 导航链接 */}
          <div className="flex items-center gap-8">
            {/* 移动端汉堡菜单 */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              aria-label="打开导航菜单"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              <Menu size={20} className="text-neutral-700 dark:text-neutral-300" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group" aria-label="返回首页">
              <Logo className="h-8 w-8 transition-transform group-hover:scale-110" />
              <span className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                BoolTox
              </span>
            </Link>

            {/* 桌面端导航链接 */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                    isActive(item.href, item.exact)
                      ? "text-primary-600 dark:text-primary-400"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  )}
                  aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
                >
                  {item.label}
                  {/* 活动指示器 */}
                  {isActive(item.href, item.exact) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500 dark:bg-primary-400" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* 右侧：工具栏 */}
          <div className="flex items-center gap-3">
            <AgentStatus />
            <ThemeToggle />
            {/* 未来：用户菜单 */}
          </div>
        </div>
      </nav>

      {/* 移动端导航菜单 */}
      <MobileNav isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
