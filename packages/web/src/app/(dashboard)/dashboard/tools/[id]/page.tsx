import { notFound } from "next/navigation";
import Link from "next/link";
import { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import * as Icons from "lucide-react";
import toolsData from "@/data/tools.json";

// 生成静态路由
export async function generateStaticParams() {
  const tools = toolsData as Tool[];
  return tools.map((tool) => ({
    id: tool.id,
  }));
}

export default function ToolDetailPage({ params }: { params: { id: string } }) {
  const tools = toolsData as Tool[];
  const tool = tools.find((t) => t.id === params.id);

  if (!tool) {
    notFound();
  }

  // 动态获取 Lucide 图标
  const IconComponent =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] ||
    Icons.Wrench;

  return (
    <div className="space-y-6 px-4 lg:px-6">
      {/* 头部 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          {/* 图标 */}
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-xl ${
              tool.type === "online" ? "bg-green-500/10" : "bg-blue-500/10"
            }`}
          >
            <IconComponent
              className={`h-8 w-8 ${tool.type === "online" ? "text-green-500" : "text-blue-500"}`}
            />
          </div>

          {/* 标题和描述 */}
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
              <Badge variant={tool.type === "online" ? "default" : "secondary"}>
                {tool.type === "online" ? "🌐 在线工具" : "💻 Client 工具"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">{tool.description}</p>

            {/* 标签 */}
            <div className="mt-3 flex flex-wrap gap-2">
              {tool.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {tool.type === "online" && tool.status === "available" && (
            <Link href={`/dashboard/tools/online/${tool.id}`}>
              <Button size="lg">立即使用</Button>
            </Link>
          )}
          {tool.type === "client" && tool.status === "available" && tool.installCommand && (
            <a href={tool.installCommand}>
              <Button size="lg" variant="secondary">
                安装到 BoolTox
              </Button>
            </a>
          )}
          {tool.homepage && (
            <a href={tool.homepage} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline">
                GitHub ↗
              </Button>
            </a>
          )}
        </div>
      </div>

      {/* 详细信息卡片 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">版本</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tool.version || "1.0.0"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">分类</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">{tool.category}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">运行时</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold capitalize">
              {tool.type === "online" ? "Web" : tool.runtime || "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 功能介绍 Tabs */}
      <Tabs defaultValue="intro" className="w-full">
        <TabsList>
          <TabsTrigger value="intro">功能介绍</TabsTrigger>
          <TabsTrigger value="usage">使用说明</TabsTrigger>
          {tool.readme && <TabsTrigger value="readme">文档</TabsTrigger>}
        </TabsList>

        <TabsContent value="intro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>功能特性</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {tool.type === "online" && (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                    <p>零安装，浏览器直接运行</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                    <p>本地处理，数据不上传服务器</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                    <p>支持深色/浅色主题</p>
                  </div>
                </>
              )}
              {tool.type === "client" && (
                <>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <p>支持本地文件处理</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <p>自动管理依赖环境</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <p>一键安装，开箱即用</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>快速开始</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tool.type === "online" && (
                <>
                  <p className="text-muted-foreground">
                    点击&ldquo;立即使用&rdquo;按钮，即可在浏览器中使用该工具。
                  </p>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="font-mono text-sm">
                      提示：所有数据在本地处理，不会上传到服务器。
                    </p>
                  </div>
                </>
              )}
              {tool.type === "client" && (
                <>
                  <p className="text-muted-foreground">1. 下载并安装 BoolTox Client</p>
                  <p className="text-muted-foreground">2. 点击&ldquo;安装到 BoolTox&rdquo;按钮</p>
                  <p className="text-muted-foreground">3. 等待自动安装完成</p>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="font-mono text-sm">
                      提示：BoolTox 会自动管理 {tool.runtime || "运行时"} 环境。
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {tool.readme && (
          <TabsContent value="readme">
            <Card>
              <CardHeader>
                <CardTitle>详细文档</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert max-w-none">
                  <p>{tool.readme}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
