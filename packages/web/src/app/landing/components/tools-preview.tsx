"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ToolCard } from "@/components/tool-card";
import { Tool } from "@/types/tool";
import toolsData from "@/data/tools.json";

export function ToolsPreview() {
  const tools = toolsData as Tool[];
  // 只显示在线工具，最多 4 个
  const onlineTools = tools.filter((tool) => tool.type === "online").slice(0, 4);

  return (
    <section className="bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">热门在线工具</h2>
          <p className="text-muted-foreground text-lg">零安装，浏览器直接运行，所有数据本地处理</p>
        </div>

        {/* Tools Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {onlineTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard/tools">查看全部工具</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
