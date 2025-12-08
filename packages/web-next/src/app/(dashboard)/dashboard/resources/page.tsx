"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ExternalLink, Star, Plus, BookmarkPlus, Sparkles } from "lucide-react";
import {
  resources,
  resourceCategories,
  getCategoryIcon,
  getCategoryGradient,
} from "@/lib/resources-data";

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set());

  // 筛选资源
  const filteredResources = React.useMemo(() => {
    let result = [...resources];

    if (selectedCategory !== "all") {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.tags.some((t) => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  // 切换收藏
  const toggleFavorite = (resourceId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(resourceId)) {
        newFavorites.delete(resourceId);
      } else {
        newFavorites.add(resourceId);
      }
      return newFavorites;
    });
  };

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">资源导航</h1>
            <p className="text-muted-foreground">常用站点、工具与教程汇总，支持收藏和自定义管理</p>
          </div>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            添加自定义资源
          </Button>
        </div>
      </div>

      {/* 搜索和统计 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2"
            size={18}
          />
          <Input
            placeholder="搜索资源名称、描述或标签..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Badge variant="secondary" className="gap-1">
            <Sparkles className="h-3 w-3" />
            {filteredResources.length} 个资源
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3 text-yellow-500" />
            {favorites.size} 个收藏
          </Badge>
        </div>
      </div>

      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2">
        {resourceCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="gap-2"
            >
              <Icon size={14} />
              {category.name}
            </Button>
          );
        })}
      </div>

      {/* 资源列表 */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource) => {
          const Icon = getCategoryIcon(resource.category);
          const isFavorite = favorites.has(resource.id);

          return (
            <Card
              key={resource.id}
              className="group transition-all hover:-translate-y-1 hover:shadow-md"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getCategoryGradient(resource.category)} flex shrink-0 items-center justify-center text-white transition-transform group-hover:scale-110`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="truncate">{resource.name}</span>
                        {resource.featured && (
                          <Star className="h-4 w-4 shrink-0 text-yellow-500" fill="currentColor" />
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">
                        {resource.description}
                      </CardDescription>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => toggleFavorite(resource.id)}
                  >
                    <BookmarkPlus
                      className={`h-4 w-4 ${isFavorite ? "fill-primary text-primary" : ""}`}
                    />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-flex items-center gap-2 text-sm hover:underline"
                >
                  <span>访问资源</span>
                  <ExternalLink size={14} />
                </a>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 空状态 */}
      {filteredResources.length === 0 && (
        <div className="py-12 text-center">
          <div className="bg-secondary text-muted-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
            <Search size={28} />
          </div>
          <h3 className="mb-2 text-lg font-semibold">没有找到匹配的资源</h3>
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
