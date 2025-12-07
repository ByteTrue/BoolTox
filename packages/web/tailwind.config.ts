import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // 品牌色（使用 CSS 变量，支持主题定制）
        primary: {
          50: 'hsl(var(--primary) / 0.05)',
          100: 'hsl(var(--primary) / 0.1)',
          200: 'hsl(var(--primary) / 0.2)',
          300: 'hsl(var(--primary) / 0.3)',
          400: 'hsl(var(--primary) / 0.6)',
          500: 'hsl(var(--primary))',  // 主品牌色
          600: 'hsl(var(--primary) / 0.9)',
          700: 'hsl(var(--primary) / 0.8)',
          800: 'hsl(var(--primary) / 0.7)',
          900: 'hsl(var(--primary) / 0.6)',
          950: 'hsl(var(--primary) / 0.4)',
        },

        // 中性色（深空灰系统）
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },

        // 语义色（增强版）
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#059669', // 翡翠绿 - 官方插件
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // 社区插件警告
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },

        // shadcn/ui 变量
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },

      // 圆角系统（几何感）
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '16px',   // 大卡片
        '2xl': '24px', // 模态框
        '3xl': '32px', // Hero 区域
      },

      // 间距系统（4px 基础单位）
      spacing: {
        '18': '4.5rem',  // 72px
        '112': '28rem',  // 448px
      },

      // 阴影系统（层次分明）
      boxShadow: {
        // 原有的柔和阴影
        soft: '0 2px 8px -2px rgb(0 0 0 / 0.05), 0 6px 20px -3px rgb(0 0 0 / 0.1)',
        'soft-lg': '0 4px 16px -4px rgb(0 0 0 / 0.05), 0 12px 32px -6px rgb(0 0 0 / 0.1)',

        // 新增的阴影系统
        sm: '0 2px 4px -1px rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        md: '0 4px 12px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.12)',
        lg: '0 20px 40px -8px rgb(0 0 0 / 0.12), 0 8px 16px -4px rgb(0 0 0 / 0.16)',

        // 霓虹光晕效果
        glow: '0 8px 24px -4px rgb(14 165 233 / 0.4)',
        'glow-purple': '0 8px 24px -4px rgb(168 85 247 / 0.4)',
        'glow-green': '0 8px 24px -4px rgb(5 150 105 / 0.4)',
      },

      // 动画曲线（Apple 标准 + 自定义）
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'apple-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'apple-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },

      // 字体系统
      fontFamily: {
        sans: [
          'Inter Variable',
          'Inter',
          'SF Pro Display',
          'Noto Sans SC',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'Fira Code',
          'SF Mono',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },

      // 字号系统（1.250 Major Third Scale）
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.5' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5' }],     // 14px
        base: ['1rem', { lineHeight: '1.6' }],       // 16px
        lg: ['1.25rem', { lineHeight: '1.5' }],      // 20px
        xl: ['1.563rem', { lineHeight: '1.4' }],     // 25px
        '2xl': ['1.953rem', { lineHeight: '1.3' }],  // 31px
        '3xl': ['2.441rem', { lineHeight: '1.2' }],  // 39px
        '4xl': ['3.052rem', { lineHeight: '1.1' }],  // 49px
        '5xl': ['3.815rem', { lineHeight: '1.1' }],  // 61px
        '6xl': ['4.768rem', { lineHeight: '1' }],    // 76px
        '7xl': ['5.96rem', { lineHeight: '1' }],     // 95px
        '8xl': ['7.451rem', { lineHeight: '1' }],    // 119px
      },

      // 动画关键帧
      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-down': {
          from: { opacity: '0', transform: 'translateY(-24px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.5s ease-out',
        'fade-in-down': 'fade-in-down 0.5s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
