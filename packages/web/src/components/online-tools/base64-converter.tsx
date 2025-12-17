"use client";

import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Base64Converter() {
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
        // 编码：字符串 → Base64
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
        setError(null);
      } else {
        // 解码：Base64 → 字符串
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
        setError(null);
      }
    } catch {
      setError(mode === "encode" ? "编码失败：无效的输入" : "解码失败：无效的 Base64 字符串");
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
            placeholder={mode === "encode" ? "输入要编码的文本..." : "输入 Base64 字符串..."}
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
            placeholder={mode === "encode" ? "Base64 编码结果..." : "解码后的文本..."}
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
            ? "Base64 编码常用于在 URL、Cookie 等场景中传输二进制数据。"
            : "请确保输入的是有效的 Base64 字符串，否则解码会失败。"}
        </p>
      </div>
    </div>
  );
}
