import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui.shadcn.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 优化缓存序列化，避免大字符串警告
    if (dev && config.cache) {
      config.cache = {
        ...config.cache,
        compression: false, // 禁用压缩以提升开发模式性能
      };
    }

    // 在开发模式下禁用大字符串警告
    if (dev) {
      config.infrastructureLogging = {
        ...config.infrastructureLogging,
        level: "error", // 只显示错误，过滤掉警告
      };
    }

    return config;
  },

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  // Redirects for better SEO
  async redirects() {
    return [
      {
        source: "/home",
        destination: "/dashboard",
        permanent: true,
      },
    ];
  },
};

// 使用 Sentry 配置包装 Next.js 配置
export default withSentryConfig(nextConfig, {
  // Sentry Webpack 工具选项
  silent: !process.env.CI,

  // 只在有配置时启用
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // 简化选项，避免构建问题
  widenClientFileUpload: true,
  disableLogger: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },
});
