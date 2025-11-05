/**
 * 全局错误边界 - React Error Boundary
 * 捕获组件树中的 JavaScript 错误，防止整个应用崩溃
 * 提供 Apple 风格的错误回退 UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { getGlassStyle, getGlassShadow, GLASS_BORDERS } from '../utils/glass-layers';

interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * 错误边界名称，用于日志追踪
   */
  name?: string;
  /**
   * 是否显示回到首页按钮
   */
  showHomeButton?: boolean;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Apple 风格错误回退 UI
 */
function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
  showHomeButton = true,
  theme = 'dark',
}: {
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
  theme?: 'light' | 'dark';
}) {
  const isDark = theme === 'dark';

  return (
    <div
      className="flex h-full w-full items-center justify-center p-8"
      style={{
        background: isDark
          ? 'linear-gradient(135deg, rgba(30, 40, 60, 0.95) 0%, rgba(20, 25, 40, 0.95) 100%)'
          : 'linear-gradient(135deg, rgba(240, 245, 250, 0.95) 0%, rgba(230, 235, 245, 0.95) 100%)',
      }}
    >
      <div
        className={`w-full max-w-2xl rounded-3xl border p-8 ${getGlassShadow(theme)}`}
        style={{
          ...getGlassStyle('MODAL', theme, {
            withBorderGlow: true,
            withInnerShadow: true,
          }),
        }}
      >
        {/* 错误图标 */}
        <div className="mb-6 flex justify-center">
          <div
            className="inline-flex rounded-full p-4"
            style={{
              background: isDark
                ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)'
                : 'linear-gradient(135deg, rgba(239, 68, 68, 0.12) 0%, rgba(220, 38, 38, 0.12) 100%)',
              boxShadow: isDark
                ? '0 0 20px rgba(239, 68, 68, 0.3)'
                : '0 0 20px rgba(239, 68, 68, 0.2)',
            }}
          >
            <AlertTriangle
              size={48}
              className={isDark ? 'text-red-400' : 'text-red-600'}
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* 错误标题 */}
        <h2
          className={`mb-3 text-center text-2xl font-bold ${
            isDark ? 'text-white' : 'text-slate-800'
          }`}
        >
          出错了
        </h2>

        {/* 错误描述 */}
        <p
          className={`mb-6 text-center text-sm ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}
        >
          应用程序遇到了一个意外错误。您可以尝试重新加载此组件，或返回首页继续使用。
        </p>

        {/* 错误详情（可折叠） */}
        <details
          className={`mb-6 rounded-xl border p-4`}
          style={{
            ...getGlassStyle('CARD', theme),
            borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
            maxHeight: '200px',
            overflow: 'auto',
          }}
        >
          <summary
            className={`cursor-pointer text-sm font-semibold ${
              isDark ? 'text-white/80' : 'text-slate-700'
            }`}
          >
            查看错误详情
          </summary>
          <div className={`mt-3 text-xs ${isDark ? 'text-red-400' : 'text-red-600'}`}>
            <p className="mb-2 font-semibold">{error.name}: {error.message}</p>
            <pre className="overflow-auto whitespace-pre-wrap break-words">
              {errorInfo.componentStack}
            </pre>
          </div>
        </details>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onReset}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
              isDark
                ? 'border-blue-500/30 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                : 'border-blue-600/30 bg-blue-600/20 text-blue-600 hover:bg-blue-600/30'
            }`}
            style={getGlassStyle('BUTTON', theme, {
              withBorderGlow: true,
              withInnerShadow: true,
            })}
          >
            <RefreshCw size={16} />
            重新加载
          </button>

          {showHomeButton && onGoHome && (
            <button
              type="button"
              onClick={onGoHome}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-all duration-200 ${
                isDark
                  ? 'bg-white/10 text-white hover:bg-white/15'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
              style={{
                ...getGlassStyle('BUTTON', theme),
                borderColor: isDark ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT
              }}
            >
              <Home size={16} />
              回到首页
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 错误边界组件
 * 
 * 使用方式：
 * ```tsx
 * <ErrorBoundary name="App Root" showHomeButton={false}>
 *   <App />
 * </ErrorBoundary>
 * 
 * <ErrorBoundary name="Route: ModuleCenter">
 *   <ModuleCenter />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 记录错误到控制台和错误追踪服务
    const boundaryName = this.props.name || 'Unknown';
    console.error(`[ErrorBoundary: ${boundaryName}] Caught error:`, error);
    console.error(`[ErrorBoundary: ${boundaryName}] Component stack:`, errorInfo.componentStack);

    // 更新 state 以包含错误详情
    this.setState({
      error,
      errorInfo,
    });

    // TODO: 发送错误到 Sentry 或其他错误追踪服务
    // if (window.electronAPI?.reportError) {
    //   window.electronAPI.reportError({
    //     boundary: boundaryName,
    //     error: {
    //       name: error.name,
    //       message: error.message,
    //       stack: error.stack,
    //     },
    //     componentStack: errorInfo.componentStack,
    //   });
    // }
  }

  handleReset = (): void => {
    // 重置错误状态，重新渲染子组件
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    // 重置错误并导航到首页
    this.handleReset();
    // 触发导航逻辑（如果需要）
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      // 获取当前主题（从 localStorage 或默认）
      const theme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          showHomeButton={this.props.showHomeButton}
          theme={theme}
        />
      );
    }

    return this.props.children;
  }
}
