import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Code, FileJson, Hash, Type, Palette } from "lucide-react";

// 纯前端工具列表（待开发）
const tools = [
  {
    id: "json-formatter",
    name: "JSON 格式化",
    description: "格式化、验证和美化 JSON 数据",
    icon: FileJson,
    color: "text-yellow-500",
    bgColor: "bg-yellow-500/10",
    status: "coming-soon" as const,
  },
  {
    id: "base64",
    name: "Base64 编解码",
    description: "Base64 编码和解码工具",
    icon: Code,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    status: "coming-soon" as const,
  },
  {
    id: "hash",
    name: "哈希计算",
    description: "计算 MD5、SHA1、SHA256 等哈希值",
    icon: Hash,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
    status: "coming-soon" as const,
  },
  {
    id: "regex",
    name: "正则表达式",
    description: "正则表达式测试和调试工具",
    icon: Type,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    status: "coming-soon" as const,
  },
  {
    id: "color",
    name: "颜色转换",
    description: "HEX、RGB、HSL 颜色格式转换",
    icon: Palette,
    color: "text-pink-500",
    bgColor: "bg-pink-500/10",
    status: "coming-soon" as const,
  },
];

export default function ToolsPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">在线工具</h1>
        <p className="text-muted-foreground">
          纯前端工具，无需安装，直接在浏览器中使用
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tools.map((tool) => (
          <Card
            key={tool.id}
            className="group relative cursor-not-allowed border-2 opacity-60"
          >
            <div className="bg-muted/50 absolute inset-0 flex items-center justify-center rounded-lg">
              <span className="bg-muted rounded-full px-3 py-1 text-sm font-medium">
                即将推出
              </span>
            </div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${tool.bgColor}`}
                >
                  <tool.icon className={`h-5 w-5 ${tool.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{tool.name}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{tool.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Wrench className="text-primary h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">更多工具开发中</CardTitle>
              <CardDescription>
                我们正在开发更多实用的纯前端工具，敬请期待
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
