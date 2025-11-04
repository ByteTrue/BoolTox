import type { ModuleDefinition } from "./types";

const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "glassmorphism-demo",
    name: "玻璃拟态演示",
    description: "展示现代玻璃拟态设计效果，支持实时调整参数。",
    version: "1.0.0",
    category: "design",
    keywords: ["glassmorphism", "design", "ui", "demo"],
    icon: "✨",
    installedByDefault: true,
    loader: () => import("@modules/glassmorphism-demo/module").then((mod) => mod.default),
  },
  {
    id: "pomodoro-timer",
    name: "番茄钟计时器",
    description: "专注 25 分钟，休息 5 分钟，科学管理时间提升效率。",
    version: "1.0.0",
    category: "productivity",
    keywords: ["pomodoro", "timer", "focus", "productivity", "time-management"],
    icon: "🍅",
    installedByDefault: false, // 默认不安装，演示安装功能
    loader: () => import("@modules/pomodoro-timer/module").then((mod) => mod.default),
  },
];

export function listModuleDefinitions(): ModuleDefinition[] {
  return moduleDefinitions;
}

export function findModuleDefinition(id: string): ModuleDefinition | undefined {
  return moduleDefinitions.find((definition) => definition.id === id);
}
