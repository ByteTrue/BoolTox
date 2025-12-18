"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Tool } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import toolsData from "@/data/tools.json";

// 动态导入在线工具组件
import { Base64Converter } from "@/components/online-tools/base64-converter";
import { UrlEncoder } from "@/components/online-tools/url-encoder";

// 生成静态路由（只包含在线工具）
export function generateStaticParams() {
  const tools = toolsData as Tool[];
  return tools
    .filter((tool) => tool.type === "online")
    .map((tool) => ({
      id: tool.id,
    }));
}

export default function OnlineToolPage({ params }: { params: { id: string } }) {
  const tools = toolsData as Tool[];
  const tool = tools.find((t) => t.id === params.id && t.type === "online");

  if (!tool) {
    notFound();
  }

  // 根据工具 ID 渲染对应的组件
  const renderTool = () => {
    switch (tool.id) {
      case "base64":
        return <Base64Converter />;
      case "url-encoder":
        return <UrlEncoder />;
      default:
        return (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">该工具暂未实现</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{tool.name}</h1>
            <p className="text-muted-foreground text-sm">{tool.description}</p>
          </div>
        </div>

        <Link href={`/dashboard/tools/${tool.id}`}>
          <Button variant="outline">查看详情</Button>
        </Link>
      </div>

      {/* 工具容器 */}
      <div className="bg-card rounded-lg border p-6">{renderTool()}</div>
    </div>
  );
}
