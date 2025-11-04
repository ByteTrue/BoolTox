/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
    "./src/modules/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // Apple 设计系统色彩
      colors: {
        // 品牌色 - 蓝色系
        brand: {
          blue: {
            50: '#E8F4FD',
            100: '#D1E9FB',
            200: '#A3D3F7',
            300: '#8ACEF1',
            400: '#65BBE9',  // Dark 模式主色
            500: '#51A9D5',  // Light 模式主色
            600: '#3D97C1',
            700: '#2E7FA9',
            800: '#206891',
            900: '#145279',
          },
          pink: {
            50: '#FEF5F8',
            100: '#FDEBF0',
            200: '#FBD7E1',
            300: '#F9C1CF',  // 辅助色
            400: '#F7AAB8',
            500: '#F593A1',
            600: '#F37C8A',
            700: '#F16573',
            800: '#EF4E5C',
            900: '#ED3745',
          },
        },
        
        // 语义色
        success: {
          light: '#34C759',
          dark: '#30D158',
          DEFAULT: '#34C759',
        },
        warning: {
          light: '#FF9500',
          dark: '#FF9F0A',
          DEFAULT: '#FF9500',
        },
        error: {
          light: '#FF3B30',
          dark: '#FF453A',
          DEFAULT: '#FF3B30',
        },
        info: {
          light: '#51A9D5',
          dark: '#65BBE9',
          DEFAULT: '#51A9D5',
        },
        
        // 中性色 - Light Mode
        'neutral-light': {
          text: {
            primary: 'rgba(0, 0, 0, 0.85)',
            secondary: 'rgba(0, 0, 0, 0.60)',
            tertiary: 'rgba(0, 0, 0, 0.45)',
            quaternary: 'rgba(0, 0, 0, 0.30)',
            disabled: 'rgba(0, 0, 0, 0.25)',
          },
          bg: {
            primary: '#FFFFFF',
            secondary: '#F5F5F7',
            tertiary: '#E8E8ED',
            elevated: '#FFFFFF',
            grouped: '#F2F2F7',
          },
          border: {
            primary: 'rgba(0, 0, 0, 0.10)',
            secondary: 'rgba(0, 0, 0, 0.08)',
            tertiary: 'rgba(0, 0, 0, 0.05)',
          },
        },
        
        // 中性色 - Dark Mode
        'neutral-dark': {
          text: {
            primary: 'rgba(255, 255, 255, 0.85)',
            secondary: 'rgba(255, 255, 255, 0.60)',
            tertiary: 'rgba(255, 255, 255, 0.45)',
            quaternary: 'rgba(255, 255, 255, 0.30)',
            disabled: 'rgba(255, 255, 255, 0.25)',
          },
          bg: {
            primary: '#1C1C1E',
            secondary: '#2C2C2E',
            tertiary: '#3A3A3C',
            elevated: '#1C1C1E',
            grouped: '#000000',
          },
          border: {
            primary: 'rgba(255, 255, 255, 0.13)',
            secondary: 'rgba(255, 255, 255, 0.10)',
            tertiary: 'rgba(255, 255, 255, 0.07)',
          },
        },
      },
      
      // 渐变预设
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #8ACEF1 0%, #F9C1CF 100%)',
        'brand-gradient-secondary': 'linear-gradient(135deg, #65BBE9 0%, #51A9D5 100%)',
        'brand-gradient-accent': 'linear-gradient(135deg, #65BBE9 0%, #F9C1CF 100%)',
      },
      
      // 统一动画系统 - Apple 风格
      keyframes: {
        // 淡入动画
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // 向上滑入
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // 向下滑入
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        // 缩放进入
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // 从左滑入
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'scale-in': 'scaleIn 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slideInLeft 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      // 统一持续时间
      transitionDuration: {
        '150': '150ms',
        '250': '250ms',
        '350': '350ms',
        '500': '500ms',
      },
      // 统一缓动曲线
      transitionTimingFunction: {
        'swift': 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'standard': 'cubic-bezier(0.4, 0.0, 0.6, 1)',
      },
      boxShadow: {
        // 统一的右下角柔和阴影系统 - 小而精致
        'unified-sm': '1px 1px 3px rgba(0, 0, 0, 0.06)',
        'unified-md': '2px 2px 6px rgba(0, 0, 0, 0.08)',
        'unified-lg': '3px 3px 8px rgba(0, 0, 0, 0.1)',
        'unified-xl': '4px 4px 12px rgba(0, 0, 0, 0.12)',
        'unified-2xl': '6px 6px 16px rgba(0, 0, 0, 0.15)',
        // 深色主题变体
        'unified-sm-dark': '1px 1px 3px rgba(0, 0, 0, 0.2)',
        'unified-md-dark': '2px 2px 6px rgba(0, 0, 0, 0.25)',
        'unified-lg-dark': '3px 3px 8px rgba(0, 0, 0, 0.3)',
        'unified-xl-dark': '4px 4px 12px rgba(0, 0, 0, 0.35)',
        'unified-2xl-dark': '6px 6px 16px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}