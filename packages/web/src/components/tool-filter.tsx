import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ToolType } from "@/types/tool";

interface ToolFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedType: "all" | ToolType;
  onTypeChange: (type: "all" | ToolType) => void;
}

export function ToolFilter({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
}: ToolFilterProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {/* 搜索框 */}
      <div className="relative flex-1 md:max-w-sm">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="搜索工具..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 工具类型筛选 */}
      <ToggleGroup
        type="single"
        value={selectedType}
        onValueChange={(value) => {
          if (value) onTypeChange(value as "all" | ToolType);
        }}
      >
        <ToggleGroupItem value="all" aria-label="全部工具">
          全部
        </ToggleGroupItem>
        <ToggleGroupItem value="online" aria-label="在线工具">
          🌐 在线工具
        </ToggleGroupItem>
        <ToggleGroupItem value="client" aria-label="Client 工具">
          💻 Client 工具
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
