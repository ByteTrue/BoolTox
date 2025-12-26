/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ModuleInstance, ModuleDefinition } from '@/types/module';
import type { ToolRegistryEntry } from '@booltox/shared';

/**
 * 模块 ViewModel - 统一三种数据源的展示模型
 *
 * 设计原则 (Linus 风格):
 * - "Bad programmers worry about code. Good programmers worry about data structures."
 * - 将类型判断逻辑收敛到一处，UI 层只负责渲染
 * - 消除特殊情况，所有模块用同一种数据结构表示
 */

/**
 * 统一的模块视图模型
 * 所有模块类型（已安装/可用/远程）都转换为此结构
 */
export interface ModuleViewModel {
  /** 模块唯一标识 */
  id: string;

  /** 模块名称 */
  name: string;

  /** 模块描述 */
  description: string;

  /** 版本号 */
  version: string;

  /** 分类 */
  category: string;

  /** 图标（URL 或 emoji） */
  icon?: string;

  /** 关键词（用于搜索） */
  keywords?: string[];

  /** 截图列表 */
  screenshots?: string[];

  /**
   * 模块类型（用于 UI 区分展示方式）
   * - installed: 已安装的模块（可启动/停止）
   * - available: 本地可用但未安装（来自 availableModules）
   * - registry: 远程工具源的模块（需要先安装）
   */
  type: 'installed' | 'available' | 'registry';

  /**
   * 运行时信息（仅 type='installed' 时存在）
   */
  runtime?: {
    installed: boolean;
    launchState: 'idle' | 'launching' | 'running' | 'stopping' | 'error';
    lastLaunchedAt?: number; // 时间戳（毫秒）
    updateAvailable?: boolean;
    lastError?: string | null;
  };

  /**
   * 是否收藏（仅 type='installed' 时存在）
   */
  isFavorite?: boolean;

  /**
   * 来源信息（type='registry' 时存在）
   */
  source?: {
    id: string;
    name: string;
  };

  /**
   * 运行时类型（用于判断是否为外部工具）
   */
  runtimeType?: 'http-service' | 'cli' | 'binary' | 'standalone';
}

/**
 * 工厂函数 - 将三种数据源转为统一 ViewModel
 *
 * 设计思路:
 * 1. 优先判断最具体的类型（registry）
 * 2. 然后判断已安装模块（installed）
 * 3. 最后默认为可用模块（available）
 *
 * 这样可以消除 UI 层的类型判断逻辑
 */
export function toModuleViewModel(
  module: ModuleInstance | ModuleDefinition | ToolRegistryEntry
): ModuleViewModel {
  // 类型守卫 1: ToolRegistryEntry (远程工具源)
  if ('downloadUrl' in module || ('hash' in module && !('loader' in module))) {
    const registryEntry = module as ToolRegistryEntry;
    return {
      id: registryEntry.id,
      name: registryEntry.name,
      description: registryEntry.description || '',
      version: registryEntry.version,
      category: registryEntry.category || 'utilities',
      icon: registryEntry.icon,
      keywords: registryEntry.keywords,
      screenshots: registryEntry.screenshots,
      type: 'registry',
      source:
        'sourceId' in registryEntry && registryEntry.sourceId
          ? {
              id: registryEntry.sourceId,
              name: registryEntry.sourceName || '未知来源',
            }
          : undefined,
    };
  }

  // 类型守卫 2: ModuleInstance (已安装模块)
  if ('runtime' in module && (module as ModuleInstance).runtime) {
    const instance = module as ModuleInstance;
    // 检查是否真的已安装
    const isInstalled =
      'installed' in instance.runtime ? instance.runtime.installed !== false : true;

    if (isInstalled) {
      return {
        id: instance.id,
        name: instance.definition.name,
        description: instance.definition.description || '',
        version: instance.definition.version,
        category: instance.definition.category || 'utilities',
        icon: instance.definition.icon,
        keywords: instance.definition.keywords,
        screenshots: instance.definition.screenshots,
        type: 'installed',
        runtime: {
          installed: true,
          launchState: instance.runtime.launchState ?? 'idle',
          lastLaunchedAt: instance.runtime.lastLaunchedAt,
          updateAvailable: instance.runtime.updateAvailable,
          lastError: instance.runtime.lastError,
        },
        isFavorite: instance.isFavorite,
        runtimeType: instance.definition.runtime?.type,
      };
    }
  }

  // 默认: ModuleDefinition (本地可用但未安装)
  const definition = module as ModuleDefinition;
  return {
    id: definition.id,
    name: definition.name,
    description: definition.description || '',
    version: definition.version,
    category: definition.category || 'utilities',
    icon: definition.icon,
    keywords: definition.keywords,
    screenshots: definition.screenshots,
    type: 'available',
  };
}

/**
 * 批量转换辅助函数
 */
export function toModuleViewModels(
  modules: (ModuleInstance | ModuleDefinition | ToolRegistryEntry)[]
): ModuleViewModel[] {
  return modules.map(toModuleViewModel);
}

/**
 * 类型守卫 - 判断是否为已安装模块
 * (用于需要特殊处理已安装模块的场景)
 */
export function isInstalledModule(vm: ModuleViewModel): boolean {
  return vm.type === 'installed';
}

/**
 * 类型守卫 - 判断是否为远程工具源模块
 */
export function isRegistryModule(vm: ModuleViewModel): boolean {
  return vm.type === 'registry';
}

/**
 * 类型守卫 - 判断是否为外部工具（CLI/Binary）
 * 外部工具不显示"停止"按钮
 */
export function isExternalTool(vm: ModuleViewModel): boolean {
  return vm.runtimeType === 'cli' || vm.runtimeType === 'binary';
}
