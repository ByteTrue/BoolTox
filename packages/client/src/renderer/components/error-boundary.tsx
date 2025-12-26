/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 全局错误边界 - React Error Boundary
 * 捕获组件树中的 JavaScript 错误，防止整个应用崩溃
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

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
 * 错误回退 UI
 */
function ErrorFallback({
  error,
  errorInfo,
  onReset,
  onGoHome,
  showHomeButton = true,
}: {
  error: Error;
  errorInfo: ErrorInfo;
  onReset: () => void;
  onGoHome?: () => void;
  showHomeButton?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4,
        bgcolor: 'background.default',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 600,
          borderRadius: 3,
          p: 4,
        }}
      >
        {/* 错误图标 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              borderRadius: '50%',
              p: 2,
              bgcolor: 'error.main',
              color: 'error.contrastText',
              opacity: 0.15,
            }}
          >
            <AlertTriangle size={48} strokeWidth={1.5} />
          </Box>
        </Box>

        {/* 错误标题 */}
        <Typography variant="h5" fontWeight={700} textAlign="center" sx={{ mb: 1.5 }}>
          出错了
        </Typography>

        {/* 错误描述 */}
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mb: 3 }}>
          应用程序遇到了一个意外错误。您可以尝试重新加载此组件，或返回首页继续使用。
        </Typography>

        {/* 错误详情（可折叠） */}
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          <Button
            fullWidth
            onClick={() => setDetailsOpen(!detailsOpen)}
            sx={{
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              textTransform: 'none',
              fontWeight: 600,
            }}
            endIcon={detailsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          >
            查看错误详情
          </Button>
          <Collapse in={detailsOpen}>
            <Box
              sx={{
                p: 2,
                pt: 0,
                maxHeight: 200,
                overflow: 'auto',
              }}
            >
              <Typography
                variant="caption"
                color="error.main"
                fontWeight={600}
                sx={{ display: 'block', mb: 1 }}
              >
                {error.name}: {error.message}
              </Typography>
              <Typography
                component="pre"
                variant="caption"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'text.secondary',
                  fontFamily: 'monospace',
                }}
              >
                {errorInfo.componentStack}
              </Typography>
            </Box>
          </Collapse>
        </Paper>

        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<RefreshCw size={16} />}
            onClick={onReset}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            重新加载
          </Button>

          {showHomeButton && onGoHome && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Home size={16} />}
              onClick={onGoHome}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              回到首页
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
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
    // 触发导航逻辑
    window.location.hash = '#/';
  };

  render() {
    if (this.state.hasError && this.state.error && this.state.errorInfo) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
          showHomeButton={this.props.showHomeButton}
        />
      );
    }

    return this.props.children;
  }
}
