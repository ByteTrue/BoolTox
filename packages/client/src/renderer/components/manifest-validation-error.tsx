/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Chip from '@mui/material/Chip';
import { AlertCircle, ExternalLink } from 'lucide-react';

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
  return (
    <Alert
      severity="error"
      icon={<AlertCircle size={20} />}
      sx={{ borderRadius: 3, p: 3 }}
    >
      <AlertTitle sx={{ fontWeight: 700 }}>
        booltox.json 验证失败
      </AlertTitle>
      <Typography variant="body2" sx={{ mb: 2 }}>
        发现 {errors.length} 个配置错误，请修复后重试
      </Typography>

      <Stack spacing={2}>
        {errors.map((error, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                ✗
              </Typography>
              <Typography variant="body2" fontWeight={600} color="error.main">
                {error.message}
              </Typography>
            </Stack>

            {error.field && error.field !== 'unknown' && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                字段：
                <Chip
                  label={error.field}
                  size="small"
                  sx={{
                    ml: 1,
                    height: 20,
                    fontFamily: 'monospace',
                    fontSize: '0.7rem',
                  }}
                />
              </Typography>
            )}

            {error.suggestedFix && (
              <Paper
                sx={{
                  mt: 1,
                  p: 1.5,
                  bgcolor: 'info.light',
                  borderRadius: 1,
                }}
              >
                <Typography variant="caption" fontWeight={600} sx={{ display: 'block', mb: 0.5 }}>
                  💡 修复建议：
                </Typography>
                <Typography
                  variant="caption"
                  component="code"
                  sx={{
                    display: 'block',
                    fontFamily: 'monospace',
                    color: 'info.dark',
                  }}
                >
                  {error.suggestedFix}
                </Typography>
              </Paper>
            )}
          </Paper>
        ))}
      </Stack>

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Link
          href="https://github.com/ByteTrue/BoolTox/blob/main/docs/tool-manifest.md"
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            fontSize: '0.75rem',
          }}
        >
          <ExternalLink size={12} />
          <span>查看配置文档</span>
        </Link>

        {manifestPath && (
          <Link
            component="button"
            onClick={() => {
              // 在编辑器中打开文件
              window.ipc?.invoke?.('shell:open-path', manifestPath);
            }}
            underline="hover"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontSize: '0.75rem',
            }}
          >
            <ExternalLink size={12} />
            <span>在编辑器中打开</span>
          </Link>
        )}
      </Stack>
    </Alert>
  );
}
