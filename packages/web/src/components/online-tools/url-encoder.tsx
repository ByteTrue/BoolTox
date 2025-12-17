"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function UrlEncoder() {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);

  // 实时转换
  useEffect(() => {
    if (!input.trim()) {
      setOutput("");
      setError(null);
      return;
    }

    try {
      if (mode === "encode") {
        // 编码：普通文本 → URL 编码
        const encoded = encodeURIComponent(input);
        setOutput(encoded);
        setError(null);
      } else {
        // 解码：URL 编码 → 普通文本
        const decoded = decodeURIComponent(input);
        setOutput(decoded);
        setError(null);
      }
    } catch {
      setError(mode === "encode" ? "编码失败：无效的输入" : "解码失败：无效的 URL 编码字符串");
      setOutput("");
    }
  }, [input, mode]);

  const handleCopy = async () => {
    if (!output) {
      toast.error("没有可复制的内容");
      return;
    }

    try {
      await navigator.clipboard.writeText(output);
      toast.success("已复制到剪贴板");
    } catch {
      toast.error("复制失败");
    }
  };

  const handleClear = () => {
    setInput("");
    setOutput("");
    setError(null);
    toast.success("已清空");
  };

  return (
    <div className="space-y-4">
      {/* 模式切换 */}
      <div className="flex items-center justify-between">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) setMode(value as "encode" | "decode");
          }}
        >
          <ToggleGroupItem value="encode" aria-label="编码模式">
            编码
          </ToggleGroupItem>
          <ToggleGroupItem value="decode" aria-label="解码模式">
            解码
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            复制结果
          </Button>
          <Button variant="outline" size="sm" onClick={handleClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            清空
          </Button>
        </div>
      </div>

      {/* 输入/输出区域 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* 输入 */}
        <div className="space-y-2">
          <Label>输入</Label>
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              mode === "encode"
                ? "输入要编码的文本...\n例如：你好世界"
                : "输入 URL 编码字符串...\n例如：%E4%BD%A0%E5%A5%BD%E4%B8%96%E7%95%8C"
            }
            rows={12}
            className="font-mono text-sm"
          />
        </div>

        {/* 输出 */}
        <div className="space-y-2">
          <Label>输出</Label>
          <Textarea
            value={output}
            readOnly
            placeholder={mode === "encode" ? "URL 编码结果..." : "解码后的文本..."}
            rows={12}
            className={`font-mono text-sm ${error ? "border-destructive" : ""}`}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="bg-muted rounded-lg p-4">
        <p className="text-muted-foreground text-sm">
          <strong>提示：</strong>
          {mode === "encode"
            ? "URL 编码用于将特殊字符转换为可以在 URL 中安全传输的格式（例如空格变为 %20）。"
            : "请确保输入的是有效的 URL 编码字符串，否则解码会失败。"}
        </p>
      </div>

      {/* 常用字符编码参考 */}
      <div className="bg-card rounded-lg border p-4">
        <h3 className="mb-2 font-medium">常用字符编码参考</h3>
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
          <div className="flex justify-between">
            <span>空格</span>
            <code className="text-muted-foreground">%20</code>
          </div>
          <div className="flex justify-between">
            <span>+</span>
            <code className="text-muted-foreground">%2B</code>
          </div>
          <div className="flex justify-between">
            <span>/</span>
            <code className="text-muted-foreground">%2F</code>
          </div>
          <div className="flex justify-between">
            <span>?</span>
            <code className="text-muted-foreground">%3F</code>
          </div>
          <div className="flex justify-between">
            <span>#</span>
            <code className="text-muted-foreground">%23</code>
          </div>
          <div className="flex justify-between">
            <span>&</span>
            <code className="text-muted-foreground">%26</code>
          </div>
          <div className="flex justify-between">
            <span>=</span>
            <code className="text-muted-foreground">%3D</code>
          </div>
          <div className="flex justify-between">
            <span>%</span>
            <code className="text-muted-foreground">%25</code>
          </div>
        </div>
      </div>
    </div>
  );
}
