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

        // 中性色（现代简约风格）
        neutral: {
          50: '#fafafa', // 背景色
          100: '#f5f5f5', // 卡片背景
          200: '#e5e5e5', // 边框
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373', // 辅助文字
          600: '#525252',
          700: '#404040',
          800: '#262626', // 主文字
          900: '#171717', // 深色背景
          950: '#0a0a0a',
        },

        // 语义色
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e', // 官方插件标记
          600: '#16a34a',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b', // 社区插件警告
          600: '#d97706',
          900: '#78350f',
        },
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          900: '#7f1d1d',
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

      // 圆角（Apple 风格）
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: '16px', // 卡片
        '2xl': '24px', // 大型容器
        '3xl': '32px', // Hero 区域
      },

      // 间距系统（8px 栅格）
      spacing: {
        '18': '4.5rem', // 72px
        '112': '28rem', // 448px
      },

      // 阴影（柔和）
      boxShadow: {
        soft: '0 2px 8px -2px rgb(0 0 0 / 0.05), 0 6px 20px -3px rgb(0 0 0 / 0.1)',
        'soft-lg':
          '0 4px 16px -4px rgb(0 0 0 / 0.05), 0 12px 32px -6px rgb(0 0 0 / 0.1)',
      },

      // 动画曲线（Apple 标准）
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        'apple-in': 'cubic-bezier(0.4, 0.0, 1, 1)',
        'apple-out': 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      },

      // 字体
      fontFamily: {
        sans: [
          'Inter',
          'SF Pro Display',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
