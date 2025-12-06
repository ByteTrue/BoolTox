/**
 * 用户偏好设置管理
 * 支持动画速度、主题色、布局偏好等
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type AnimationSpeed = 'disabled' | 'fast' | 'normal' | 'slow';
export type AccentColor = 'blue' | 'purple' | 'green' | 'orange' | 'pink';

interface UserPreferences {
  // 动画设置
  animationSpeed: AnimationSpeed;
  setAnimationSpeed: (speed: AnimationSpeed) => void;

  // 主题色
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;

  // 布局偏好
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // 插件偏好
  pluginViewMode: 'grid' | 'list';
  setPluginViewMode: (mode: 'grid' | 'list') => void;

  // 最近使用的插件
  recentPlugins: string[];
  addRecentPlugin: (pluginId: string) => void;

  // 收藏的插件
  favoritePlugins: string[];
  toggleFavorite: (pluginId: string) => void;

  // 重置所有偏好
  reset: () => void;
}

const defaultPreferences = {
  animationSpeed: 'normal' as AnimationSpeed,
  accentColor: 'blue' as AccentColor,
  sidebarCollapsed: false,
  pluginViewMode: 'grid' as 'grid' | 'list',
  recentPlugins: [],
  favoritePlugins: [],
};

export const useUserPreferences = create<UserPreferences>()(
  persist(
    (set) => ({
      ...defaultPreferences,

      setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
      setAccentColor: (color) => set({ accentColor: color }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setPluginViewMode: (mode) => set({ pluginViewMode: mode }),

      addRecentPlugin: (pluginId) =>
        set((state) => {
          const recent = [pluginId, ...state.recentPlugins.filter((id) => id !== pluginId)].slice(
            0,
            10
          ); // 保留最近 10 个
          return { recentPlugins: recent };
        }),

      toggleFavorite: (pluginId) =>
        set((state) => {
          const favorites = state.favoritePlugins.includes(pluginId)
            ? state.favoritePlugins.filter((id) => id !== pluginId)
            : [...state.favoritePlugins, pluginId];
          return { favoritePlugins: favorites };
        }),

      reset: () => set(defaultPreferences),
    }),
    {
      name: 'booltox-user-preferences',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        // 页面加载时立即应用主题设置
        if (typeof window !== 'undefined' && state) {
          if (state.accentColor) {
            document.documentElement.setAttribute('data-accent-color', state.accentColor);
          }
          if (state.animationSpeed) {
            document.documentElement.setAttribute('data-animation-speed', state.animationSpeed);
            const multiplier =
              state.animationSpeed === 'disabled' ? 0.01 :
              state.animationSpeed === 'fast' ? 0.7 :
              state.animationSpeed === 'slow' ? 1.5 : 1;
            document.documentElement.style.setProperty('--animation-multiplier', String(multiplier));
          }
        }
      },
    }
  )
);

/**
 * 根据动画速度获取时间倍数
 */
export function getAnimationSpeedMultiplier(speed: AnimationSpeed): number {
  switch (speed) {
    case 'disabled':
      return 0.01; // 几乎无动画
    case 'fast':
      return 0.7;
    case 'normal':
      return 1;
    case 'slow':
      return 1.5;
    default:
      return 1;
  }
}

/**
 * 主题色配置
 */
export const ACCENT_COLORS = {
  blue: {
    primary: 'hsl(217 91% 60%)',
    light: '#3b82f6',
    dark: '#2563eb',
  },
  purple: {
    primary: 'hsl(270 80% 60%)',
    light: '#a855f7',
    dark: '#9333ea',
  },
  green: {
    primary: 'hsl(142 76% 45%)',
    light: '#22c55e',
    dark: '#16a34a',
  },
  orange: {
    primary: 'hsl(25 95% 53%)',
    light: '#f97316',
    dark: '#ea580c',
  },
  pink: {
    primary: 'hsl(330 81% 60%)',
    light: '#ec4899',
    dark: '#db2777',
  },
};
