/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 性能监控工具 - Performance Profiler
 * 用于测量和验证 Phase 1 优化效果
 */

type ChromePerformance = Performance & {
  memory?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
};

type MemorySnapshot = {
  time: number;
  memory: NonNullable<ChromePerformance['memory']>;
};

export class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  /**
   * 标记性能测量点
   */
  mark(name: string): void {
    this.marks.set(name, performance.now());
    performance.mark(name);
  }

  /**
   * 测量两个标记点之间的时间
   */
  measure(name: string, startMark: string, endMark?: string): number {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();

    if (start === undefined) {
      console.warn(`[PerformanceProfiler] Start mark "${startMark}" not found`);
      return 0;
    }

    const duration = (end || performance.now()) - start;
    this.measures.set(name, duration);

    // 使用原生 performance API 记录
    try {
      performance.measure(name, startMark, endMark);
    } catch {
      // 忽略错误（标记可能不存在）
    }

    return duration;
  }

  /**
   * 获取所有测量结果
   */
  getResults(): Record<string, number> {
    return Object.fromEntries(this.measures);
  }

  /**
   * 清除所有标记和测量
   */
  clear(): void {
    this.marks.clear();
    this.measures.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }

  /**
   * 打印性能报告
   */
  report(title = 'Performance Report'): void {
    console.group(`📊 ${title}`);
    for (const [name, duration] of this.measures.entries()) {
      const status = this.getStatus(name, duration);
      console.warn(`${status} ${name}: ${duration.toFixed(2)}ms`);
    }
    console.groupEnd();
  }

  /**
   * 根据指标判断性能状态
   */
  private getStatus(name: string, duration: number): string {
    // 启动时间目标: <2s
    if (name.includes('startup') || name.includes('initial')) {
      if (duration < 2000) return '✅';
      if (duration < 3000) return '⚠️';
      return '❌';
    }

    // 路由切换: <100ms
    if (name.includes('route') || name.includes('navigation')) {
      if (duration < 100) return '✅';
      if (duration < 300) return '⚠️';
      return '❌';
    }

    // 组件渲染: <50ms
    if (name.includes('render') || name.includes('mount')) {
      if (duration < 50) return '✅';
      if (duration < 100) return '⚠️';
      return '❌';
    }

    // 默认阈值: <200ms
    if (duration < 200) return '✅';
    if (duration < 500) return '⚠️';
    return '❌';
  }
}

/**
 * 全局性能监控器实例
 */
export const profiler = new PerformanceProfiler();

/**
 * 内存使用监控
 */
export class MemoryMonitor {
  private snapshots: MemorySnapshot[] = [];
  private intervalId: number | null = null;

