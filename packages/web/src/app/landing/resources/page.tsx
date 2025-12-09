"use client";

import React from "react";
import Link from "next/link";
import { Compass, Search, ExternalLink, Sparkles, ArrowRight, Star } from "lucide-react";
import {
  resources,
  resourceCategories,
  getCategoryIcon,
  getCategoryGradient,
  getFeaturedResources,
} from "@/lib/resources-data";

export default function ResourcesLandingPage() {
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

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

  // 精选资源
  const featuredResources = getFeaturedResources();

  return (
    <div className="relative min-h-screen" style={{ contain: "layout paint style" }}>
      {/* 装饰性背景 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
          style={{
            backgroundImage: `
            linear-gradient(to right, rgb(59 130 246) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246) 1px, transparent 1px)
          `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="mb-16 text-center">
          <div className="bg-primary/10 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
            <Compass size={16} />
            <span>精选优质资源</span>
          </div>

          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <span className="from-foreground via-primary to-foreground bg-gradient-to-r bg-clip-text text-transparent">
              资源导航
            </span>
          </h1>

          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg md:text-xl">
            精心收集的开发工具、设计资源、AI 工具和学习资料
            <br />
            助你提升工作效率
          </p>

          {/* 搜索框 */}
          <div className="relative mx-auto max-w-xl">
            <Search
              className="text-muted-foreground absolute top-1/2 left-4 -translate-y-1/2"
              size={20}
            />
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-background focus:ring-primary w-full rounded-2xl border py-4 pr-4 pl-12 text-base shadow-sm transition-colors duration-200 focus:ring-2 focus:outline-none"
            />
          </div>
        </div>

        {/* 精选资源 */}
        {selectedCategory === "all" && !searchQuery && (
          <section className="mb-16">
            <div className="mb-6 flex items-center gap-2">
              <Star className="text-yellow-500" size={20} />
              <h2 className="text-xl font-semibold">精选推荐</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {featuredResources.slice(0, 4).map((resource) => {
                const Icon = getCategoryIcon(resource.category);
                return (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-card hover:border-primary/50 relative rounded-2xl border p-6 transition-all duration-200 hover:shadow-lg"
                  >
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(resource.category)} mb-4 flex items-center justify-center text-white transition-transform duration-300 group-hover:scale-110`}
                    >
                      <Icon size={24} />
                    </div>
                    <h3 className="mb-2 flex items-center gap-2 font-semibold">
                      {resource.name}
                      <ExternalLink
                        size={14}
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                      />
                    </h3>
                    <p className="text-muted-foreground line-clamp-2 text-sm">
                      {resource.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 分类标签 */}
        <div className="mb-8 flex flex-wrap gap-2">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-card hover:border-primary/50 border"
                }`}
              >
                <Icon size={16} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* 资源列表 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredResources.map((resource) => {
            const Icon = getCategoryIcon(resource.category);
            return (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group bg-card hover:border-primary/50 flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-start gap-4">
                  <div
                    className={`h-12 w-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(resource.category)} flex shrink-0 items-center justify-center text-white transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="flex items-center gap-2 font-semibold">
                      {resource.name}
                      <ExternalLink
                        size={14}
                        className="text-muted-foreground group-hover:text-primary transition-colors"
                      />
                    </h3>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="mt-auto flex flex-wrap gap-1.5">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-secondary text-secondary-foreground rounded-lg px-2 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            );
          })}
        </div>

        {/* 空状态 */}
        {filteredResources.length === 0 && (
          <div className="py-20 text-center">
            <div className="bg-secondary text-muted-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
              <Search size={28} />
            </div>
            <p className="text-muted-foreground">没有找到匹配的资源</p>
          </div>
        )}

        {/* 底部 CTA */}
        <div className="mt-20 text-center">
          <div className="from-primary/10 border-primary/20 inline-flex flex-col items-center rounded-3xl border bg-gradient-to-br to-purple-500/10 p-8">
            <Sparkles className="text-primary mb-4" size={32} />
            <h3 className="mb-2 text-xl font-semibold">想要更强大的工具？</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              探索 BoolTox 工具箱，安装本地插件，获得更强大的功能
            </p>
            <Link
              href="/dashboard/tools"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-6 py-3 font-medium shadow-sm transition-all duration-200 hover:shadow-md active:scale-95"
            >
              <span>探索工具箱</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
