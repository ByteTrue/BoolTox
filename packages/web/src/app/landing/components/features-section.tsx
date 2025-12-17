"use client";

import { Globe, Laptop, Compass } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const coreFeatures = [
  {
    icon: Globe,
    title: "在线工具箱",
    description: "零安装即用，浏览器直接运行",
    details: [
      "无需安装任何软件",
      "数据本地处理，隐私安全",
      "支持深色/浅色主题",
      "跨平台，任何设备可用",
    ],
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  {
    icon: Laptop,
    title: "本地 Agent",
    description: "进程管理，支持 Python/Node.js 工具",
    details: ["自动配置运行环境", "一键安装，开箱即用", "支持任意 Git 仓库", "企业内部工具分发"],
    gradient: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: Compass,
    title: "资源导航",
    description: "开发者资源聚合",
    details: ["精选开发工具和资源", "设计资源和 AI 工具", "学习资料和文档", "持续更新和维护"],
    gradient: "from-purple-500/20 to-pink-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">核心功能</h2>
          <p className="text-muted-foreground text-lg">
            一个平台，三种能力，满足开发者的多样化需求
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {coreFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="group relative overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Gradient Background */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 transition-opacity group-hover:opacity-100`}
                />

                <CardHeader className="relative">
                  <div className="mb-2 flex items-center gap-4">
                    <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                      <Icon className="text-primary h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>

                <CardContent className="relative">
                  <ul className="space-y-2">
                    {feature.details.map((detail, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="bg-primary mt-1.5 h-1.5 w-1.5 rounded-full" />
                        <span className="text-muted-foreground text-sm">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
