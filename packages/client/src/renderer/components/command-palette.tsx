/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import Fade from '@mui/material/Fade';
import { Search, Settings, Download, Clock, Command } from 'lucide-react';
import Fuse from 'fuse.js';
import { useCommandPalette } from '@/contexts/command-palette-context';
import { useModulePlatform } from '@/contexts/module-context';
import { formatDistanceToNow } from '@/utils/date';

interface CommandItem {
  id: string;
  type: 'tool' | 'action';
  label: string;
  description?: string;
  icon?: string;
  lastUsed?: number;
  onSelect: () => void;
}

export function CommandPalette() {
  const { isOpen, close } = useCommandPalette();
  const { installedModules, openModule } = useModulePlatform();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 构建命令列表
  const commands = useMemo<CommandItem[]>(() => {
    const toolCommands: CommandItem[] = installedModules.map(tool => ({
      id: tool.id,
      type: 'tool' as const,
      label: tool.definition.name,
      description: tool.definition.description,
      icon: tool.definition.icon,
      lastUsed: tool.runtime?.lastLaunchedAt,
      onSelect: () => {
        openModule(tool.id);
        close();
      },
    }));

    const actionCommands: CommandItem[] = [
      {
        id: 'settings',
        type: 'action' as const,
        label: '设置',
        description: '打开应用设置',
        onSelect: () => {
          // TODO: 导航到设置页面
          close();
        },
      },
    ];

    return [...toolCommands, ...actionCommands];
  }, [installedModules, openModule, close]);

  // 模糊搜索
  const fuse = useMemo(
    () =>
      new Fuse(commands, {
        keys: ['label', 'description'],
        threshold: 0.3,
        includeScore: true,
      }),
    [commands]
  );

  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // 无搜索词时，按上次使用时间排序
      return [...commands].sort((a, b) => {
        const aTime = a.lastUsed || 0;
        const bTime = b.lastUsed || 0;
        return bTime - aTime;
      });
    }
    return fuse.search(query).map(result => result.item);
  }, [query, commands, fuse]);

  // 键盘导航
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        e.preventDefault();
        filteredCommands[selectedIndex].onSelect();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [filteredCommands, selectedIndex, close]
  );

  // 自动聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onClose={close}
      maxWidth="sm"
      fullWidth
      TransitionComponent={Fade}
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20vh',
          m: 0,
          borderRadius: 3,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
      slotProps={{
        backdrop: {
          sx: { bgcolor: 'rgba(0, 0, 0, 0.5)' },
        },
      }}
    >
      {/* 搜索框 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Search size={20} style={{ opacity: 0.5 }} />
        <InputBase
          inputRef={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="搜索工具或输入命令..."
          fullWidth
          sx={{ fontSize: '1rem' }}
        />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.disabled' }}>
          <Command size={12} />
          <Typography variant="caption">K</Typography>
        </Box>
      </Box>

      {/* 结果列表 */}
      <Box sx={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {filteredCommands.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              未找到匹配的工具
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 1 }}>
            {filteredCommands.map((command, index) => (
              <Box
                key={command.id}
                component="button"
                onClick={command.onSelect}
                onMouseEnter={() => setSelectedIndex(index)}
                sx={{
                  display: 'flex',
                  width: '100%',
                  alignItems: 'center',
                  gap: 1.5,
                  px: 2,
                  py: 1.25,
                  textAlign: 'left',
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: index === selectedIndex ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' },
                  transition: 'background-color 0.1s',
                }}
              >
                {/* 图标 */}
                <Box
                  sx={{
                    display: 'flex',
                    width: 40,
                    height: 40,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 2,
                    bgcolor: 'action.hover',
                  }}
                >
                  {command.type === 'tool' ? (
                    <Typography variant="h6">{command.icon || '🔧'}</Typography>
                  ) : command.id === 'settings' ? (
                    <Settings size={20} style={{ opacity: 0.6 }} />
                  ) : (
                    <Download size={20} style={{ opacity: 0.6 }} />
                  )}
                </Box>

                {/* 信息 */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {command.label}
                    </Typography>
                    {command.type === 'tool' && (
                      <Typography
                        variant="caption"
                        sx={{
                          px: 0.75,
                          py: 0.25,
                          borderRadius: 0.5,
                          bgcolor: 'action.hover',
                          color: 'text.secondary',
                        }}
                      >
                        工具
                      </Typography>
                    )}
                  </Box>
                  {command.description && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {command.description}
                    </Typography>
                  )}
                  {command.lastUsed && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Clock size={12} style={{ opacity: 0.5 }} />
                      <Typography variant="caption" color="text.disabled">
                        上次使用: {formatDistanceToNow(command.lastUsed)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* 快捷键提示 */}
                {index === selectedIndex && (
                  <Typography
                    variant="caption"
                    sx={{
                      px: 0.75,
                      py: 0.25,
                      borderRadius: 0.5,
                      border: 1,
                      borderColor: 'divider',
                      color: 'text.disabled',
                    }}
                  >
                    Enter
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* 底部提示 */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          px: 2,
          py: 1,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ px: 0.5, border: 1, borderColor: 'divider', borderRadius: 0.5 }}
          >
            ↑↓
          </Typography>
          <Typography variant="caption" color="text.disabled">
            导航
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ px: 0.5, border: 1, borderColor: 'divider', borderRadius: 0.5 }}
          >
            Enter
          </Typography>
          <Typography variant="caption" color="text.disabled">
            选择
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{ px: 0.5, border: 1, borderColor: 'divider', borderRadius: 0.5 }}
          >
            Esc
          </Typography>
          <Typography variant="caption" color="text.disabled">
            关闭
          </Typography>
        </Box>
      </Box>
    </Dialog>
  );
}
