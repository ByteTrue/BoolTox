/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Fade from '@mui/material/Fade';
import { alpha, useTheme } from '@mui/material/styles';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenshotCarouselProps {
  screenshots: string[];
  toolName: string;
}

export function ScreenshotCarousel({ screenshots, toolName }: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // 过滤有效截图
  const validScreenshots = screenshots.filter(s => s && s.trim());

  if (validScreenshots.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? validScreenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === validScreenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.primary',
          fontWeight: 600,
          mb: 1.5,
        }}
      >
        截图预览
      </Typography>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          // 16:9 比例，但限制最大高度
          aspectRatio: '16/9',
          maxHeight: 280,
          overflow: 'hidden',
          borderRadius: 2.5,
          border: '1px solid',
          borderColor: isDark ? alpha('#fff', 0.08) : alpha('#000', 0.08),
          bgcolor: isDark ? alpha('#fff', 0.03) : alpha('#000', 0.02),
        }}
      >
        <Fade in key={currentIndex}>
          <Box
            component="img"
            src={validScreenshots[currentIndex]}
            alt={`${toolName} - 截图 ${currentIndex + 1}`}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={e => {
              (e.target as HTMLImageElement).src =
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='450'%3E%3Crect fill='%2364748b' width='800' height='450'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' fill='white' font-size='20'%3E截图加载失败%3C/text%3E%3C/svg%3E";
            }}
          />
        </Fade>

        {validScreenshots.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                bgcolor: isDark ? alpha('#000', 0.6) : alpha('#fff', 0.9),
                color: isDark ? '#fff' : '#000',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: isDark ? alpha('#000', 0.8) : alpha('#fff', 1),
                },
              }}
              aria-label="上一张"
            >
              <ChevronLeft size={18} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 32,
                height: 32,
                bgcolor: isDark ? alpha('#000', 0.6) : alpha('#fff', 0.9),
                color: isDark ? '#fff' : '#000',
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: isDark ? alpha('#000', 0.8) : alpha('#fff', 1),
                },
              }}
              aria-label="下一张"
            >
              <ChevronRight size={18} />
            </IconButton>

            {/* 指示器 */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 0.5,
                p: 0.75,
                borderRadius: 2,
                bgcolor: isDark ? alpha('#000', 0.5) : alpha('#fff', 0.8),
                backdropFilter: 'blur(8px)',
              }}
            >
              {validScreenshots.map((_, index) => (
                <Box
                  key={index}
                  component="button"
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    width: index === currentIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    border: 'none',
                    bgcolor:
                      index === currentIndex
                        ? 'primary.main'
                        : isDark
                          ? alpha('#fff', 0.4)
                          : alpha('#000', 0.3),
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor:
                        index === currentIndex
                          ? 'primary.main'
                          : isDark
                            ? alpha('#fff', 0.6)
                            : alpha('#000', 0.5),
                    },
                  }}
                  aria-label={`跳转到截图 ${index + 1}`}
                />
              ))}
            </Box>

            {/* 计数器 */}
            <Chip
              label={`${currentIndex + 1} / ${validScreenshots.length}`}
              size="small"
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                height: 24,
                fontSize: '0.75rem',
                bgcolor: isDark ? alpha('#000', 0.6) : alpha('#fff', 0.9),
                color: isDark ? '#fff' : '#000',
                backdropFilter: 'blur(8px)',
                '& .MuiChip-label': { px: 1.25 },
              }}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
