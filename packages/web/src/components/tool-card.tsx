import Link from "next/link";
import { Tool } from "@/types/tool";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import * as Icons from "lucide-react";

interface ToolCardProps {
  tool: Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  // 动态获取 Lucide 图标
  const IconComponent =
    (Icons as Record<string, React.ComponentType<{ className?: string }>>)[tool.icon] ||
    Icons.Wrench;

  // 根据工具类型返回不同的背景色
  const getBgColor = () => {
    if (tool.type === "online") {
      return "bg-green-500/10";
    }
    return "bg-blue-500/10";
  };

  // 根据工具类型返回不同的文字颜色
  const getTextColor = () => {
    if (tool.type === "online") {
      return "text-green-500";
    }
    return "text-blue-500";
  };

  // 根据工具状态判断是否可用
  const isAvailable = tool.status === "available";

  return (
    <Card
      className={`group relative border-2 transition-all hover:shadow-md ${
        !isAvailable ? "cursor-not-allowed opacity-60" : "hover:border-primary/50"
      }`}
    >
      {/* coming-soon 遮罩 */}
      {!isAvailable && (
        <div className="bg-muted/50 absolute inset-0 z-10 flex items-center justify-center rounded-lg">
          <span className="bg-muted rounded-full px-3 py-1 text-sm font-medium">即将推出</span>
        </div>
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-lg ${getBgColor()}`}
            >
              <IconComponent className={`h-5 w-5 ${getTextColor()}`} />
            </div>
            <div>
              <CardTitle className="text-base">{tool.name}</CardTitle>
            </div>
          </div>
          <Badge variant={tool.type === "online" ? "default" : "secondary"} className="text-xs">
            {tool.type === "online" ? "🌐 在线" : "💻 Client"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <CardDescription>{tool.description}</CardDescription>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1">
          {tool.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* 操作按钮 */}
        {isAvailable && (
          <Link
            href={
              tool.type === "online"
                ? `/dashboard/tools/online/${tool.id}`
                : `/dashboard/tools/${tool.id}`
            }
          >
            <Button className="w-full" variant={tool.type === "online" ? "default" : "secondary"}>
              {tool.type === "online" ? "立即使用" : "查看详情"}
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
