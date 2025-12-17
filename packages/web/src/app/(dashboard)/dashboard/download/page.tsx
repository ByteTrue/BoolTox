import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, XCircle, Download, Monitor, Apple, Smartphone } from "lucide-react";

export default function DownloadPage() {
  return (
    <div className="space-y-8 px-4 lg:px-6">
      {/* 页面标题 */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">下载 BoolTox Client</h1>
        <p className="text-muted-foreground text-lg">获取更强大的本地工具支持，自动管理依赖环境</p>
      </div>

      {/* 平台选择 */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-2 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Monitor className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Windows</CardTitle>
                <Badge variant="outline" className="mt-1">
                  v1.0.0
                </Badge>
              </div>
            </div>
            <CardDescription>支持 Windows 10/11（64 位）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              下载 Windows 版
            </Button>
            <p className="text-muted-foreground text-center text-xs">大小：~50MB · 安装包</p>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Apple className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">macOS</CardTitle>
                <Badge variant="outline" className="mt-1">
                  v1.0.0
                </Badge>
              </div>
            </div>
            <CardDescription>支持 macOS 11+（Apple Silicon & Intel）</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              下载 macOS 版
            </Button>
            <p className="text-muted-foreground text-center text-xs">大小：~45MB · DMG 镜像</p>
          </CardContent>
        </Card>

        <Card className="border-2 transition-all hover:shadow-lg">
          <CardHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                <Smartphone className="text-primary h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-xl">Linux</CardTitle>
                <Badge variant="outline" className="mt-1">
                  v1.0.0
                </Badge>
              </div>
            </div>
            <CardDescription>支持 Ubuntu、Debian、Arch Linux 等</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" size="lg">
              <Download className="mr-2 h-4 w-4" />
              下载 Linux 版
            </Button>
            <p className="text-muted-foreground text-center text-xs">大小：~40MB · AppImage</p>
          </CardContent>
        </Card>
      </div>

      {/* 功能对比 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">功能对比</CardTitle>
          <CardDescription>了解在线工具和 Client 工具的区别</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">功能特性</TableHead>
                <TableHead className="text-center">在线工具</TableHead>
                <TableHead className="text-center">Client 工具</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">零安装，浏览器直接运行</TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">支持本地文件处理</TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">自动管理依赖环境</TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">支持 Python/Node.js 工具</TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">跨平台，任何设备可用</TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">数据本地处理，隐私安全</TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">支持任意 Git 仓库</TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">企业内部工具分发</TableCell>
                <TableCell className="text-center">
                  <XCircle className="text-muted-foreground/30 mx-auto h-5 w-5" />
                </TableCell>
                <TableCell className="text-center">
                  <CheckCircle2 className="mx-auto h-5 w-5 text-green-500" />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 安装指南 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">安装指南</CardTitle>
          <CardDescription>快速安装 BoolTox Client</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Monitor className="h-4 w-4" />
              Windows
            </h3>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>下载 BoolTox-Setup-1.0.0.exe</li>
              <li>双击运行安装程序</li>
              <li>按照安装向导完成安装</li>
              <li>启动 BoolTox，开始使用工具</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Apple className="h-4 w-4" />
              macOS
            </h3>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>下载 BoolTox-1.0.0.dmg</li>
              <li>打开 DMG 文件</li>
              <li>将 BoolTox 拖到应用程序文件夹</li>
              <li>从启动台或应用程序文件夹启动</li>
            </ol>
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 font-semibold">
              <Smartphone className="h-4 w-4" />
              Linux
            </h3>
            <ol className="text-muted-foreground list-inside list-decimal space-y-1 text-sm">
              <li>下载 BoolTox-1.0.0.AppImage</li>
              <li>添加执行权限：chmod +x BoolTox-1.0.0.AppImage</li>
              <li>运行：./BoolTox-1.0.0.AppImage</li>
              <li>（可选）右键选择&ldquo;整合到系统&rdquo;</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* 系统要求 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">系统要求</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h3 className="mb-2 font-semibold">Windows</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Windows 10/11（64 位）</li>
                <li>• 4GB RAM（推荐 8GB）</li>
                <li>• 500MB 可用磁盘空间</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">macOS</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• macOS 11+</li>
                <li>• Apple Silicon / Intel</li>
                <li>• 4GB RAM（推荐 8GB）</li>
                <li>• 500MB 可用磁盘空间</li>
              </ul>
            </div>
            <div>
              <h3 className="mb-2 font-semibold">Linux</h3>
              <ul className="text-muted-foreground space-y-1 text-sm">
                <li>• Ubuntu 20.04+ / Debian 11+</li>
                <li>• Arch Linux / Fedora 等</li>
                <li>• 4GB RAM（推荐 8GB）</li>
                <li>• 500MB 可用磁盘空间</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA */}
      <Card className="bg-primary/5 border-2">
        <CardContent className="pt-6">
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-semibold">还没准备好下载？</h3>
            <p className="text-muted-foreground">先试试我们的在线工具，零安装，浏览器直接运行</p>
            <Link href="/dashboard/tools">
              <Button size="lg" variant="outline">
                体验在线工具
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
