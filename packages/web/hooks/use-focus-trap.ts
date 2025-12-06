/**
 * 焦点陷阱 Hook
 * 用于模态框、抽屉菜单等需要限制焦点范围的场景
 * 符合 WCAG 2.2 可访问性标准
 */

import { useEffect, useRef } from 'react';

/**
 * 焦点陷阱配置
 */
interface FocusTrapOptions {
  /** 是否激活焦点陷阱 */
  isActive: boolean;
  /** 初始焦点元素选择器（可选） */
  initialFocus?: string;
  /** 返回焦点元素选择器（可选） */
  returnFocus?: boolean;
}

/**
 * 使用焦点陷阱
 * @returns containerRef - 需要绑定到容器的 ref
 */
export function useFocusTrap(options: FocusTrapOptions) {
  const { isActive, initialFocus, returnFocus = true } = options;
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // 保存之前的焦点元素
    if (returnFocus) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    // 获取所有可聚焦元素
    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ');

      return Array.from(container.querySelectorAll<HTMLElement>(selectors));
    };

    // 设置初始焦点
    const setInitialFocus = () => {
      if (initialFocus) {
        const element = container.querySelector<HTMLElement>(initialFocus);
        if (element) {
          element.focus();
          return;
        }
      }

      // 默认聚焦第一个可聚焦元素
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    };

    // 延迟设置焦点，确保 DOM 已渲染
    const timeoutId = setTimeout(setInitialFocus, 50);

    // 处理 Tab 键循环
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      if (event.shiftKey) {
        // Shift + Tab（向后）
        if (activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab（向前）
        if (activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    // 绑定事件
    container.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      clearTimeout(timeoutId);
      container.removeEventListener('keydown', handleKeyDown);

      // 恢复之前的焦点
      if (returnFocus && previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, [isActive, initialFocus, returnFocus]);

  return containerRef;
}

/**
 * 简化版焦点陷阱（仅返回 ref）
 */
export function useFocusTrapRef(isActive: boolean) {
  return useFocusTrap({ isActive });
}
