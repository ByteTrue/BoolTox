export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* 导航栏 TODO */}

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* 侧边栏 TODO */}

          {/* 主内容区 */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
