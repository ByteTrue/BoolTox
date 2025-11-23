import type { ModuleDefinition } from "./types";

// 硬编码的模块定义(非插件系统的模块)
// 插件系统的模块通过 pluginDefinitions 动态加载
const moduleDefinitions: ModuleDefinition[] = [
  // 未来可以在这里添加非插件系统的内置模块
];

export function listModuleDefinitions(): ModuleDefinition[] {
  return moduleDefinitions;
}

export function findModuleDefinition(id: string): ModuleDefinition | undefined {
  return moduleDefinitions.find((definition) => definition.id === id);
}
