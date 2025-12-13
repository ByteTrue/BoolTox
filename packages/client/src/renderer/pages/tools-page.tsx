/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { ModuleCenter } from '../components/module-center';

/**
 * 工具页（全屏网格布局）
 * 直接复用现有的 ModuleCenter 组件
 */
export function ToolsPage() {
  return (
    <div className="h-full overflow-hidden px-8 py-6">
      <ModuleCenter />
    </div>
  );
}
