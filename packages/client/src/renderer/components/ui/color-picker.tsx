/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * 颜色选择器组件
 * 用于设置页的主题自定义
 */

import { useState } from 'react';
import { useTheme } from '../theme-provider';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { colord } from 'colord';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  presetColors?: Record<string, string>;
}

export function ColorPicker({ value, onChange, presetColors }: ColorPickerProps) {
  const { theme } = useTheme();
  const [customColor, setCustomColor] = useState(value);

  const defaultPresets = {
    '品牌蓝': '#65BBE9',
    '品牌粉': '#F9C1CF',
    '紫色': '#A78BFA',
    '绿色': '#10B981',
    '橙色': '#F59E0B',
    '红色': '#EF4444',
    '青色': '#06B6D4',
    '靛蓝': '#6366F1',
  };

  const colors = presetColors || defaultPresets;

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <div className="space-y-4">
      {/* 预设颜色 */}
      <div>
        <h4
          className={`text-sm font-medium mb-3 ${
            theme === 'dark' ? 'text-white/80' : 'text-gray-700'
          }`}
        >
          预设颜色
        </h4>
        <div className="grid grid-cols-4 gap-3">
          {Object.entries(colors).map(([name, color]) => {
            const isActive = value.toLowerCase() === color.toLowerCase();
            return (
              <motion.button
                key={color}
                onClick={() => onChange(color)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : theme === 'dark'
                      ? 'border-white/10 hover:border-white/20'
                      : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* 颜色圆形 */}
                <div
                  className="w-10 h-10 rounded-full shadow-md relative"
                  style={{ backgroundColor: color }}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Check className="w-6 h-6 text-white drop-shadow" />
                    </motion.div>
                  )}
                </div>

                {/* 颜色名称 */}
                <span
                  className={`text-xs ${
                    theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                  }`}
                >
                  {name}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 自定义颜色 */}
      <div>
        <h4
          className={`text-sm font-medium mb-3 ${
            theme === 'dark' ? 'text-white/80' : 'text-gray-700'
          }`}
        >
          自定义颜色
        </h4>
        <div className="flex items-center gap-3">
          {/* HTML5 颜色选择器 */}
          <input
            type="color"
            value={customColor}
            onChange={handleCustomColorChange}
            className="w-16 h-16 rounded-lg cursor-pointer border-2"
            style={{
              borderColor:
                theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
            }}
          />

          {/* 颜色值输入框 */}
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              const val = e.target.value;
              setCustomColor(val);
              // 验证是否为有效颜色
              if (/^#[0-9A-F]{6}$/i.test(val)) {
                onChange(val);
              }
            }}
            placeholder="#65BBE9"
            className={`flex-1 px-4 py-3 rounded-lg border font-mono text-sm ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40'
                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
            }`}
          />
        </div>
      </div>

      {/* 颜色预览 */}
      <div className="rounded-lg border p-4" style={{
        background: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        borderColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      }}>
        <p className={`text-xs mb-2 ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
          颜色预览
        </p>
        <div className="flex gap-2">
          <div
            className="flex-1 h-8 rounded"
            style={{ backgroundColor: value }}
            title="主色调"
          />
          <div
            className="flex-1 h-8 rounded"
            style={{ backgroundColor: colord(value).alpha(0.6).toHex() }}
            title="主色调 60%"
          />
          <div
            className="flex-1 h-8 rounded"
            style={{ backgroundColor: colord(value).alpha(0.3).toHex() }}
            title="主色调 30%"
          />
        </div>
      </div>
    </div>
  );
}
