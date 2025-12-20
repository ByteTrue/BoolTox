/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../theme-provider';
import { getGlassStyle } from '@/utils/glass-layers';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: ReactNode;
  placeholder?: string;
  minimal?: boolean; // 新增：是否使用极简样式
}

export function CustomSelect({
  value,
  options,
  onChange,
  icon,
  placeholder = '请选择',
  minimal = false,
}: CustomSelectProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 下拉菜单样式：降低透明度以提高可读性
  const dropdownStyle = {
    ...getGlassStyle('MODAL', theme),
    background: isDark
      ? 'rgba(15, 23, 42, 0.85)' // 深色模式：深色背景 + 较低透明度
      : 'rgba(255, 255, 255, 0.85)', // 浅色模式：白色背景 + 较低透明度
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    boxShadow: isDark
      ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      : '0 8px 32px 0 rgba(101, 187, 233, 0.37)',
  };

  return (
    <div ref={selectRef} className="relative">
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-lg transition-all duration-200 focus:outline-none ${
          minimal
            ? `px-2 py-1.5 hover:bg-black/5 dark:hover:bg-white/10 ${
                isDark ? 'text-white/80' : 'text-slate-700'
              }`
            : `border px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/50 ${
                isDark ? 'text-white hover:bg-white/10' : 'text-slate-800 hover:bg-white/80'
              }`
        }`}
        style={!minimal ? getGlassStyle('BUTTON', theme) : undefined}
      >
        {icon && <span className={isDark ? 'text-white/60' : 'text-slate-500'}>{icon}</span>}
        <span className={minimal ? 'text-sm' : ''}>{selectedOption?.label || placeholder}</span>
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''} ${
            isDark ? 'text-white/60' : 'text-slate-500'
          }`}
        />
      </button>

      {/* 下拉列表 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-[9999] mt-2 min-w-[160px] rounded-xl border"
            style={dropdownStyle}
          >
            <div className="max-h-[300px] overflow-y-auto p-1.5">
              {options.map(option => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-all duration-150 ${
                      isSelected
                        ? 'bg-blue-500/10 text-blue-500 font-medium'
                        : isDark
                          ? 'text-white/80 hover:bg-white/10'
                          : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{option.label}</span>
                    {isSelected && (
                      <Check size={14} className="animate-in fade-in zoom-in duration-200" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
