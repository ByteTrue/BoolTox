/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Fade from '@mui/material/Fade';

/**
 * 懒加载 Fallback 组件
 */
export function GlassLoadingFallback() {
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
        }}
      >
        <Paper
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            p: 6,
            borderRadius: 3,
          }}
        >
          <Box sx={{ position: 'relative', width: 64, height: 64 }}>
            <CircularProgress
              size={64}
              thickness={3}
              sx={{
                color: 'primary.main',
              }}
            />
          </Box>

          <Typography variant="body2" color="text.secondary">
            加载中...
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );
}
