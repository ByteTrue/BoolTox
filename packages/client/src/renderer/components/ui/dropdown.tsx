/**
 * Copyright (c) 2025 ByteTrue
 * Licensed under CC-BY-NC-4.0
 */

/**
 * Dropdown 下拉菜单组件
 *
 * Apple 风格的下拉菜单，支持：
 * - 向下滑入动画
 * - 玻璃态背景
 * - 键盘导航
 * - 分隔线
 * - 图标支持
 */

import { useState, useRef, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { dropdownVariants } from '../../utils/micro-interactions';
import { getGlassStyle, GLASS_BORDERS } from '../../utils/glass-layers';
import { getDropdownBlur } from '../../utils/blur-effects';
import { useTheme } from '../theme-provider';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  divider?: boolean; // 是否在下方显示分隔线
  danger?: boolean; // 危险操作（红色文本）
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  selected?: string; // 当前选中项 id
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({
  trigger,
  items,
  selected,
  align = 'left',
  className = '',
}: DropdownProps) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // 键盘导航
  useEffect(() => {
    if (!open) return;

    const enabledItems = items.filter(item => !item.disabled);

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          setOpen(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev + 1;
            return nextIndex >= enabledItems.length ? 0 : nextIndex;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            const prevIndex = prev - 1;
            return prevIndex < 0 ? enabledItems.length - 1 : prevIndex;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < enabledItems.length) {
            enabledItems[focusedIndex].onClick?.();
            setOpen(false);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, focusedIndex, items]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setOpen(false);
    setFocusedIndex(-1);
  };

  return (
    <div ref={dropdownRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={`absolute top-full mt-2 min-w-[200px] rounded-xl border overflow-hidden z-50 ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            style={{
              ...getGlassStyle('MODAL', theme),
              ...getDropdownBlur(theme),
            }}
          >
            <div className="py-1">
              {items.map((item, index) => (
                <div key={item.id}>
                  <button
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    onMouseEnter={() => setFocusedIndex(index)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                      item.disabled
                        ? theme === 'dark'
                          ? 'text-white/30 cursor-not-allowed'
                          : 'text-slate-300 cursor-not-allowed'
                        : item.danger
                          ? theme === 'dark'
                            ? 'text-brand-red-400 hover:bg-brand-red-500/10'
                            : 'text-brand-red-500 hover:bg-brand-red-50'
                          : theme === 'dark'
                            ? 'text-white hover:bg-white/10'
                            : 'text-slate-700 hover:bg-black/5'
                    } ${
                      focusedIndex === index && !item.disabled
                        ? theme === 'dark'
                          ? 'bg-white/10'
                          : 'bg-black/5'
                        : ''
                    }`}
                  >
                    {/* 图标 */}
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}

                    {/* 文本 */}
                    <span className="flex-1 text-left">{item.label}</span>

                    {/* 选中标记 */}
                    {selected === item.id && (
                      <Check size={16} className="flex-shrink-0 text-brand-blue-400" />
                    )}
                  </button>

                  {/* 分隔线 */}
                  {item.divider && (
                    <div
                      className="my-1 border-t"
                      style={{
                        borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Select 下拉选择器
 * 基于 Dropdown 的预设样式组件
 */
export interface SelectProps {
  value?: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = '请选择',
  disabled = false,
  className = '',
}: SelectProps) {
  const { theme } = useTheme();
  const selectedOption = options.find(opt => opt.value === value);

  const items: DropdownItem[] = options.map(opt => ({
    id: opt.value,
    label: opt.label,
    disabled: opt.disabled,
    onClick: () => onChange(opt.value),
  }));

  return (
    <Dropdown
      selected={value}
      items={items}
      className={className}
      trigger={
        <button
          disabled={disabled}
          className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border text-sm transition-all ${
            disabled
              ? theme === 'dark'
                ? 'bg-white/5 text-white/30 cursor-not-allowed'
                : 'bg-black/5 text-slate-300 cursor-not-allowed'
              : theme === 'dark'
                ? 'bg-white/5 text-white hover:bg-white/10'
                : 'bg-black/5 text-slate-700 hover:bg-black/10'
          }`}
          style={
            disabled
              ? undefined
              : {
                  ...getGlassStyle('BUTTON', theme),
                  borderColor: theme === 'dark' ? GLASS_BORDERS.DARK : GLASS_BORDERS.LIGHT,
                }
          }
        >
          <span>{selectedOption?.label || placeholder}</span>
          <ChevronDown
            size={16}
            className={`transition-transform ${
              theme === 'dark' ? 'text-white/60' : 'text-slate-400'
            }`}
          />
        </button>
      }
    />
  );
}
