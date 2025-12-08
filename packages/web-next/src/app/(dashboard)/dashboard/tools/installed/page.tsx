"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Play, Trash2, Settings, RefreshCw } from "lucide-react";

const installed = [
  {
    id: 1,
    name: "快速笔记",
    desc: "轻量 Markdown 记事，本地存储",
    status: "运行中",
    category: "效率",
  },
  { id: 2, name: "番茄钟", desc: "25/5 番茄工作法，桌面提醒", status: "已安装", category: "效率" },
  { id: 3, name: "截图工具", desc: "快捷截图，支持标注和分享", status: "运行中", category: "媒体" },
  {
    id: 4,
    name: "代码片段管理",
    desc: "管理和快速插入常用代码片段",
    status: "已安装",
    category: "开发",
  },
];

export default function InstalledToolsPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredTools = React.useMemo(() => {
    if (!searchQuery) return installed;
    const query = searchQuery.toLowerCase();
    return installed.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.desc.toLowerCase().includes(query) ||
        tool.category.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">已安装工具</h1>
            <p className="text-muted-foreground">管理本地和 Agent 同步的工具</p>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新状态
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input
            placeholder="搜索已安装的工具..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredTools.length} 个工具</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="group transition-all hover:-translate-y-1 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <CardTitle className="text-lg">{tool.name}</CardTitle>
                    <Badge
                      variant={tool.status === "运行中" ? "default" : "secondary"}
                      className="shrink-0"
                    >
                      {tool.status}
                    </Badge>
                  </div>
                  <CardDescription>{tool.desc}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" variant="default">
                    <Play className="mr-1 h-3 w-3" />
                    {tool.status === "运行中" ? "停止" : "启动"}
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Settings className="mr-1 h-3 w-3" />
                    设置
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="py-12 text-center">
          <div className="bg-secondary text-muted-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Search size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold">没有找到匹配的工具</h3>
          <p className="text-muted-foreground mb-4">试试其他搜索词或前往工具市场安装新工具</p>
          <Button variant="outline" onClick={() => setSearchQuery("")}>
            清除搜索
          </Button>
        </div>
      )}
    </div>
  );
}
