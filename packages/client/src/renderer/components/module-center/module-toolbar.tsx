/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import { Search, SlidersHorizontal, ArrowUpDown, X, Plus, CheckSquare } from 'lucide-react';
import { CustomSelect } from './custom-select';
import type { SortBy } from './types';

interface ModuleToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortBy;
  onSortChange: (sort: SortBy) => void;
  categories: string[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onAddLocalTool?: () => void;
  isSelectionMode?: boolean;
  onToggleSelectionMode?: () => void;
}

export function ModuleToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  categories,
  selectedCategory,
  onCategoryChange,
  onAddLocalTool,
  isSelectionMode = false,
  onToggleSelectionMode,
}: ModuleToolbarProps) {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        {/* 搜索框 */}
        <TextField
          placeholder="搜索工具..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          size="small"
          sx={{ flex: 1, maxWidth: { md: 400 } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => onSearchChange('')}>
                  <X size={14} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {/* 右侧控制按钮 */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {onToggleSelectionMode && (
            <Button
              variant={isSelectionMode ? 'contained' : 'outlined'}
              size="small"
              startIcon={<CheckSquare size={16} />}
              onClick={onToggleSelectionMode}
            >
              {isSelectionMode ? '取消选择' : '选择'}
            </Button>
          )}

          {onAddLocalTool && !isSelectionMode && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Plus size={16} />}
              onClick={onAddLocalTool}
            >
              添加本地工具
            </Button>
          )}

          <CustomSelect
            value={selectedCategory}
            onChange={onCategoryChange}
            options={[
              { value: 'all', label: '全部分类' },
              ...categories.map(cat => ({ value: cat, label: cat || '未分类' })),
            ]}
            icon={<SlidersHorizontal size={16} />}
          />

          <CustomSelect
            value={sortBy}
            onChange={val => onSortChange(val as SortBy)}
            options={[
              { value: 'default', label: '默认排序' },
              { value: 'name', label: '按名称' },
              { value: 'updatedAt', label: '按更新时间' },
            ]}
            icon={<ArrowUpDown size={16} />}
          />
        </Box>
      </Box>
    </Paper>
  );
}
