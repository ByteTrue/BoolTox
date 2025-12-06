/**
 * Web Vitals 性能监控
 * 自动收集和上报 Core Web Vitals 指标
 */

'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export type Metric = {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
};

/**
 * 性能指标阈值（基于 Google 推荐）
 */
const THRESHOLDS = {
  // Largest Contentful Paint
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte
  TTFB: {
    good: 800,
    poor: 1800,
  },
  // Interaction to Next Paint
  INP: {
    good: 200,
    poor: 500,
  },
};

/**
 * 获取性能评级
 */
function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * 上报性能指标
 */
function reportMetric(metric: Metric) {
  // 开发环境：控制台输出
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value.toFixed(2),
      rating: metric.rating,
      delta: metric.delta.toFixed(2),
    });
  }

  // 生产环境：发送到分析服务
  if (process.env.NODE_ENV === 'production') {
    // 可以集成 Google Analytics、Vercel Analytics 等
    if (window.gtag) {
      window.gtag('event', metric.name, {
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_delta: Math.round(metric.delta),
      });
    }
  }
}

/**
 * Web Vitals 监控组件
 */
export function WebVitals() {
  const pathname = usePathname();

  useEffect(() => {
    // 动态导入 web-vitals 库（减小初始包体积）
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS((metric) => reportMetric({ ...metric, rating: getRating('CLS', metric.value) }));
      onFCP((metric) => reportMetric({ ...metric, rating: getRating('FCP', metric.value) }));
      onLCP((metric) => reportMetric({ ...metric, rating: getRating('LCP', metric.value) }));
      onTTFB((metric) => reportMetric({ ...metric, rating: getRating('TTFB', metric.value) }));
      onINP((metric) => reportMetric({ ...metric, rating: getRating('INP', metric.value) }));
    });
  }, [pathname]);

  return null;
}

/**
 * 性能监控钩子（用于调试）
 */
export function usePerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`[Performance] ${entry.name}:`, entry.duration.toFixed(2), 'ms');
      }
    });

    observer.observe({ entryTypes: ['measure', 'navigation', 'resource'] });

    return () => observer.disconnect();
  }, []);
}

// TypeScript 声明
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
