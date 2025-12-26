/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { Package, CheckCircle, PauseCircle } from 'lucide-react';
import type { ModuleStatsData } from './types';

interface ModuleStatsProps {
  stats: ModuleStatsData;
}

export function ModuleStats({ stats }: ModuleStatsProps) {
  const statsCards = [
    {
      label: '工具总数',
      value: stats.total,
      icon: Package,
      color: 'primary.main',
      bgColor: 'primary.main',
    },
    {
      label: '正在使用',
      value: stats.enabled,
      icon: CheckCircle,
      color: 'success.main',
      bgColor: 'success.main',
    },
    {
      label: '已停用',
      value: stats.disabled,
      icon: PauseCircle,
      color: 'warning.main',
      bgColor: 'warning.main',
    },
  ];

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
      }}
    >
      {statsCards.map(card => {
        const Icon = card.icon;
        return (
          <Paper
            key={card.label}
            sx={{
              p: 2,
              borderRadius: 2,
              transition: 'transform 0.2s, box-shadow 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: 3,
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  {card.label}
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>
                  {card.value}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: card.bgColor,
                  opacity: 0.1,
                }}
              >
                <Icon size={24} />
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
