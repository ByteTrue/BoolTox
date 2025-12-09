import * as Sentry from "@sentry/nextjs";

// 只在配置了有效的 Sentry DSN 时才初始化
const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn && sentryDsn !== "your_sentry_dsn_here" && !sentryDsn.includes("placeholder")) {
  Sentry.init({
    dsn: sentryDsn,

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
} else if (process.env.NODE_ENV === "development") {
  console.log("⚠️  Sentry 未初始化：未配置有效的 DSN（开发环境可忽略）");
}

// 导出路由转换追踪 hook
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
