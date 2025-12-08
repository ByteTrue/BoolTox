import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Store, ArrowRight } from "lucide-react";

export default function ToolsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">工具箱</h1>
        <p className="text-muted-foreground">管理已安装的工具并从市场发现更多工具</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link href="/dashboard/tools/installed">
          <Card className="group hover:border-primary/50 cursor-pointer border-2 transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">已安装工具</CardTitle>
                    <CardDescription className="mt-1">管理和配置已安装的工具</CardDescription>
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">查看、启动、停止或卸载已安装的工具</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/tools/market">
          <Card className="group hover:border-primary/50 cursor-pointer border-2 transition-all hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">工具市场</CardTitle>
                    <CardDescription className="mt-1">发现和安装新工具</CardDescription>
                  </div>
                </div>
                <ArrowRight className="text-muted-foreground group-hover:text-primary h-5 w-5 transition-colors" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">浏览精选工具并安装到本地</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">快速开始</CardTitle>
          <CardDescription>选择一个选项来管理你的工具</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <Link href="/dashboard/tools/installed">
              <Package className="mr-2 h-4 w-4" />
              查看已安装
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/tools/market">
              <Store className="mr-2 h-4 w-4" />
              浏览市场
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
