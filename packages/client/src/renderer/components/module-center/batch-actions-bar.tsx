/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';
import { Play, Square, Trash2, X } from 'lucide-react';

interface BatchActionsBarProps {
  selectedCount: number;
  onStartAll: () => void;
  onStopAll: () => void;
  onUninstallAll: () => void;
  onCancel: () => void;
  hasHttpService: boolean;
}

export function BatchActionsBar({
  selectedCount,
  onStartAll,
  onStopAll,
  onUninstallAll,
  onCancel,
  hasHttpService,
}: BatchActionsBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Fade in>
      <Paper
        elevation={8}
        sx={{
          position: 'sticky',
          bottom: 16,
          zIndex: 30,
          mx: 'auto',
          maxWidth: 672,
          p: 2,
          borderRadius: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.875rem' }}>
              {selectedCount}
            </Avatar>
            <Typography variant="body2" fontWeight={500}>
              已选中 {selectedCount} 个工具
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<Play size={14} />}
              onClick={onStartAll}
            >
              启动全部
            </Button>

            {hasHttpService && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={<Square size={14} />}
                onClick={onStopAll}
              >
                停止全部
              </Button>
            )}

            <Button
              variant="outlined"
              size="small"
              color="error"
              startIcon={<Trash2 size={14} />}
              onClick={onUninstallAll}
            >
              卸载全部
            </Button>

            <Button
              variant="outlined"
              size="small"
              startIcon={<X size={14} />}
              onClick={onCancel}
            >
              取消
            </Button>
          </Box>
        </Box>
      </Paper>
    </Fade>
  );
}
