/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../components/theme-provider';
import { SettingsPanel } from '../components/settings-panel';
import { DeveloperSettings } from './settings/developer';

// 设置菜单项
const SETTINGS_SECTIONS = [
  { key: 'general', label: '通用设置', path: '/settings/general' },
  { key: 'shortcuts', label: '快捷键', path: '/settings/shortcuts' },
  { key: 'updates', label: '更新检查', path: '/settings/updates' },
  { key: 'data', label: '数据管理', path: '/settings/data' },
  { key: 'logs', label: '日志管理', path: '/settings/logs' },
  { key: 'developer', label: '开发者模式', path: '/settings/developer' },
  { key: 'about', label: '关于', path: '/settings/about' },
];

export function SettingsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // 当前激活的设置项
  const activeSection = SETTINGS_SECTIONS.find(
    section => section.path === location.pathname
  )?.key || 'general';

  return (
    <div className="flex h-full">
      {/* 左侧侧边栏 */}
      <aside
        className="w-56 border-r p-4 overflow-y-auto elegant-scroll"
        style={{
          borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          background: theme === 'dark'
            ? 'rgba(255, 255, 255, 0.02)'
            : 'rgba(255, 255, 255, 0.5)',
        }}
      >
        <nav className="space-y-1">
          {SETTINGS_SECTIONS.map((section) => {
            const isActive = activeSection === section.key;
            return (
              <button
                key={section.key}
                onClick={() => navigate(section.path)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? theme === 'dark'
                      ? 'bg-white/10 text-white'
                      : 'bg-gray-200 text-gray-900'
                    : theme === 'dark'
                      ? 'text-white/70 hover:bg-white/5 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {section.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* 右侧内容区 */}
      <div className="flex-1 overflow-y-auto elegant-scroll p-8">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Routes>
            <Route path="/developer" element={<DeveloperSettings />} />
            <Route path="/*" element={<SettingsPanel />} />
          </Routes>
        </motion.div>
      </div>
    </div>
  );
}
