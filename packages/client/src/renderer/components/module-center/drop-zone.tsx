/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Upload, FolderOpen, FileArchive } from 'lucide-react';

interface DropZoneProps {
  onDrop: (files: FileList) => void;
  onBrowse: () => void;
}

export function DropZone({ onDrop, onBrowse }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onDrop(e.dataTransfer.files);
      }
    },
    [onDrop]
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 6,
        borderRadius: 3,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: isDragging ? 'primary.main' : 'divider',
        bgcolor: isDragging ? 'action.hover' : 'transparent',
        transition: 'all 0.2s',
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textAlign: 'center' }}>
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: isDragging ? 'primary.main' : 'action.selected',
            opacity: isDragging ? 0.2 : 1,
            transition: 'all 0.2s',
          }}
        >
          <Upload
            size={48}
            style={{
              color: isDragging ? 'var(--mui-palette-primary-main)' : 'var(--mui-palette-text-secondary)',
            }}
          />
        </Box>

        <Box>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>
            {isDragging ? '松开鼠标添加工具' : '拖拽工具到这里'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            支持工具文件夹或 .zip 压缩包
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FolderOpen size={16} />
            <Typography variant="caption" color="text.secondary">文件夹</Typography>
          </Box>
          <Typography variant="caption" color="text.disabled">或</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <FileArchive size={16} />
            <Typography variant="caption" color="text.secondary">ZIP 文件</Typography>
          </Box>
        </Box>

        <Button variant="outlined" onClick={onBrowse} sx={{ mt: 1 }}>
          或点击选择文件
        </Button>
      </Box>
    </Paper>
  );
}
