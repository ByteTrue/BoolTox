/**
 * 响应式缩放工具单元测试
 * 覆盖 clamp() 生成、断点判断、预设配置
 */

import {
  getResponsiveClamp,
  getResponsiveFontSize,
  getResponsiveSpacing,
  getResponsiveLineHeight,
  getResponsiveTypography,
  getBreakpoint,
  isNarrowViewport,
  isWideViewport,
  fontScalePresets,
  spacingScalePresets,
} from '../responsive-scale';

describe('responsive-scale', () => {
  describe('getResponsiveClamp', () => {
    it('应生成正确的 clamp() 表达式', () => {
      const result = getResponsiveClamp({
        min: 14,
        max: 16,
        minVw: 320,
        maxVw: 1920,
        unit: 'px',
      });

      expect(result).toContain('clamp(');
      expect(result).toContain('14px');
      expect(result).toContain('16px');
      expect(result).toContain('vw');
    });

    it('应支持不同单位（rem）', () => {
      const result = getResponsiveClamp({
        min: 1,
        max: 1.5,
        minVw: 320,
        maxVw: 1920,
        unit: 'rem',
      });

      expect(result).toContain('rem');
      expect(result).not.toContain('px');
    });

    it('斜率计算应正确', () => {
      const result = getResponsiveClamp({
        min: 10,
        max: 20,
        minVw: 400,
        maxVw: 1600,
        unit: 'px',
      });

      // slope = (20-10)/(1600-400) = 10/1200 = 0.00833...
      // 转换为 vw: 0.00833 * 100 = 0.833vw
      expect(result).toContain('0.833vw');
    });
  });

  describe('fontScalePresets', () => {
    it('应包含所有预设字体规模', () => {
      const keys = Object.keys(fontScalePresets);
      expect(keys).toContain('xs');
      expect(keys).toContain('sm');
      expect(keys).toContain('base');
      expect(keys).toContain('md');
      expect(keys).toContain('lg');
      expect(keys).toContain('xl');
      expect(keys).toContain('2xl');
      expect(keys).toContain('3xl');
    });

    it('每个预设应有正确的结构', () => {
      const preset = fontScalePresets.base;
      expect(preset).toHaveProperty('min');
      expect(preset).toHaveProperty('max');
      expect(preset).toHaveProperty('minVw');
      expect(preset).toHaveProperty('maxVw');
      expect(preset).toHaveProperty('unit');
      expect(preset.min).toBeLessThan(preset.max);
    });
  });

  describe('spacingScalePresets', () => {
    it('应包含所有预设间距规模', () => {
      const keys = Object.keys(spacingScalePresets);
      expect(keys).toContain('xs');
      expect(keys).toContain('sm');
      expect(keys).toContain('base');
      expect(keys).toContain('md');
      expect(keys).toContain('lg');
      expect(keys).toContain('xl');
      expect(keys).toContain('2xl');
    });

    it('间距应递增', () => {
      expect(spacingScalePresets.xs.min).toBeLessThan(spacingScalePresets.sm.min);
      expect(spacingScalePresets.sm.min).toBeLessThan(spacingScalePresets.base.min);
      expect(spacingScalePresets.base.min).toBeLessThan(spacingScalePresets.md.min);
    });
  });

  describe('getResponsiveFontSize', () => {
    it('应返回包含 fontSize 的对象', () => {
      const result = getResponsiveFontSize('base');
      expect(result).toHaveProperty('fontSize');
      expect(result.fontSize).toContain('clamp(');
    });

    it('应支持自定义配置覆盖', () => {
      const result = getResponsiveFontSize('base', { min: 20, max: 30 });
      expect(result.fontSize).toContain('20px');
      expect(result.fontSize).toContain('30px');
    });
  });

  describe('getResponsiveSpacing', () => {
    it('应返回正确的 padding 属性', () => {
      const result = getResponsiveSpacing('md', 'padding');
      expect(result).toHaveProperty('padding');
      expect(result.padding).toContain('clamp(');
    });

    it('应返回正确的 margin 属性', () => {
      const result = getResponsiveSpacing('sm', 'margin');
      expect(result).toHaveProperty('margin');
      expect(result.margin).toContain('clamp(');
    });

    it('应返回正确的 gap 属性', () => {
      const result = getResponsiveSpacing('lg', 'gap');
      expect(result).toHaveProperty('gap');
      expect(result.gap).toContain('clamp(');
    });
  });

  describe('getResponsiveLineHeight', () => {
    it('应返回包含 lineHeight 的对象', () => {
      const result = getResponsiveLineHeight('base');
      expect(result).toHaveProperty('lineHeight');
      expect(result.lineHeight).toContain('clamp(');
    });

    it('应应用正确的倍数', () => {
      const preset = fontScalePresets.base;
      const multiplier = 1.5;
      const result = getResponsiveLineHeight('base', multiplier);
      
      // 行高应为字号的 1.5 倍
      expect(result.lineHeight).toContain(`${preset.min * multiplier}px`);
      expect(result.lineHeight).toContain(`${preset.max * multiplier}px`);
    });
  });

  describe('getResponsiveTypography', () => {
    it('应同时返回 fontSize 和 lineHeight', () => {
      const result = getResponsiveTypography('base');
      expect(result).toHaveProperty('fontSize');
      expect(result).toHaveProperty('lineHeight');
    });

    it('应支持自定义行高倍数', () => {
      const result = getResponsiveTypography('base', 2.0);
      expect(result.lineHeight).toBeDefined();
    });
  });

  describe('断点判断（需要模拟 window）', () => {
    let originalWindow: Window & typeof globalThis;

    beforeEach(() => {
      originalWindow = global.window;
    });

    afterEach(() => {
      global.window = originalWindow;
    });

    it('getBreakpoint 应返回正确的断点（xs）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 500 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('xs');
    });

    it('getBreakpoint 应返回正确的断点（sm）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 700 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('sm');
    });

    it('getBreakpoint 应返回正确的断点（md）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 900 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('md');
    });

    it('getBreakpoint 应返回正确的断点（lg）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1100 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('lg');
    });

    it('getBreakpoint 应返回正确的断点（xl）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1400 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('xl');
    });

    it('getBreakpoint 应返回正确的断点（2xl）', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1920 },
        writable: true,
      });
      expect(getBreakpoint()).toBe('2xl');
    });

    it('isNarrowViewport 应正确判断窄视口', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 600 },
        writable: true,
      });
      expect(isNarrowViewport()).toBe(true);

      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1000 },
        writable: true,
      });
      expect(isNarrowViewport()).toBe(false);
    });

    it('isWideViewport 应正确判断宽视口', () => {
      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1400 },
        writable: true,
      });
      expect(isWideViewport()).toBe(true);

      Object.defineProperty(global, 'window', {
        value: { innerWidth: 1000 },
        writable: true,
      });
      expect(isWideViewport()).toBe(false);
    });

    it('在无 window 环境应返回默认值', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true,
      });
      expect(getBreakpoint()).toBe('lg');
      expect(isNarrowViewport()).toBe(false);
      expect(isWideViewport()).toBe(true);
    });
  });
});
