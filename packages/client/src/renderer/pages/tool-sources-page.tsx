/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { Github, Folder, Trash2, ArrowLeft, AlertCircle } from 'lucide-react';
import type { ToolSourceConfig } from '@booltox/shared';

export function ToolSourcesPage() {
  const navigate = useNavigate();
  const [sources, setSources] = useState<ToolSourceConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const list = (await window.ipc.invoke('tool-sources:list')) as ToolSourceConfig[] | undefined;
      setSources(list || []);
    } catch (error) {
      console.error('Failed to load sources:', error);
      window.toast?.error('加载工具源失败');
      setSources([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sourceId: string, sourceName: string) => {
    if (sourceId === 'official') {
      window.toast?.error('官方工具源不能删除');
      return;
    }

    if (!confirm(`确定要删除工具源「${sourceName}」吗？\n\n来自该工具源的工具将被移除。`)) {
      return;
    }

    try {
      await window.ipc.invoke('tool-sources:delete', sourceId);
      window.toast?.success(`工具源「${sourceName}」已删除`);
      await loadSources();
    } catch (error) {
      console.error('Failed to delete source:', error);
      window.toast?.error(`删除失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 仅显示远程工具源，本地工具直接变为已安装状态，无需在此管理
  const remoteSources = sources.filter(s => s.type === 'remote');

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="elegant-scroll" sx={{ height: '100%', overflow: 'auto', px: 4, py: 3 }}>
      {/* 页面头部 */}
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate('/tools')} sx={{ borderRadius: 2 }}>
          <ArrowLeft size={24} />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          工具源管理
        </Typography>
      </Stack>

      {/* 工具源列表（仅显示远程源） */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          工具源 ({remoteSources.length})
        </Typography>
        <Stack spacing={2}>
          {remoteSources.length === 0 ? (
            <EmptyPlaceholder text="暂无工具源" />
          ) : (
            remoteSources.map(source => (
              <SourceCard
                key={source.id}
                source={source}
                onDelete={() => handleDelete(source.id, source.name)}
              />
            ))
          )}
        </Stack>
      </Box>

      {/* 底部操作 */}
      <Box>
        <Button variant="contained" size="large" onClick={() => navigate('/tools/add-source')}>
          + 添加工具源
        </Button>
      </Box>
    </Box>
  );
}

// 空状态占位
function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <Paper
      sx={{
        p: 3,
        textAlign: 'center',
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <Typography color="text.secondary">{text}</Typography>
    </Paper>
  );
}

// 工具源卡片组件
interface SourceCardProps {
  source: ToolSourceConfig;
  onDelete: () => void;
}

function SourceCard({ source, onDelete }: SourceCardProps) {
  const canDelete = source.id !== 'official';

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 3,
        transition: 'all 0.2s',
        '&:hover': {
          bgcolor: 'action.hover',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        {/* 左侧：图标 + 信息 */}
        <Stack direction="row" spacing={2} flex={1}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: source.type === 'remote' ? 'primary.50' : 'success.50',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {source.type === 'remote' ? (
              <Github size={32} color="var(--color-brand-blue-500)" />
            ) : (
              <Folder size={32} color="#34C759" />
            )}
          </Box>

          <Box flex={1} minWidth={0}>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h6" fontWeight={600}>
                {source.name}
              </Typography>
              <Chip
                label={source.enabled ? '已启用' : '已禁用'}
                color={source.enabled ? 'success' : 'default'}
                size="small"
              />
            </Stack>

            {/* 远程工具源信息 */}
            {source.type === 'remote' && (
              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  {source.provider === 'github' ? 'GitHub' : 'GitLab'}: {source.owner}/{source.repo}
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  分支: {source.branch}
                </Typography>
              </Stack>
            )}

            {/* 本地工具源信息 */}
            {source.type === 'local' && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {source.localPath}
              </Typography>
            )}

            {/* 统计信息 */}
            <Box sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.disabled">
                优先级: {source.priority}
              </Typography>
            </Box>
          </Box>
        </Stack>

        {/* 右侧：操作按钮 */}
        <Box>
          {!canDelete ? (
            <Chip label="不可删除" variant="outlined" size="small" />
          ) : (
            <IconButton onClick={onDelete} color="error" title="删除工具源">
              <Trash2 size={20} />
            </IconButton>
          )}
        </Box>
      </Stack>

      {/* 官方源警告 */}
      {!canDelete && (
        <Alert icon={<AlertCircle size={16} />} severity="info" sx={{ mt: 2 }}>
          官方工具源提供核心工具和安全保障，不能被删除或禁用
        </Alert>
      )}
    </Paper>
  );
}
