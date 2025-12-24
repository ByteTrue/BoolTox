/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';

interface HeroBannerProps {
  label?: string;
  title: string;
  description: string;
  gradient: string;
  pattern?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

/**
 * Hero Banner 横幅组件
 */
export function HeroBanner({
  label = '编辑推荐',
  title,
  description,
  gradient,
  pattern,
  action,
  icon,
}: HeroBannerProps) {
  return (
    <Fade in timeout={600}>
      <Box
        sx={{
          position: 'relative',
          height: 400,
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: 6,
        }}
      >
        {/* 渐变背景 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: gradient,
          }}
        />

        {/* 装饰图案 */}
        {pattern && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              opacity: 0.2,
            }}
          >
            <img
              src={pattern}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'overlay' }}
            />
          </Box>
        )}

        {/* 几何装饰 */}
        <Box sx={{ position: 'absolute', inset: 0, opacity: 0.1 }}>
          <svg width="100%" height="100%" viewBox="0 0 400 400" fill="none">
            <circle cx="350" cy="50" r="80" fill="white" />
            <circle cx="50" cy="350" r="100" fill="white" />
            <rect
              x="200"
              y="200"
              width="150"
              height="150"
              fill="white"
              transform="rotate(45 275 275)"
            />
          </svg>
        </Box>

        {/* 内容层 */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            p: 5,
            color: 'white',
          }}
        >
          {/* 图标 */}
          {icon && (
            <Box
              sx={{
                mb: 3,
                width: 64,
                height: 64,
                borderRadius: 3,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {icon}
            </Box>
          )}

          {/* 标签 */}
          <Typography
            variant="overline"
            sx={{
              fontWeight: 600,
              letterSpacing: 1.5,
              opacity: 0.9,
            }}
          >
            {label}
          </Typography>

          {/* 标题 */}
          <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }}>
            {title}
          </Typography>

          {/* 描述 */}
          <Typography
            variant="body1"
            sx={{
              mt: 1.5,
              maxWidth: 480,
              opacity: 0.9,
              lineHeight: 1.6,
            }}
          >
            {description}
          </Typography>

          {/* 操作按钮 */}
          {action && (
            <Button
              variant="contained"
              onClick={action.onClick}
              sx={{
                mt: 3,
                width: 'fit-content',
                bgcolor: 'white',
                color: 'grey.900',
                fontWeight: 600,
                borderRadius: 5,
                px: 3,
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              {action.label}
            </Button>
          )}
        </Box>

        {/* 底部渐变遮罩 */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)',
            pointerEvents: 'none',
          }}
        />
      </Box>
    </Fade>
  );
}

/**
 * 分类标题组件
 */
interface CategoryHeaderProps {
  title: string;
  showAll?: () => void;
}

export function CategoryHeader({ title, showAll }: CategoryHeaderProps) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography variant="h6" fontWeight={600}>
        {title}
      </Typography>
      {showAll && (
        <Button onClick={showAll} color="primary" sx={{ textTransform: 'none' }}>
          查看全部 →
        </Button>
      )}
    </Box>
  );
}

/**
 * 横向滚动容器
 */
interface ScrollContainerProps {
  children: ReactNode;
}

export function ScrollContainer({ children }: ScrollContainerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        gap: 2,
        overflowX: 'auto',
        pb: 2,
        mx: -4,
        px: 4,
        scrollSnapType: 'x mandatory',
        '&::-webkit-scrollbar': {
          display: 'none',
        },
        scrollbarWidth: 'none',
      }}
    >
      {children}
    </Box>
  );
}
