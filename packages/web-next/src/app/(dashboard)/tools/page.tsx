import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const installed = [
  { name: "快速笔记", desc: "轻量 Markdown 记事，本地存储。", status: "运行中" },
  { name: "番茄钟", desc: "25/5 番茄工作法，桌面提醒。", status: "已安装" },
]

const market = [
  { name: "图片压缩", desc: "离线压缩/转换，保护隐私。", tag: "媒体" },
  { name: "AI 总结", desc: "选中文本一键摘要，双语支持。", tag: "AI" },
  { name: "代码格式化", desc: "多语言格式化，遵循项目配置。", tag: "开发" },
]

export default function ToolsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">工具箱 · 插件市场</h1>
        <p className="text-muted-foreground">
          在一个页面管理已安装工具与市场插件，后续可接入 Agent / SSO / 付费策略。
        </p>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">已安装</p>
            <p className="text-muted-foreground text-sm">从本地或 Agent 同步的工具</p>
          </div>
          <Button variant="ghost" size="sm">刷新状态</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {installed.map((item) => (
            <Card key={item.name} className="hover:-translate-y-1 hover:shadow-md transition-transform">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant={item.status === "运行中" ? "default" : "secondary"}>
                    {item.status}
                  </Badge>
                </div>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm">启动</Button>
                <Button size="sm" variant="ghost">卸载</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">插件市场</p>
            <p className="text-muted-foreground text-sm">精选插件，后续可换为真实注册表数据</p>
          </div>
          <Button variant="ghost" size="sm">全部分类</Button>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {market.map((item) => (
            <Card key={item.name} className="hover:-translate-y-1 hover:shadow-md transition-transform">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{item.name}</CardTitle>
                  <Badge variant="outline">{item.tag}</Badge>
                </div>
                <CardDescription>{item.desc}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button size="sm">安装</Button>
                <Button size="sm" variant="ghost">详情</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
