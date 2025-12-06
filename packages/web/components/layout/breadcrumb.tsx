'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href: string;
}

export function Breadcrumb() {
  const pathname = usePathname();

  // 根据路径生成面包屑
  const breadcrumbs = React.useMemo(() => {
    const items: BreadcrumbItem[] = [{ label: '首页', href: '/' }];

    if (pathname.startsWith('/tools')) {
      items.push({ label: '工具箱', href: '/tools' });

      if (pathname.startsWith('/tools/installed')) {
        items.push({ label: '我的插件', href: '/tools/installed' });
      } else if (pathname.startsWith('/tools/market')) {
        items.push({ label: '插件市场', href: '/tools/market' });

        // 插件详情
        const match = pathname.match(/\/tools\/market\/([^/]+)/);
        if (match) {
          // 这里应该从插件数据中获取插件名，暂时使用 ID
          items.push({ label: '插件详情', href: pathname });
        }
      } else if (pathname.startsWith('/tools/settings')) {
        items.push({ label: '设置', href: '/tools/settings' });
      }
    } else if (pathname.startsWith('/plugin')) {
      items.push({ label: '工具箱', href: '/tools' });
      items.push({ label: '插件运行', href: pathname });
    } else if (pathname.startsWith('/docs')) {
      items.push({ label: '文档', href: '/docs' });
    }

    return items;
  }, [pathname]);

  // 只有一个面包屑时不显示
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm mb-6" aria-label="面包屑导航">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && (
            <ChevronRight size={14} className="text-neutral-400 dark:text-neutral-600" />
          )}
          {index < breadcrumbs.length - 1 ? (
            <Link
              href={crumb.href}
              className="text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-neutral-900 dark:text-neutral-100 font-medium">
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
