/**
 * 可访问性工具函数
 * 提供 ARIA 属性生成、键盘导航、焦点管理、屏幕阅读器支持
 * 遵循 WAI-ARIA 1.2 规范和 WCAG 2.1 AA 标准
 */

import { useEffect, useRef, useCallback } from 'react';

// ============================================
// 1. ARIA 属性生成
// ============================================

export type AriaRole =
  | 'dialog'
  | 'alertdialog'
  | 'navigation'
  | 'menu'
  | 'menubar'
  | 'menuitem'
  | 'button'
  | 'tab'
  | 'tabpanel'
  | 'listbox'
  | 'option'
  | 'combobox'
  | 'tooltip'
  | 'alert'
  | 'status'
  | 'progressbar'
  | 'region';

/**
 * 生成对话框/模态框的 ARIA 属性
 */
export function getDialogAriaProps(options: {
  id: string;
  titleId?: string;
  descriptionId?: string;
  modal?: boolean;
  label?: string;
}): Record<string, string | boolean> {
  const { id, titleId, descriptionId, modal = true, label } = options;
  return {
    role: 'dialog',
    'aria-modal': modal,
    id,
    ...(titleId && { 'aria-labelledby': titleId }),
    ...(descriptionId && { 'aria-describedby': descriptionId }),
    ...(label && !titleId && { 'aria-label': label }),
  };
}

/**
 * 生成菜单/下拉菜单的 ARIA 属性
 */
export function getMenuAriaProps(options: {
  id: string;
  labelledBy?: string;
  expanded?: boolean;
  orientation?: 'vertical' | 'horizontal';
}): Record<string, string | boolean> {
  const { id, labelledBy, expanded, orientation = 'vertical' } = options;
  return {
    role: 'menu',
    id,
    ...(labelledBy && { 'aria-labelledby': labelledBy }),
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    'aria-orientation': orientation,
  };
}

/**
 * 生成选项卡的 ARIA 属性
 */
export function getTabAriaProps(options: {
  id: string;
  selected: boolean;
  controls: string;
  disabled?: boolean;
}): Record<string, string | boolean | number> {
  const { id, selected, controls, disabled = false } = options;
  return {
    role: 'tab',
    id,
    'aria-selected': selected,
    'aria-controls': controls,
    'aria-disabled': disabled,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * 生成选项卡面板的 ARIA 属性
 */
export function getTabPanelAriaProps(options: {
  id: string;
  labelledBy: string;
  hidden?: boolean;
}): Record<string, string | boolean | number> {
  const { id, labelledBy, hidden = false } = options;
  return {
    role: 'tabpanel',
    id,
    'aria-labelledby': labelledBy,
    'aria-hidden': hidden,
    tabIndex: 0,
  };
}

/**
 * 生成进度条的 ARIA 属性
 */
export function getProgressAriaProps(options: {
  value?: number;
  min?: number;
  max?: number;
  label?: string;
  indeterminate?: boolean;
}): Record<string, string | number | undefined> {
  const { value, min = 0, max = 100, label, indeterminate = false } = options;
  return {
    role: 'progressbar',
    ...(label && { 'aria-label': label }),
    ...(indeterminate
      ? { 'aria-valuemin': undefined, 'aria-valuemax': undefined, 'aria-valuenow': undefined }
      : { 'aria-valuemin': min, 'aria-valuemax': max, 'aria-valuenow': value }),
  };
}

/**
 * 生成实时区域的 ARIA 属性
 */
export function getLiveRegionAriaProps(options: {
  politeness?: 'assertive' | 'polite' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}): Record<string, string | boolean> {
  const { politeness = 'polite', atomic = false, relevant = 'additions text' } = options;
  return {
    'aria-live': politeness,
    'aria-atomic': atomic,
    'aria-relevant': relevant,
  };
}

// ============================================
// 2. 焦点管理
// ============================================

/**
 * 焦点陷阱 Hook（用于模态框/抽屉）
 * 防止焦点离开容器
 */
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [enabled]);

  return containerRef;
}

/**
 * 焦点恢复 Hook
 * 保存当前焦点元素，组件卸载时恢复
 */
export function useFocusRestore() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;

    return () => {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    };
  }, []);
}

/**
 * 自动焦点 Hook
 * 组件挂载时自动聚焦
 */
export function useAutoFocus<T extends HTMLElement>(enabled: boolean = true) {
  const elementRef = useRef<T>(null);

  useEffect(() => {
    if (enabled && elementRef.current) {
      elementRef.current.focus();
    }
  }, [enabled]);

  return elementRef;
}

/**
 * 获取容器内所有可聚焦元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

/**
 * 将焦点移动到第一个可聚焦元素
 */
export function focusFirstElement(container: HTMLElement): boolean {
  const elements = getFocusableElements(container);
  if (elements.length > 0) {
    elements[0].focus();
    return true;
  }
  return false;
}

// ============================================
// 3. 键盘导航
// ============================================

export type KeyboardHandler = (event: KeyboardEvent) => void;

/**
 * 键盘快捷键映射
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

/**
 * 键盘导航 Hook
 * 处理常见的键盘交互模式
 */
