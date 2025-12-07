'use client';

import React from 'react';
import Link from 'next/link';
import {
  Compass,
  Search,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Star,
} from 'lucide-react';
import {
  resources,
  resourceCategories,
  getCategoryIcon,
  getCategoryGradient,
  getFeaturedResources,
} from '@/lib/resources-data';

export default function ResourcesPage() {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // 筛选资源
  const filteredResources = React.useMemo(() => {
    let result = [...resources];

    if (selectedCategory !== 'all') {
      result = result.filter(r => r.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [selectedCategory, searchQuery]);

  // 精选资源
  const featuredResources = getFeaturedResources();

  return (
    <div className="relative min-h-screen" style={{ contain: 'layout paint style' }}>
      {/* 装饰性背景 */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(59 130 246) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(59 130 246) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />
      </div>

      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 text-sm font-medium mb-6">
            <Compass size={16} />
            <span>精选优质资源</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-neutral-900 via-primary-600 to-neutral-900 dark:from-neutral-100 dark:via-primary-400 dark:to-neutral-100 bg-clip-text text-transparent">
              资源导航
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto mb-8">
            精心收集的开发工具、设计资源、AI 工具和学习资料
            <br />
            助你提升工作效率
          </p>

          {/* 搜索框 */}
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
            <input
              type="text"
              placeholder="搜索资源..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-colors duration-200 shadow-soft"
            />
          </div>
        </div>

        {/* 精选资源 */}
        {selectedCategory === 'all' && !searchQuery && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-yellow-500" size={20} />
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">精选推荐</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {featuredResources.slice(0, 4).map((resource) => {
                const Icon = getCategoryIcon(resource.category);
                return (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative p-6 rounded-2xl bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-900 dark:to-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft-lg transition-colors duration-200"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(resource.category)} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon size={24} />
                    </div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 flex items-center gap-2">
                      {resource.name}
                      <ExternalLink size={14} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
                    </h3>
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                      {resource.description}
                    </p>
                  </a>
                );
              })}
            </div>
          </section>
        )}

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {resourceCategories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200 ${
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white shadow-soft'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <Icon size={16} />
                {category.name}
              </button>
            );
          })}
        </div>

        {/* 资源列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => {
            const Icon = getCategoryIcon(resource.category);
            return (
              <a
                key={resource.id}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col p-6 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-soft transition-colors duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getCategoryGradient(resource.category)} flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                      {resource.name}
                      <ExternalLink size={14} className="text-neutral-400 group-hover:text-primary-500 transition-colors" />
                    </h3>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                      {resource.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto">
                  {resource.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
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
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 mb-4">
              <Search size={28} />
            </div>
            <p className="text-neutral-500">没有找到匹配的资源</p>
          </div>
        )}

        {/* 底部 CTA */}
        <div className="mt-20 text-center">
          <div className="inline-flex flex-col items-center p-8 rounded-3xl bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800">
            <Sparkles className="text-primary-500 mb-4" size={32} />
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              想要更强大的工具？
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6 max-w-md">
              探索 BoolTox 工具箱，安装本地插件，获得更强大的功能
            </p>
            <Link
              href="/tools"
              prefetch
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 shadow-soft hover:shadow-soft-lg transition-colors duration-200 active:scale-95"
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
