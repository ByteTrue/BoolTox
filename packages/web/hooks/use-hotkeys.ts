/**
 * 全局快捷键 Hook
 * 支持快捷键注册、管理和冲突检测
 */

import { useEffect, useCallback, useRef } from 'react';

/**
 * 快捷键配置
 */
export interface HotkeyConfig {
  /** 快捷键组合（如 'mod+k', 'ctrl+shift+p'） */
  keys: string;
  /** 回调函数 */
  callback: (event: KeyboardEvent) => void;
  /** 描述（用于帮助面板） */
  description?: string;
  /** 是否启用（默认 true） */
  enabled?: boolean;
  /** 是否阻止默认行为（默认 true） */
  preventDefault?: boolean;
  /** 作用域（可选，用于分组）*/
  scope?: string;
}

/**
 * 解析快捷键字符串
 */
function parseHotkey(keys: string): {
  key: string;
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
} {
  const parts = keys.toLowerCase().split('+');
  const modifiers = {
    ctrl: parts.includes('ctrl'),
    shift: parts.includes('shift'),
    alt: parts.includes('alt'),
    meta: parts.includes('meta') || parts.includes('mod'), // mod = Cmd(Mac) / Ctrl(Win)
  };

  const key = parts[parts.length - 1];

  return { key, ...modifiers };
}

/**
 * 检查事件是否匹配快捷键
 */
function matchesHotkey(event: KeyboardEvent, config: ReturnType<typeof parseHotkey>): boolean {
  const eventKey = event.key.toLowerCase();

  // 检查修饰键
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const metaMatches = config.meta ? (isMac ? event.metaKey : event.ctrlKey) : true;
  const ctrlMatches = config.ctrl ? event.ctrlKey : !event.ctrlKey;
  const shiftMatches = config.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = config.alt ? event.altKey : !event.altKey;

  // 特殊处理 mod 键
  if (config.meta) {
    return eventKey === config.key && metaMatches && shiftMatches && altMatches;
  }

  return (
    eventKey === config.key &&
    ctrlMatches &&
    shiftMatches &&
    altMatches &&
    !event.metaKey // 确保 meta 键未按下（除非明确指定）
  );
}

/**
 * 全局快捷键 Hook
 */
export function useHotkeys(config: HotkeyConfig) {
  const { keys, callback, enabled = true, preventDefault = true } = config;
  const callbackRef = useRef(callback);

  // 保持 callback 引用最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const parsedHotkey = parseHotkey(keys);

    const handleKeyDown = (event: KeyboardEvent) => {
      // 忽略输入框中的快捷键
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // 特殊快捷键（如 Esc）即使在输入框中也生效
      const isSpecialKey = event.key === 'Escape';

      if (isInput && !isSpecialKey) return;

      if (matchesHotkey(event, parsedHotkey)) {
        if (preventDefault) {
          event.preventDefault();
        }
        callbackRef.current(event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keys, enabled, preventDefault]);
}

/**
 * 多快捷键 Hook
 */
export function useHotkeysMultiple(configs: HotkeyConfig[]) {
  configs.forEach((config) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useHotkeys(config);
  });
}

/**
 * 格式化快捷键显示（用于 UI）
 */
export function formatHotkey(keys: string): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');

  return keys
    .split('+')
    .map((key) => {
      switch (key.toLowerCase()) {
        case 'mod':
          return isMac ? '⌘' : 'Ctrl';
        case 'ctrl':
          return isMac ? '⌃' : 'Ctrl';
        case 'shift':
          return isMac ? '⇧' : 'Shift';
        case 'alt':
          return isMac ? '⌥' : 'Alt';
        case 'meta':
          return isMac ? '⌘' : 'Win';
        default:
          return key.toUpperCase();
      }
    })
    .join(isMac ? '' : '+');
}

