'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Search } from 'lucide-react';
import { Logo } from './logo';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeCustomizer } from '@/components/ui/theme-customizer-new';
import { openCommandPalette } from '@/components/ui/command-palette-trigger';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { href: '/resources', label: '资源导航' },
    { href: '/tools', label: '工具箱' },
    { href: 'https://blog.booltox.dev', label: '博客', external: true },
    { href: 'https://forum.booltox.dev', label: '论坛', external: true },
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
        className="sticky top-0 z-50 h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors"
        aria-label="主导航"
        style={{ contentVisibility: 'auto' }}
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
              {navItems.map((item) => {
                const isExternal = 'external' in item && item.external;
                const LinkComponent = isExternal ? 'a' : Link;
                const linkProps = isExternal
                  ? { href: item.href, target: '_blank', rel: 'noopener noreferrer' }
                  : { href: item.href, prefetch: true };

                return (
                  <LinkComponent
                    key={item.href}
                    {...linkProps}
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      !isExternal && isActive(item.href, 'exact' in item && item.exact)
                        ? "text-primary-600 dark:text-primary-400"
                        : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    )}
                    aria-current={!isExternal && isActive(item.href, 'exact' in item && item.exact) ? 'page' : undefined}
                  >
                    {item.label}
                    {/* 活动指示器 */}
                    {!isExternal && isActive(item.href, 'exact' in item && item.exact) && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500 dark:bg-primary-400" />
                    )}
                  </LinkComponent>
                );
              })}
            </div>
          </div>

          {/* 右侧：工具栏 */}
          <div className="flex items-center gap-3">
            {/* 搜索触发按钮 */}
            <button
              onClick={openCommandPalette}
              className="hidden md:flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Search size={14} />
              <span>搜索...</span>
              <kbd className="ml-auto hidden lg:inline-block rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>

            <ThemeCustomizer />
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
