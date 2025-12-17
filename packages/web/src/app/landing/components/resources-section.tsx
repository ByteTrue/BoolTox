"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink } from "lucide-react";
import {
  resources,
  resourceCategories,
  getCategoryIcon,
  getCategoryGradient,
} from "@/lib/resources-data";

export function ResourcesSection() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  // 过滤资源
  const filteredResources =
    selectedCategory === "all"
      ? resources
      : resources.filter((r) => r.category === selectedCategory);

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">开发者资源导航</h2>
          <p className="text-muted-foreground text-lg">精选开发工具、设计资源、AI 工具和学习资料</p>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-3 lg:grid-cols-6">
            {resourceCategories.map((category) => {
              const Icon = getCategoryIcon(category.id);
              return (
                <TabsTrigger key={category.id} value={category.id} className="gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-0">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResources.map((resource) => {
                const gradient = getCategoryGradient(resource.category);
                return (
                  <Card
                    key={resource.id}
                    className="group relative transition-shadow hover:shadow-lg"
                  >
                    {/* Gradient Header */}
                    <div className={`h-2 w-full rounded-t-lg ${gradient}`} />

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-primary text-lg transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-1">{resource.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Link Button */}
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          访问资源
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </a>
                    </CardContent>

                    {/* Featured Badge */}
                    {resource.featured && (
                      <div className="absolute top-4 right-4">
                        <Badge variant="default" className="bg-primary">
                          精选
                        </Badge>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* View All Button */}
        <div className="mt-8 text-center">
          <Button size="lg" variant="outline" asChild>
            <Link href="/dashboard/resources">查看全部资源</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
