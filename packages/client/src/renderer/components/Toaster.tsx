/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

'use client';

import { useToast } from '@/contexts/toast-context';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide, { SlideProps } from '@mui/material/Slide';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

export function Toaster() {
  const { toasts, removeToast } = useToast();

  // 只显示最新的一条 toast
  const currentToast = toasts[0];

  if (!currentToast) return null;

  return (
    <Snackbar
      open={!!currentToast}
      autoHideDuration={3000}
      onClose={() => removeToast(currentToast.id)}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      TransitionComponent={SlideTransition}
    >
      <Alert
        onClose={() => removeToast(currentToast.id)}
        severity={currentToast.type || 'info'}
        variant="filled"
        sx={{ minWidth: 280 }}
      >
        {currentToast.message}
      </Alert>
    </Snackbar>
  );
}
