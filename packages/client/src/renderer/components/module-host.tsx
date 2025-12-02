/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ModuleInstance } from "@/types/module";
import { useModulePlatform } from "@/contexts/module-context";

interface ModuleHostProps {
  module: ModuleInstance | null;
}

export function ModuleHost({ module }: ModuleHostProps) {
  const { openModule, focusModuleWindow } = useModulePlatform();

  if (!module) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl border border-dashed border-[var(--shell-border)] bg-[var(--shell-soft)] text-sm text-[var(--text-secondary)]">
        选择左侧模块开始使用。
      </div>
    );
  }

  // New Architecture: Plugin (BrowserView)
  // New plugins run inside dedicated windows, we keep an informative panel here.
  if (module.id.startsWith("com.booltox.")) {
    const launchState = module.runtime.launchState ?? "idle";
    const isRunning = launchState === "running";
    const isLaunching = launchState === "launching";
    const handleOpen = () => {
      if (isRunning) {
        void focusModuleWindow(module.id);
      } else {
        void openModule(module.id);
      }
    };

    return (
      <div className="flex h-full w-full min-h-[320px] flex-col items-center justify-center gap-6 rounded-3xl border border-dashed border-[var(--shell-border)] bg-[var(--shell-soft)] px-6 text-center">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {module.definition.name} 在独立窗口中运行
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            点击下方按钮即可{isRunning ? "聚焦" : isLaunching ? "等待启动完成后重试" : "在新窗口启动"}插件。
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpen}
            disabled={isLaunching}
            className={`rounded-full border border-blue-500/30 bg-blue-500/15 px-5 py-2 text-sm font-semibold text-blue-500 shadow-sm transition-[transform,background-color] duration-200 hover:bg-blue-500/25 hover:scale-[1.02] ${
              isLaunching ? "cursor-wait opacity-70 hover:scale-100 hover:bg-blue-500/15" : ""
            }`}
          >
            {isLaunching ? "启动中…" : isRunning ? "聚焦插件窗口" : "打开插件窗口"}
          </button>
          {isRunning && (
            <span className="rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-semibold text-green-500">
              窗口已运行
            </span>
          )}
          {launchState === "error" && (
            <span className="rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-500">
              启动失败，可重试
            </span>
          )}
        </div>
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
