import { ToolsSidebar } from '@/components/layout/tools-sidebar';

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 transition-colors">
      <div className="flex pt-0">
        <ToolsSidebar />
        <main className="flex-1 px-6 pt-4 pb-6 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
