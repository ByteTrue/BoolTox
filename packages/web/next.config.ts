import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 输出模式
  output: 'standalone',

  // 严格模式
  reactStrictMode: true,

  // Transpile workspace packages
  transpilePackages: ['@booltox/sdk', '@booltox/shared'],

  // 实验性功能
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },

  // 图片优化
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
    ],
  },

  // 环境变量
  env: {
    NEXT_PUBLIC_AGENT_URL: process.env.NEXT_PUBLIC_AGENT_URL || 'http://localhost:9527',
  },
};

export default nextConfig;
