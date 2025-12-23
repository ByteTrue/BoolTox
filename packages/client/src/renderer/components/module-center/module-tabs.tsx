/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Badge from '@mui/material/Badge';
import { Package, ShoppingBag } from 'lucide-react';
import type { ModuleTab } from './types';

interface ModuleTabsProps {
  activeTab: ModuleTab;
  onTabChange: (tab: ModuleTab) => void;
  counts: {
    installed: number;
    store: number;
  };
}

export function ModuleTabs({ activeTab, onTabChange, counts }: ModuleTabsProps) {
  const tabs: Array<{ id: ModuleTab; label: string; icon: typeof Package; count: number }> = [
    { id: 'installed', label: '已安装工具', icon: Package, count: counts.installed },
    { id: 'store', label: '工具商店', icon: ShoppingBag, count: counts.store },
  ];

  return (
    <Paper sx={{ borderRadius: 2 }}>
      <Tabs
        value={activeTab}
        onChange={(_, value) => onTabChange(value as ModuleTab)}
        variant="fullWidth"
        sx={{ minHeight: 48 }}
      >
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <Tab
              key={tab.id}
              value={tab.id}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  <Badge
                    badgeContent={tab.count}
                    color={activeTab === tab.id ? 'primary' : 'default'}
                    sx={{ ml: 1 }}
                  />
                </Box>
              }
              sx={{ minHeight: 48, textTransform: 'none' }}
            />
          );
        })}
      </Tabs>
    </Paper>
  );
}
