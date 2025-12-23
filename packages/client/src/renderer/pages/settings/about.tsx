/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 关于页面
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import { ExternalLink } from 'lucide-react';

export function AboutSettings() {
  const links = [
    { label: '官网', url: 'https://booltox.com' },
    { label: 'GitHub', url: 'https://github.com/ByteTrue/BoolTox' },
    { label: '工具仓库', url: 'https://github.com/ByteTrue/booltox-plugins' },
    { label: '问题反馈', url: 'https://github.com/ByteTrue/BoolTox/issues' },
  ];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <Stack spacing={4} sx={{ maxWidth: 600, width: '100%', px: 4 }}>
        {/* Logo 和标题 */}
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              p: 1.5,
              boxShadow: 3,
              mb: 2,
            }}
          >
            <Typography variant="h2">📦</Typography>
          </Box>
          <Typography variant="h3" fontWeight={700} sx={{ mb: 1 }}>
            BoolTox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            版本 0.0.1
          </Typography>
        </Box>

        {/* 简介 */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            bgcolor: 'action.hover',
          }}
        >
          <Typography variant="body1" textAlign="center" color="text.primary">
            开源、可扩展的工具箱平台
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
            Web 优先 · 工具生态 · 本地 Agent · 隐私优先
          </Typography>
        </Paper>

        {/* 链接 */}
        <Stack spacing={1}>
          {links.map(link => (
            <Link
              key={link.label}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Typography variant="body1" color="text.primary">
                {link.label}
              </Typography>
              <ExternalLink size={16} color="var(--mui-palette-text-secondary)" />
            </Link>
          ))}
        </Stack>

        {/* 许可证 */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.disabled">
            Copyright © 2025 ByteTrue
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mt: 0.5 }}>
            Licensed under CC-BY-NC-4.0
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
