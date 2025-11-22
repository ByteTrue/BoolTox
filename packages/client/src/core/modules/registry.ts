import type { ModuleDefinition } from "./types";

const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "com.booltox.starter",
    name: "BoolTox Starter",
    description: "A comprehensive example showcasing BoolTox plugin capabilities.",
    version: "1.0.0",
    category: "development",
    keywords: ["starter", "demo", "system", "files", "db"],
    icon: "🚀",
    installedByDefault: true,
    loader: () => Promise.resolve(() => null), // Dummy loader
  },
];

export function listModuleDefinitions(): ModuleDefinition[] {
  return moduleDefinitions;
}

export function findModuleDefinition(id: string): ModuleDefinition | undefined {
  return moduleDefinitions.find((definition) => definition.id === id);
}
