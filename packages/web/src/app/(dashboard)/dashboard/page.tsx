"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, Laptop, Wrench, Download, ArrowRight } from "lucide-react";
import { Tool } from "@/types/tool";
import toolsData from "@/data/tools.json";

export default function DashboardHomePage() {
  const tools = toolsData as Tool[];

  // 统计数据
  const stats = {
    total: tools.length,
    online: tools.filter((t) => t.type === "online").length,
    client: tools.filter((t) => t.type === "client").length,
    available: tools.filter((t) => t.status === "available").length,
  };

  // 快速入口工具（可用的在线工具）
  const quickAccessTools = tools
    .filter((t) => t.type === "online" && t.status === "available")
    .slice(0, 4);

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">欢迎使用 BoolTox</h1>
        <p className="text-muted-foreground">在线工具零安装 · 本地工具更强大</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/20 border-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">全部工具</CardTitle>
            <Wrench className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-muted-foreground text-xs">{stats.available} 个可用</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">在线工具</CardTitle>
            <Globe className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
            <p className="text-muted-foreground text-xs">零安装，浏览器直接运行</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client 工具</CardTitle>
            <Laptop className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.client}</div>
            <p className="text-muted-foreground text-xs">一键安装，自动配置环境</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BoolTox Client</CardTitle>
            <Download className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/download">
              <Button variant="outline" size="sm" className="w-full">
                立即下载
                <ArrowRight className="ml-2 h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 快速入口 */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">快速入口</h2>
            <p className="text-muted-foreground text-sm">立即使用在线工具</p>
          </div>
          <Link href="/dashboard/tools">
            <Button variant="ghost">
              查看全部
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickAccessTools.map((tool) => {
            const iconMap: Record<string, () => JSX.Element> = {
              Code: () => <span className="text-2xl">💻</span>,
              Link: () => <span className="text-2xl">🔗</span>,
              FileJson: () => <span className="text-2xl">📄</span>,
              Hash: () => <span className="text-2xl">#️⃣</span>,
            };
            const IconComponent = iconMap[tool.icon] || (() => <Wrench className="h-6 w-6" />);

            return (
              <Link key={tool.id} href={`/dashboard/tools/online/${tool.id}`}>
                <Card className="group hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                        <IconComponent />
                      </div>
                      <div>
                        <CardTitle className="group-hover:text-primary text-base transition-colors">
                          {tool.name}
                        </CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="line-clamp-2">{tool.description}</CardDescription>
                    <div className="mt-2">
                      <Badge variant="outline" className="text-xs">
                        🌐 在线工具
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 功能引导 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              浏览工具箱
            </CardTitle>
            <CardDescription>查看所有可用工具，包括在线工具和 Client 工具</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/tools">
              <Button className="w-full">
                进入工具箱
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              资源导航
            </CardTitle>
            <CardDescription>精选开发工具、设计资源、AI 工具和学习资料</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/resources">
              <Button variant="outline" className="w-full">
                浏览资源
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
