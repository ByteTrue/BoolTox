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
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScreenshotCarouselProps {
  screenshots: string[];
  toolName: string;
}

export function ScreenshotCarousel({ screenshots, toolName }: ScreenshotCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex(prev => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 1.5 }}>
        工具截图
      </Typography>
      <Box
        sx={{
          position: 'relative',
          aspectRatio: '16/9',
          overflow: 'hidden',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'action.hover',
        }}
      >
        <Fade in key={currentIndex}>
          <Box
            component="img"
            src={screenshots[currentIndex]}
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

        {screenshots.length > 1 && (
          <>
            <IconButton
              onClick={handlePrev}
              sx={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              aria-label="上一张"
            >
              <ChevronLeft size={20} />
            </IconButton>
            <IconButton
              onClick={handleNext}
              sx={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                bgcolor: 'background.paper',
                '&:hover': { bgcolor: 'action.hover' },
              }}
              aria-label="下一张"
            >
              <ChevronRight size={20} />
            </IconButton>

            {/* 指示器 */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: 0.75,
              }}
            >
              {screenshots.map((_, index) => (
                <Box
                  key={index}
                  component="button"
                  onClick={() => setCurrentIndex(index)}
                  sx={{
                    width: index === currentIndex ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    border: 'none',
                    bgcolor: index === currentIndex ? 'primary.main' : 'action.disabled',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: index === currentIndex ? 'primary.main' : 'action.selected',
                    },
                  }}
                  aria-label={`跳转到截图 ${index + 1}`}
                />
              ))}
            </Box>

            {/* 计数器 */}
            <Chip
              label={`${currentIndex + 1} / ${screenshots.length}`}
              size="small"
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
              }}
            />
          </>
        )}
      </Box>
    </Box>
  );
}