export function useKeyboardNavigation(options: {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  enabled?: boolean;
}) {
  const { onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case KeyboardKeys.ESCAPE:
          onEscape?.();
          break;
        case KeyboardKeys.ENTER:
          onEnter?.();
          break;
        case KeyboardKeys.ARROW_UP:
          event.preventDefault();
          onArrowUp?.();
          break;
        case KeyboardKeys.ARROW_DOWN:
          event.preventDefault();
          onArrowDown?.();
          break;
        case KeyboardKeys.ARROW_LEFT:
          onArrowLeft?.();
          break;
        case KeyboardKeys.ARROW_RIGHT:
          onArrowRight?.();
          break;
      }
    },
    [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * 列表键盘导航 Hook（上下箭头 + Home/End）
 */
export function useListKeyboardNavigation(options: {
  itemCount: number;
  currentIndex: number;
  onIndexChange: (index: number) => void;
  loop?: boolean;
  enabled?: boolean;
}) {
  const { itemCount, currentIndex, onIndexChange, loop = true, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || itemCount === 0) return;

      switch (event.key) {
        case KeyboardKeys.ARROW_UP:
          event.preventDefault();
          if (currentIndex > 0) {
            onIndexChange(currentIndex - 1);
          } else if (loop) {
            onIndexChange(itemCount - 1);
          }
          break;
        case KeyboardKeys.ARROW_DOWN:
          event.preventDefault();
          if (currentIndex < itemCount - 1) {
            onIndexChange(currentIndex + 1);
          } else if (loop) {
            onIndexChange(0);
          }
          break;
        case KeyboardKeys.HOME:
          event.preventDefault();
          onIndexChange(0);
          break;
        case KeyboardKeys.END:
          event.preventDefault();
          onIndexChange(itemCount - 1);
          break;
      }
    },
    [itemCount, currentIndex, onIndexChange, loop, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

// ============================================
// 4. 屏幕阅读器支持
// ============================================

/**
 * 屏幕阅读器公告 Hook
 * 使用 ARIA live region 向屏幕阅读器发送消息
 */
export function useScreenReaderAnnounce() {
  const liveRegionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // 创建全局 live region（如果不存在）
    if (!document.getElementById('sr-announcer')) {
      const liveRegion = document.createElement('div');
      liveRegion.id = 'sr-announcer';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText =
        'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
      document.body.appendChild(liveRegion);
      liveRegionRef.current = liveRegion;
    } else {
      liveRegionRef.current = document.getElementById('sr-announcer') as HTMLDivElement;
    }
  }, []);

  const announce = useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    if (!liveRegionRef.current) return;

    liveRegionRef.current.setAttribute('aria-live', politeness);
    // 清空再设置，确保屏幕阅读器读取
    liveRegionRef.current.textContent = '';
    setTimeout(() => {
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = message;
      }
    }, 100);
  }, []);

  return announce;
}

/**
 * 生成屏幕阅读器专用文本（视觉隐藏）
 */
export function getScreenReaderOnlyStyle(): React.CSSProperties {
  return {
    position: 'absolute',
    left: '-10000px',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
  };
}

/**
 * 屏幕阅读器专用类名
 */
export const SR_ONLY_CLASS = 'sr-only';

// ============================================
// 5. 跳过导航链接
// ============================================

/**
 * 生成跳过导航链接的属性
 */
export function getSkipLinkProps(targetId: string): Record<string, string> {
  return {
    href: `#${targetId}`,
    className: 'skip-link',
  };
}

// ============================================
// 6. 表单可访问性
// ============================================

/**
 * 生成表单字段的 ARIA 属性
 */
export function getFormFieldAriaProps(options: {
  id: string;
  labelId?: string;
  errorId?: string;
  descriptionId?: string;
  required?: boolean;
  invalid?: boolean;
  disabled?: boolean;
}): Record<string, string | boolean | undefined> {
  const { id, labelId, errorId, descriptionId, required, invalid, disabled } = options;

  const describedByParts = [descriptionId, errorId].filter(Boolean);

  return {
    id,
    ...(labelId && { 'aria-labelledby': labelId }),
    ...(describedByParts.length > 0 && { 'aria-describedby': describedByParts.join(' ') }),
    ...(required !== undefined && { 'aria-required': required }),
    ...(invalid !== undefined && { 'aria-invalid': invalid }),
    ...(disabled !== undefined && { 'aria-disabled': disabled }),
  };
}

// ============================================
// 7. 工具函数
// ============================================

/**
 * 检测是否在使用键盘导航
 */
export function isKeyboardNavigation(): boolean {
  return document.body.classList.contains('keyboard-navigation');
}

/**
 * 启用键盘导航模式（显示焦点环）
 */
export function enableKeyboardNavigationMode(): void {
  document.body.classList.add('keyboard-navigation');
}

/**
 * 禁用键盘导航模式（隐藏焦点环）
 */
export function disableKeyboardNavigationMode(): void {
  document.body.classList.remove('keyboard-navigation');
}

/**
 * 初始化键盘导航检测
 * 根据用户输入方式自动切换键盘导航模式
 */
export function initKeyboardNavigationDetection(): () => void {
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Tab') {
      enableKeyboardNavigationMode();
    }
  }

  function handleMouseDown() {
    disableKeyboardNavigationMode();
  }

  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('mousedown', handleMouseDown);

  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('mousedown', handleMouseDown);
  };
}

/**
 * 生成唯一 ID（用于 ARIA 关联）
 */
let idCounter = 0;
export function generateUniqueId(prefix: string = 'a11y'): string {
  return `${prefix}-${++idCounter}-${Date.now()}`;
}
