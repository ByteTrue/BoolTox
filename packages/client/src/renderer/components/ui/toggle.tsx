/**
 * Apple 风格 Toggle 开关组件
 * 
 * 特性：
 * - 流畅的 Spring 动画
 * - 支持 Dark/Light 模式
 * - 键盘无障碍支持
 * - 触觉反馈模拟
 * 
 * @version 2.0.0
 */

import { motion } from 'framer-motion';
import { useTheme } from '../theme-provider';
import { toggleVariants } from '@/utils/micro-interactions';
import { SPRING, getSpring } from '@/config/animation.config';

export interface ToggleProps {
  /**
   * 是否选中
   */
  checked: boolean;
  /**
   * 状态变化回调
   */
  onChange: (checked: boolean) => void;
  /**
   * 是否禁用
   */
  disabled?: boolean;
  /**
   * 标签文本
   */
  label?: string;
  /**
   * 大小
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * 自定义类名
   */
  className?: string;
}

/**
 * Apple 风格 Toggle 开关
 * 
 * @example
 * ```tsx
 * <Toggle
 *   checked={enabled}
 *   onChange={setEnabled}
 *   label="启用功能"
 * />
 * ```
 */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  size = 'md',
  className = '',
}: ToggleProps) {
  const { theme } = useTheme();

  const sizeConfig = {
    sm: {
      track: 'w-9 h-5',
      thumb: 'w-4 h-4',
      translateX: 16,
    },
    md: {
      track: 'w-11 h-6',
      thumb: 'w-5 h-5',
      translateX: 20,
    },
    lg: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      translateX: 28,
    },
  };

  const config = sizeConfig[size];

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={`
          relative ${config.track} rounded-full cursor-pointer
          transition-opacity duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-400 focus-visible:ring-offset-2
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        {/* 背景轨道 */}
        <motion.div
          className={`absolute inset-0 rounded-full`}
          initial={false}
          animate={checked ? 'on' : 'off'}
          variants={{
            off: {
              backgroundColor: theme === 'dark' 
                ? 'rgba(120, 120, 128, 0.32)' 
                : 'rgba(120, 120, 128, 0.16)',
            },
            on: {
              backgroundColor: 'rgb(101, 187, 233)', // brand-blue-400
            },
          }}
          transition={{
            type: 'spring',
            ...getSpring(SPRING.swift),
            duration: 0.25,
          }}
        />

        {/* 滑动按钮 */}
        <motion.div
          className={`
            absolute top-0.5 left-0.5 ${config.thumb}
            bg-white rounded-full shadow-md
          `}
          initial={false}
          animate={checked ? 'on' : 'off'}
          variants={{
            off: {
              x: 0,
            },
            on: {
              x: config.translateX,
            },
          }}
          transition={{
            type: 'spring',
            ...getSpring(SPRING.bouncy),
            duration: 0.25,
          }}
        />
      </button>

      {label && (
        <span
          className={`text-sm font-medium select-none ${
            disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'cursor-pointer'
          } ${
            theme === 'dark' ? 'text-white' : 'text-slate-800'
          }`}
          onClick={handleToggle}
        >
          {label}
        </span>
      )}
    </div>
  );
}
