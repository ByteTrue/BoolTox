/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useReducedMotion } from '@/hooks/use-reduced-motion';

/**
 * 动画配置接口
 *
 * 根据用户偏好和设备性能,动态调整动画级别
 */
interface AnimationConfig {
  /** 是否启用高级动画(页面转场、stagger等) */
  enableAdvanced: boolean;
  /** 是否启用3D效果 */
  enable3D: boolean;
  /** 是否启用Stagger列表动画 */
  enableStagger: boolean;
  /** 是否启用所有动画(总开关) */
  enableAll: boolean;
}

const AnimationContext = createContext<AnimationConfig | null>(null);

interface AnimationProviderProps {
  children: ReactNode;
}

/**
 * 动画配置提供者
 *
 * 自动检测以下条件并降级动画:
 * 1. 用户开启prefers-reduced-motion → 禁用所有动画
 * 2. 低端设备(CPU<4核或内存<4GB) → 禁用3D效果
 *
 * @example
 * ```tsx
 * // 在main.tsx根组件中包裹:
 * <AnimationProvider>
 *   <App />
 * </AnimationProvider>
 * ```
 */
export function AnimationProvider({ children }: AnimationProviderProps) {
  const prefersReducedMotion = useReducedMotion();

  const config = useMemo<AnimationConfig>(() => {
    // 如果用户开启减少动画,全部禁用
    if (prefersReducedMotion) {
      return {
        enableAdvanced: false,
        enable3D: false,
        enableStagger: false,
        enableAll: false,
      };
    }

    // 检测设备性能(可选,暂时全部启用)
    // 未来可以根据navigator.hardwareConcurrency和deviceMemory判断
    const isLowEndDevice = false; // 预留接口

    return {
      enableAdvanced: true,
      enable3D: !isLowEndDevice,
      enableStagger: true,
      enableAll: true,
    };
  }, [prefersReducedMotion]);

  return <AnimationContext.Provider value={config}>{children}</AnimationContext.Provider>;
}

/**
 * 使用动画配置
 *
 * @returns {AnimationConfig} 当前动画配置
 *
 * @example
 * ```tsx
 * const { enable3D } = useAnimationConfig();
 *
 * return enable3D ? (
 *   <Card3D>{children}</Card3D>
 * ) : (
 *   <div>{children}</div>
 * );
 * ```
 */
export function useAnimationConfig(): AnimationConfig {
  const context = useContext(AnimationContext);
  if (context === null) {
    throw new Error('useAnimationConfig must be used within AnimationProvider');
  }
  return context;
}
