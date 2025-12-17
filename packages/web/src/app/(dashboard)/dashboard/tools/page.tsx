"use client";

import { useMemo, useState } from "react";
import { ToolCard } from "@/components/tool-card";
import { ToolFilter } from "@/components/tool-filter";
import { Tool, ToolType } from "@/types/tool";
import toolsData from "@/data/tools.json";

export default function ToolsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"all" | ToolType>("all");

  // 类型转换：JSON 数据转为 Tool 类型
  const tools = toolsData as Tool[];

  // 过滤工具
  const filteredTools = useMemo(() => {
    let result = [...tools];

    // 根据搜索词过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.description.toLowerCase().includes(query) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 根据类型过滤
    if (selectedType !== "all") {
      result = result.filter((tool) => tool.type === selectedType);
    }

    return result;
  }, [searchQuery, selectedType, tools]);

  // 统计数据
  const stats = useMemo(() => {
    return {
      total: tools.length,
      online: tools.filter((t) => t.type === "online").length,
      client: tools.filter((t) => t.type === "client").length,
      available: tools.filter((t) => t.status === "available").length,
    };
  }, [tools]);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">工具箱</h1>
        <p className="text-muted-foreground">
          共 {stats.total} 个工具 · {stats.online} 个在线工具 · {stats.client} 个 Client 工具 ·{" "}
          {stats.available} 个可用
        </p>
      </div>

      {/* 筛选栏 */}
      <ToolFilter
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
      />

      {/* 工具网格 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {/* 空状态 */}
      {filteredTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-lg">没有找到匹配的工具</p>
          <p className="text-muted-foreground text-sm">尝试调整搜索条件或筛选类型</p>
        </div>
      )}
    </div>
  );
}
