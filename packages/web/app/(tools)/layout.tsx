'use client';

import { ToolsSidebar } from '@/components/layout/tools-sidebar';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-neutral-950 transition-colors overflow-hidden">
      <div className="flex h-full">
        <ToolsSidebar />
        <main className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
