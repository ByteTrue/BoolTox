/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { AlertCircle, ExternalLink } from 'lucide-react';
import { useTheme } from './theme-provider';

interface ValidationError {
  field: string;
  message: string;
  suggestedFix?: string;
}

interface ManifestValidationErrorProps {
  errors: ValidationError[];
  manifestPath?: string;
}

export function ManifestValidationError({ errors, manifestPath }: ManifestValidationErrorProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={`rounded-xl border p-6 ${
        isDark ? 'border-red-500/30 bg-red-500/10' : 'border-red-200 bg-red-50'
      }`}
    >
      <div className="mb-4 flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        <div className="flex-1">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
            booltox.json 验证失败
          </h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            发现 {errors.length} 个配置错误，请修复后重试
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {errors.map((error, index) => (
          <div
            key={index}
            className={`rounded-lg border p-4 ${
              isDark ? 'border-white/10 bg-black/20' : 'border-slate-200 bg-white'
            }`}
          >
            <div
              className={`mb-2 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}
            >
              <span className="font-mono text-xs">✗</span>
              <span className="text-sm font-medium">{error.message}</span>
            </div>

            {error.field && error.field !== 'unknown' && (
              <p className={`mb-2 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
                字段：
                <code className="ml-1 rounded bg-slate-700 px-1.5 py-0.5 text-white">
                  {error.field}
                </code>
              </p>
            )}

            {error.suggestedFix && (
              <div
                className={`mt-2 rounded bg-blue-500/10 p-3 text-xs ${
                  isDark ? 'text-blue-300' : 'text-blue-700'
                }`}
              >
                <p className="mb-1 font-medium">💡 修复建议：</p>
                <code className={`block font-mono ${isDark ? 'text-blue-200' : 'text-blue-800'}`}>
                  {error.suggestedFix}
                </code>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs">
        <a
          href="https://github.com/ByteTrue/BoolTox/blob/main/docs/tool-manifest.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-blue-500 hover:underline"
        >
          <ExternalLink size={12} />
          <span>查看配置文档</span>
        </a>

        {manifestPath && (
          <button
            type="button"
            onClick={() => {
              // 在编辑器中打开文件
              window.ipc?.invoke?.('shell:open-path', manifestPath);
            }}
            className="flex items-center gap-1 text-blue-500 hover:underline"
          >
            <ExternalLink size={12} />
            <span>在编辑器中打开</span>
          </button>
        )}
      </div>
    </div>
  );
}
