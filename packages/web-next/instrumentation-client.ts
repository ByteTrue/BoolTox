import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 设置采样率
  tracesSampleRate: 1.0,

  // 设置环境
  environment: process.env.NODE_ENV,

  // 调试模式（开发环境可以设为 true）
  debug: false,

  // 捕获重放会话
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// 导出路由转换追踪 hook
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
