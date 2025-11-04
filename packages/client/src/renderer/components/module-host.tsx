import type { ModuleInstance } from "@core/modules/types";

interface ModuleHostProps {
  module: ModuleInstance | null;
}

export function ModuleHost({ module }: ModuleHostProps) {
  if (!module) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--shell-border)] bg-[var(--shell-soft)] text-sm text-[var(--text-secondary)]">
        选择左侧模块开始使用。
      </div>
    );
  }

  if (module.runtime.loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-[var(--shell-border)] bg-[var(--shell-soft)]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent-soft)] border-t-[var(--accent-strong)]" />
        <p className="text-sm text-[var(--text-secondary)]">正在加载 {module.definition.name}</p>
      </div>
    );
  }

  if (module.runtime.error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-red-200 bg-red-50 text-red-600">
        <p className="text-sm font-semibold">模块加载失败</p>
        <p className="text-xs opacity-80">{module.runtime.error}</p>
      </div>
    );
  }

  if (!module.runtime.component) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--shell-border)] bg-[var(--shell-soft)] text-sm text-[var(--text-secondary)]">
        模块入口未准备就绪。
      </div>
    );
  }

  const Component = module.runtime.component;
  return (
    <div className="h-full min-h-0 overflow-hidden rounded-3xl">
      <Component />
    </div>
  );
}
