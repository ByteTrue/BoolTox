'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Box, Package, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  icon: React.ReactNode;
  href: string;
  exact?: boolean;
  children: React.ReactNode;
}

function SidebarItem({ icon, href, exact = false, children }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
        isActive
          ? "bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
          : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      )}
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

export function ToolsSidebar() {
  return (
    <aside className="sticky top-16 w-60 h-[calc(100vh-4rem)] border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors overflow-y-auto pt-4">
      <div className="px-4">
        {/* 分组标题 */}
        <div className="mb-3 px-3 text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
          工具箱
        </div>

        {/* 导航项 */}
        <nav className="space-y-1">
          <SidebarItem icon={<Home size={18} />} href="/tools" exact>
            概览
          </SidebarItem>
          <SidebarItem icon={<Box size={18} />} href="/tools/installed">
            我的插件
          </SidebarItem>
          <SidebarItem icon={<Package size={18} />} href="/tools/market">
            插件市场
          </SidebarItem>
          <SidebarItem icon={<Settings size={18} />} href="/tools/settings">
            设置
          </SidebarItem>
        </nav>
      </div>
    </aside>
  );
}
