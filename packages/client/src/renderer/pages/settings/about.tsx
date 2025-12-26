/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * AboutSettings - 关于页面
 * 使用新的 SettingCard 组件重构，添加品牌渐变效果
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import { ExternalLink, Github, Globe, MessageSquare, Package } from 'lucide-react';
import { SettingCard } from '@/components/settings';
import { brandGradient, shimmer, transitions } from '@/theme/animations';
import { APP_VERSION } from '@/config/app-info';
import { BRAND } from '@shared/brand';

const LINKS = [
  { label: '官网', url: BRAND.HOMEPAGE, icon: Globe },
  { label: 'GitHub', url: BRAND.GITHUB_URL, icon: Github },
  { label: '工具仓库', url: BRAND.TOOLS_REPO_URL, icon: Package },
  { label: '问题反馈', url: BRAND.ISSUES_URL, icon: MessageSquare },
];

export function AboutSettings() {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
      }}
    >
      <Stack spacing={4} sx={{ maxWidth: 500, width: '100%' }}>
        {/* ============================================================
            Logo 和标题
            ============================================================ */}
        <Box sx={{ textAlign: 'center' }}>
          {/* Logo 容器 - 品牌渐变 */}
          <Box
            sx={{
              display: 'inline-flex',
              borderRadius: 4,
              background: isDark ? brandGradient.dark : brandGradient.light,
              p: 2,
              boxShadow: isDark
                ? `0 8px 32px ${alpha('#60A5FA', 0.25)}`
                : `0 8px 32px ${alpha('#3B82F6', 0.2)}`,
              mb: 3,
              position: 'relative',
              overflow: 'hidden',
              // Shimmer 效果 - 慢速单次
              '&::after': {
                content: '""',
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(90deg, transparent, ${alpha('#fff', 0.3)}, transparent)`,
                backgroundSize: '200% 100%',
                animation: `${shimmer} 2s ease-out`,
              },
            }}
          >
            <Typography
              variant="h2"
              sx={{
                position: 'relative',
                zIndex: 1,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
              }}
            >
              📦
            </Typography>
          </Box>

          <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ mb: 0.5 }}>
            BoolTox
          </Typography>
          <Typography variant="body2" color="text.secondary">
            版本 {APP_VERSION}
          </Typography>
        </Box>

        {/* ============================================================
            简介卡片
            ============================================================ */}
        <SettingCard title="关于">
          <Box sx={{ textAlign: 'center', py: 1 }}>
            <Typography variant="body1" fontWeight={500} sx={{ mb: 1 }}>
              一键运行开发者工具
            </Typography>
            <Typography variant="body2" color="text.secondary">
              去中心化 · 零 SDK 依赖 · 自动环境管理 · 隐私优先
            </Typography>
          </Box>
        </SettingCard>

        {/* ============================================================
            链接卡片
            ============================================================ */}
        <SettingCard title="链接">
          <Stack spacing={1}>
            {LINKS.map(link => (
              <LinkItem key={link.label} {...link} />
            ))}
          </Stack>
        </SettingCard>

        {/* ============================================================
            许可证
            ============================================================ */}
        <Box sx={{ textAlign: 'center', pt: 2 }}>
          <Typography variant="caption" color="text.disabled">
            Copyright © 2025 ByteTrue
          </Typography>
          <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5 }}>
            Licensed under CC-BY-NC-4.0
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

// 链接项组件
function LinkItem({ label, url, icon: Icon }: { label: string; url: string; icon: typeof Globe }) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box
      component="a"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 1.5,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isHovered
          ? isDark
            ? alpha('#fff', 0.15)
            : alpha(theme.palette.primary.main, 0.3)
          : 'divider',
        textDecoration: 'none',
        color: 'text.primary',
        bgcolor: isHovered
          ? isDark
            ? alpha('#fff', 0.03)
            : alpha(theme.palette.primary.main, 0.02)
          : 'transparent',
        transform: isHovered ? 'translateX(4px)' : 'translateX(0)',
        transition: transitions.hover,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Icon size={18} />
        <Typography variant="body2" fontWeight={500}>
          {label}
        </Typography>
      </Box>
      <ExternalLink
        size={16}
        style={{
          opacity: isHovered ? 1 : 0.5,
          transition: 'opacity 0.15s ease',
        }}
      />
    </Box>
  );
}
