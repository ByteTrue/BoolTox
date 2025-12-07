import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const resources = [
  {
    title: "AI & Productivity",
    description: "精选 AI 助手、自动化脚本、工作流编排工具。",
    links: ["Chat / Prompt", "自动化", "翻译 & 总结"],
  },
  {
    title: "开发必备",
    description: "代码托管、文档、前端/后端工具链与调试。",
    links: ["Git / CI", "调试 / 抓包", "前端组件库"],
  },
  {
    title: "设计与素材",
    description: "设计系统、图标、插画、配色与字体资源。",
    links: ["配色 / 字体", "图标 / 插画", "设计系统"],
  },
  {
    title: "效率与办公",
    description: "日程、协作、知识库与团队管理，适合日常使用。",
    links: ["日程 / 会议", "知识库", "团队协作"],
  },
]

export default function ResourcesPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">资源导航</h1>
        <p className="text-muted-foreground">
          常用站点、工具与教程汇总。登录后可扩展收藏 / 历史 / 个性化。
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Input
          placeholder="搜索资源 / 关键词..."
          className="max-w-xl"
        />
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          <Badge variant="secondary">公开可见</Badge>
          <span>登录后可同步收藏</span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resources.map((item) => (
          <Card key={item.title} className="hover:-translate-y-1 hover:shadow-md transition-transform">
            <CardHeader>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {item.links.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