  /**
   * 开始监控内存（每 5 秒采样一次）
   */
  start(intervalMs = 5000): void {
    if (this.intervalId !== null) {
      console.warn('[MemoryMonitor] Already started');
      return;
    }

    this.snapshots = [];
    this.takeSnapshot(); // 立即采样一次

    this.intervalId = window.setInterval(() => {
      this.takeSnapshot();
    }, intervalMs);

    console.warn(`🔍 [MemoryMonitor] Started (interval: ${intervalMs}ms)`);
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.warn('🛑 [MemoryMonitor] Stopped');
    }
  }

  /**
   * 采样内存使用情况
   */
  private takeSnapshot(): void {
    const perf = performance as ChromePerformance;
    if (perf.memory) {
      const memory = perf.memory;
      this.snapshots.push({
        time: Date.now(),
        memory: {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        },
      });
    } else {
      console.warn('[MemoryMonitor] performance.memory API not available (Chromium only)');
    }
  }

  /**
   * 分析内存泄漏（检测持续增长）
   */
  analyzeLeaks(): { hasLeak: boolean; trend: 'increasing' | 'stable' | 'decreasing' | 'unknown' } {
    if (this.snapshots.length < 3) {
      return { hasLeak: false, trend: 'unknown' };
    }

    // 计算内存使用趋势
    const usages = this.snapshots.map(s => s.memory.usedJSHeapSize);
    const first = usages[0];
    const last = usages[usages.length - 1];
    const increase = last - first;
    const increasePercent = (increase / first) * 100;

    // 判断是否持续增长（增长 > 20% 且最后 5 个样本都在增长）
    const recentSamples = usages.slice(-5);
    const isIncreasing = recentSamples.every((val, idx) => {
      if (idx === 0) return true;
      return val >= recentSamples[idx - 1];
    });

    const hasLeak = increasePercent > 20 && isIncreasing;

    return {
      hasLeak,
      trend: increase > 0 ? (isIncreasing ? 'increasing' : 'stable') : 'decreasing',
    };
  }

  /**
   * 打印内存报告
   */
  report(): void {
    if (this.snapshots.length === 0) {
      console.warn('[MemoryMonitor] No snapshots taken yet');
      return;
    }

    const analysis = this.analyzeLeaks();
    const first = this.snapshots[0].memory;
    const last = this.snapshots[this.snapshots.length - 1].memory;
    const duration =
      (this.snapshots[this.snapshots.length - 1].time - this.snapshots[0].time) / 1000;

    console.group('💾 Memory Usage Report');
    console.warn(`Duration: ${duration.toFixed(1)}s (${this.snapshots.length} samples)`);
    console.warn(
      `Initial: ${(first.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB / ${(first.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.warn(
      `Current: ${(last.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB / ${(last.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    );
    console.warn(
      `Change: ${((last.usedJSHeapSize - first.usedJSHeapSize) / 1024 / 1024).toFixed(2)} MB (${(
        ((last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize) *
        100
      ).toFixed(1)}%)`
    );
    console.warn(`Trend: ${analysis.trend}`);
    console.warn(`Leak Detected: ${analysis.hasLeak ? '❌ YES' : '✅ NO'}`);
    console.groupEnd();

    // 绘制简单的内存趋势图
    this.drawTrend();
  }

  /**
   * 绘制内存趋势图（控制台输出）
   */
  private drawTrend(): void {
    if (this.snapshots.length === 0) return;

    const usages = this.snapshots.map(s => s.memory.usedJSHeapSize / 1024 / 1024);
    const min = Math.min(...usages);
    const max = Math.max(...usages);
    const range = max - min || 1;

    console.warn('\n📈 Memory Trend (MB):');
    for (let i = 0; i < usages.length; i++) {
      const value = usages[i];
      const normalized = ((value - min) / range) * 20; // 0-20 个字符宽度
      const bar = '█'.repeat(Math.round(normalized)) + '░'.repeat(20 - Math.round(normalized));
      const time = new Date(this.snapshots[i].time).toLocaleTimeString();
      console.warn(`${time} [${bar}] ${value.toFixed(2)} MB`);
    }
  }

  /**
   * 清除所有快照
   */
  clear(): void {
    this.snapshots = [];
  }
}

/**
 * 全局内存监控器实例
 */
export const memoryMonitor = new MemoryMonitor();

/**
 * FPS 监控器
 */
export class FPSMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 60;
  private rafId: number | null = null;

  /**
   * 开始监控 FPS
   */
  start(onUpdate?: (fps: number) => void): void {
    if (this.rafId !== null) {
      console.warn('[FPSMonitor] Already started');
      return;
    }

    const measureFPS = () => {
      this.frameCount++;
      const currentTime = performance.now();
      const delta = currentTime - this.lastTime;

      // 每秒更新一次 FPS
      if (delta >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / delta);
        onUpdate?.(this.fps);
        this.frameCount = 0;
        this.lastTime = currentTime;
      }

      this.rafId = requestAnimationFrame(measureFPS);
    };

    this.rafId = requestAnimationFrame(measureFPS);
    console.warn('🎬 [FPSMonitor] Started');
  }

  /**
   * 停止监控
   */
  stop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
      console.warn('🛑 [FPSMonitor] Stopped');
    }
  }

  /**
   * 获取当前 FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * 检查 FPS 是否达标（目标 60fps）
   */
  isTargetMet(targetFPS = 60): boolean {
    return this.fps >= targetFPS * 0.9; // 允许 10% 容差
  }
}

/**
 * 全局 FPS 监控器实例
 */
export const fpsMonitor = new FPSMonitor();
