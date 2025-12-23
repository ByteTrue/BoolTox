/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import type { ModuleInstance } from '@/types/module';
import { useModulePlatform } from '@/contexts/module-context';

interface ModuleHostProps {
  module: ModuleInstance | null;
}

export function ModuleHost({ module }: ModuleHostProps) {
  const { openModule, focusModuleWindow } = useModulePlatform();

  if (!module) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          borderStyle: 'dashed',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          选择左侧模块开始使用。
        </Typography>
      </Paper>
    );
  }

  // New Architecture: Plugin (BrowserView)
  // New plugins run inside dedicated windows, we keep an informative panel here.
  if (module.id.startsWith('com.booltox.')) {
    const launchState = module.runtime.launchState ?? 'idle';
    const isRunning = launchState === 'running';
    const isLaunching = launchState === 'launching';
    const handleOpen = () => {
      if (isRunning) {
        void focusModuleWindow(module.id);
      } else {
        void openModule(module.id);
      }
    };

    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          minHeight: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
          borderRadius: 6,
          borderStyle: 'dashed',
          bgcolor: 'action.hover',
          px: 3,
          textAlign: 'center',
        }}
      >
        <Stack spacing={1}>
          <Typography variant="h6" fontWeight={700}>
            {module.definition.name} 在独立窗口中运行
          </Typography>
          <Typography variant="body2" color="text.secondary">
            点击下方按钮即可
            {isRunning ? '聚焦' : isLaunching ? '等待启动完成后重试' : '在新窗口启动'}工具。
          </Typography>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            onClick={handleOpen}
            disabled={isLaunching}
            variant="contained"
            color="primary"
            sx={{
              borderRadius: 8,
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {isLaunching ? '启动中…' : isRunning ? '聚焦工具窗口' : '打开工具窗口'}
          </Button>

          {isRunning && <Chip label="窗口已运行" color="success" size="small" />}
          {launchState === 'error' && <Chip label="启动失败，可重试" color="error" size="small" />}
        </Stack>
      </Paper>
    );
  }

  if (module.runtime.loading) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderRadius: 6,
          bgcolor: 'action.hover',
        }}
      >
        <CircularProgress />
        <Typography variant="body2" color="text.secondary">
          正在加载 {module.definition.name}
        </Typography>
      </Paper>
    );
  }

  if (module.runtime.error) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          borderRadius: 6,
          borderStyle: 'dashed',
          borderColor: 'error.main',
          bgcolor: 'error.light',
        }}
      >
        <Typography variant="body2" fontWeight={700} color="error.main">
          模块加载失败
        </Typography>
        <Typography variant="caption" color="error.dark" sx={{ opacity: 0.8 }}>
          {module.runtime.error}
        </Typography>
      </Paper>
    );
  }

  if (!module.runtime.component) {
    return (
      <Paper
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          borderStyle: 'dashed',
          bgcolor: 'action.hover',
        }}
      >
        <Typography variant="body2" color="text.secondary">
          模块入口未准备就绪。
        </Typography>
      </Paper>
    );
  }

  const Component = module.runtime.component;
  return (
    <Box sx={{ height: '100%', minHeight: 0, overflow: 'hidden', borderRadius: 6 }}>
      <Component />
    </Box>
  );
}
