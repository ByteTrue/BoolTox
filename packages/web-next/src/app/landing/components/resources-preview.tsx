"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"

const previews = [
  { title: "AI & Productivity", desc: "精选 AI 助手、自动化脚本。", tag: "快速入口" },
  { title: "开发必备", desc: "CI/CD、调试工具、前端组件库。", tag: "开发" },
  { title: "设计与素材", desc: "配色、图标、插画与字体资源。", tag: "设计" },
]

export function ResourcesPreview() {
  return (
    <section className="bg-muted/40 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">导航速览</p>
            <h2 className="text-2xl font-bold">资源导航精选</h2>
            <p className="text-muted-foreground">
              把常用站点和工具集中到一处，点击即可前往 Dashboard 全量视图。
            </p>
          </div>
          <Link
            href="/resources"
            className="text-sm font-semibold text-primary hover:text-primary/80"
          >
            查看全部 →
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {previews.map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm transition-transform duration-150 hover:-translate-y-1 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <Badge variant="outline">{item.tag}</Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
