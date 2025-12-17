"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DotPattern } from "@/components/dot-pattern";

export function HeroSection() {
  return (
    <section className="from-background to-background/80 relative overflow-hidden bg-gradient-to-b pt-20 pb-24 sm:pt-32">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <DotPattern className="opacity-100" size="md" fadeStyle="ellipse" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          {/* Main Headline */}
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">BoolTox</h1>

          {/* Subheading */}
          <p className="text-muted-foreground mx-auto max-w-2xl text-xl sm:text-2xl">
            开源工具箱平台 · 在线工具零安装 · 本地工具更强大
          </p>

          <p className="text-muted-foreground mx-auto max-w-3xl text-base sm:text-lg">
            Web 端提供在线工具，浏览器直接运行，零安装门槛。
            <br />
            Client 端管理本地工具，自动配置依赖环境，一键安装。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="cursor-pointer text-base" asChild>
              <Link href="/dashboard/tools">
                立即体验在线工具
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="cursor-pointer text-base" asChild>
              <Link href="/dashboard/download">下载 BoolTox Client</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
