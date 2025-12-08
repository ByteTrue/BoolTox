"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Download, Info, Star, TrendingUp, Sparkles } from "lucide-react";

const market = [
  {
    id: 1,
    name: "图片压缩",
    desc: "离线压缩/转换，保护隐私",
    tag: "媒体",
    downloads: "12k",
    rating: 4.8,
    featured: true,
  },
  {
    id: 2,
    name: "AI 总结",
    desc: "选中文本一键摘要，双语支持",
    tag: "AI",
    downloads: "8.5k",
    rating: 4.9,
    featured: true,
  },
  {
    id: 3,
    name: "代码格式化",
    desc: "多语言格式化，遵循项目配置",
    tag: "开发",
    downloads: "15k",
    rating: 4.7,
    featured: false,
  },
  {
    id: 4,
    name: "颜色选择器",
    desc: "屏幕取色，支持多种格式",
    tag: "设计",
    downloads: "6.2k",
    rating: 4.6,
    featured: false,
  },
  {
    id: 5,
    name: "Markdown 预览",
    desc: "实时预览 Markdown 文档",
    tag: "文档",
    downloads: "9.8k",
    rating: 4.5,
    featured: false,
  },
  {
    id: 6,
    name: "JSON 格式化",
    desc: "格式化和验证 JSON 数据",
    tag: "开发",
    downloads: "11k",
    rating: 4.8,
    featured: false,
  },
];

const categories = [
  { id: "all", name: "全部" },
  { id: "ai", name: "AI" },
  { id: "dev", name: "开发" },
  { id: "design", name: "设计" },
  { id: "media", name: "媒体" },
  { id: "doc", name: "文档" },
];

export default function ToolMarketPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  const filteredTools = React.useMemo(() => {
    let result = [...market];

    if (selectedCategory !== "all") {
      result = result.filter((tool) => tool.tag.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (tool) =>
          tool.name.toLowerCase().includes(query) ||
          tool.desc.toLowerCase().includes(query) ||
          tool.tag.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const featuredTools = market.filter((tool) => tool.featured);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">工具市场</h1>
            <p className="text-muted-foreground">发现和安装精选工具插件</p>
          </div>
        </div>
      </div>

      {/* 精选工具 */}
      {selectedCategory === "all" && !searchQuery && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">精选推荐</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {featuredTools.map((tool) => (
              <Card
                key={tool.id}
                className="group border-primary/20 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <CardTitle className="text-lg">{tool.name}</CardTitle>
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" fill="currentColor" />
                          精选
                        </Badge>
                      </div>
                      <CardDescription>{tool.desc}</CardDescription>
                      <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {tool.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {tool.rating}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {tool.tag}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button size="sm" className="flex-1">
                    <Download className="mr-1 h-3 w-3" />
                    安装
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Info className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 搜索和筛选 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search
              className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
              size={18}
            />
            <Input
              placeholder="搜索工具市场..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            {filteredTools.length} 个工具
          </Badge>
        </div>

        {/* 分类筛选 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* 工具列表 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool) => (
          <Card key={tool.id} className="group transition-all hover:-translate-y-1 hover:shadow-md">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="mb-1 text-base">{tool.name}</CardTitle>
                  <CardDescription className="line-clamp-2">{tool.desc}</CardDescription>
                  <div className="text-muted-foreground mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {tool.downloads}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {tool.rating}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0 text-xs">
                  {tool.tag}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button size="sm" className="flex-1">
                <Download className="mr-1 h-3 w-3" />
                安装
              </Button>
              <Button size="sm" variant="ghost">
                详情
              </Button>
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
          <p className="text-muted-foreground mb-4">试试其他搜索词或选择不同的分类</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
            }}
          >
            重置筛选
          </Button>
        </div>
      )}
    </div>
  );
}
