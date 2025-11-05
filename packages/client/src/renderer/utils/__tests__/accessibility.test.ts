/**
 * 可访问性工具函数单元测试
 * 覆盖 ARIA 属性生成、焦点管理、键盘导航
 */

import {
  getDialogAriaProps,
  getMenuAriaProps,
  getTabAriaProps,
  getTabPanelAriaProps,
  getProgressAriaProps,
  getLiveRegionAriaProps,
  getFormFieldAriaProps,
  getFocusableElements,
  KeyboardKeys,
  generateUniqueId,
  SR_ONLY_CLASS,
} from '../accessibility';

describe('accessibility utils', () => {
  describe('ARIA 属性生成', () => {
    describe('getDialogAriaProps', () => {
      it('应生成基础对话框属性', () => {
        const props = getDialogAriaProps({ id: 'dialog-1' });
        expect(props).toHaveProperty('role', 'dialog');
        expect(props).toHaveProperty('aria-modal', true);
        expect(props).toHaveProperty('id', 'dialog-1');
      });

      it('应支持标题和描述关联', () => {
        const props = getDialogAriaProps({
          id: 'dialog-1',
          titleId: 'title-1',
          descriptionId: 'desc-1',
        });
        expect(props).toHaveProperty('aria-labelledby', 'title-1');
        expect(props).toHaveProperty('aria-describedby', 'desc-1');
      });

      it('应支持自定义 label', () => {
        const props = getDialogAriaProps({
          id: 'dialog-1',
          label: '确认对话框',
        });
        expect(props).toHaveProperty('aria-label', '确认对话框');
      });

      it('应支持非模态对话框', () => {
        const props = getDialogAriaProps({
          id: 'dialog-1',
          modal: false,
        });
        expect(props).toHaveProperty('aria-modal', false);
      });
    });

    describe('getMenuAriaProps', () => {
      it('应生成基础菜单属性', () => {
        const props = getMenuAriaProps({ id: 'menu-1' });
        expect(props).toHaveProperty('role', 'menu');
        expect(props).toHaveProperty('id', 'menu-1');
        expect(props).toHaveProperty('aria-orientation', 'vertical');
      });

      it('应支持水平方向', () => {
        const props = getMenuAriaProps({
          id: 'menu-1',
          orientation: 'horizontal',
        });
        expect(props).toHaveProperty('aria-orientation', 'horizontal');
      });

      it('应支持展开状态', () => {
        const props = getMenuAriaProps({
          id: 'menu-1',
          expanded: true,
        });
        expect(props).toHaveProperty('aria-expanded', true);
      });
    });

    describe('getTabAriaProps', () => {
      it('应生成选中的选项卡属性', () => {
        const props = getTabAriaProps({
          id: 'tab-1',
          selected: true,
          controls: 'panel-1',
        });
        expect(props).toHaveProperty('role', 'tab');
        expect(props).toHaveProperty('aria-selected', true);
        expect(props).toHaveProperty('aria-controls', 'panel-1');
        expect(props).toHaveProperty('tabIndex', 0);
      });

      it('应生成未选中的选项卡属性', () => {
        const props = getTabAriaProps({
          id: 'tab-2',
          selected: false,
          controls: 'panel-2',
        });
        expect(props).toHaveProperty('aria-selected', false);
        expect(props).toHaveProperty('tabIndex', -1);
      });

      it('应支持禁用状态', () => {
        const props = getTabAriaProps({
          id: 'tab-3',
          selected: false,
          controls: 'panel-3',
          disabled: true,
        });
        expect(props).toHaveProperty('aria-disabled', true);
      });
    });

    describe('getTabPanelAriaProps', () => {
      it('应生成选项卡面板属性', () => {
        const props = getTabPanelAriaProps({
          id: 'panel-1',
          labelledBy: 'tab-1',
        });
        expect(props).toHaveProperty('role', 'tabpanel');
        expect(props).toHaveProperty('id', 'panel-1');
        expect(props).toHaveProperty('aria-labelledby', 'tab-1');
        expect(props).toHaveProperty('tabIndex', 0);
      });

      it('应支持隐藏状态', () => {
        const props = getTabPanelAriaProps({
          id: 'panel-2',
          labelledBy: 'tab-2',
          hidden: true,
        });
        expect(props).toHaveProperty('aria-hidden', true);
      });
    });

    describe('getProgressAriaProps', () => {
      it('应生成确定进度的属性', () => {
        const props = getProgressAriaProps({
          value: 50,
          min: 0,
          max: 100,
        });
        expect(props).toHaveProperty('role', 'progressbar');
        expect(props).toHaveProperty('aria-valuemin', 0);
        expect(props).toHaveProperty('aria-valuemax', 100);
        expect(props).toHaveProperty('aria-valuenow', 50);
      });

      it('应生成不确定进度的属性', () => {
        const props = getProgressAriaProps({
          indeterminate: true,
        });
        expect(props).toHaveProperty('role', 'progressbar');
        expect(props['aria-valuenow']).toBeUndefined();
        expect(props['aria-valuemin']).toBeUndefined();
        expect(props['aria-valuemax']).toBeUndefined();
      });

      it('应支持自定义标签', () => {
        const props = getProgressAriaProps({
          value: 75,
          label: '上传进度',
        });
        expect(props).toHaveProperty('aria-label', '上传进度');
      });
    });

    describe('getLiveRegionAriaProps', () => {
      it('应生成默认实时区域属性', () => {
        const props = getLiveRegionAriaProps({});
        expect(props).toHaveProperty('aria-live', 'polite');
        expect(props).toHaveProperty('aria-atomic', false);
      });

      it('应支持断言级别', () => {
        const props = getLiveRegionAriaProps({
          politeness: 'assertive',
        });
        expect(props).toHaveProperty('aria-live', 'assertive');
      });

      it('应支持原子更新', () => {
        const props = getLiveRegionAriaProps({
          atomic: true,
        });
        expect(props).toHaveProperty('aria-atomic', true);
      });
    });

    describe('getFormFieldAriaProps', () => {
      it('应生成基础表单字段属性', () => {
        const props = getFormFieldAriaProps({
          id: 'field-1',
          labelId: 'label-1',
        });
        expect(props).toHaveProperty('id', 'field-1');
        expect(props).toHaveProperty('aria-labelledby', 'label-1');
      });

      it('应关联错误消息', () => {
        const props = getFormFieldAriaProps({
          id: 'field-1',
          errorId: 'error-1',
          invalid: true,
        });
        expect(props).toHaveProperty('aria-describedby', 'error-1');
        expect(props).toHaveProperty('aria-invalid', true);
      });

      it('应关联描述和错误', () => {
        const props = getFormFieldAriaProps({
          id: 'field-1',
          descriptionId: 'desc-1',
          errorId: 'error-1',
        });
        expect(props).toHaveProperty('aria-describedby', 'desc-1 error-1');
      });

      it('应支持必填和禁用状态', () => {
        const props = getFormFieldAriaProps({
          id: 'field-1',
          required: true,
          disabled: true,
        });
        expect(props).toHaveProperty('aria-required', true);
        expect(props).toHaveProperty('aria-disabled', true);
      });
    });
  });

  describe('焦点管理', () => {
    describe('getFocusableElements', () => {
      beforeEach(() => {
        document.body.innerHTML = '';
      });

      it('应获取容器内所有可聚焦元素', () => {
        document.body.innerHTML = `
          <div id="container">
            <button>Button 1</button>
            <a href="#test">Link</a>
            <input type="text" />
            <button disabled>Disabled</button>
            <div tabindex="0">Focusable div</div>
            <div tabindex="-1">Not focusable</div>
          </div>
        `;

        const container = document.getElementById('container') as HTMLElement;
        const elements = getFocusableElements(container);

        expect(elements).toHaveLength(4); // button, a, input, div[tabindex="0"]
      });

      it('空容器应返回空数组', () => {
        document.body.innerHTML = '<div id="container"></div>';
        const container = document.getElementById('container') as HTMLElement;
        const elements = getFocusableElements(container);

        expect(elements).toHaveLength(0);
      });
    });
  });

  describe('键盘导航', () => {
    it('KeyboardKeys 应包含所有常用键', () => {
      expect(KeyboardKeys.ENTER).toBe('Enter');
      expect(KeyboardKeys.SPACE).toBe(' ');
      expect(KeyboardKeys.ESCAPE).toBe('Escape');
      expect(KeyboardKeys.TAB).toBe('Tab');
      expect(KeyboardKeys.ARROW_UP).toBe('ArrowUp');
      expect(KeyboardKeys.ARROW_DOWN).toBe('ArrowDown');
      expect(KeyboardKeys.ARROW_LEFT).toBe('ArrowLeft');
      expect(KeyboardKeys.ARROW_RIGHT).toBe('ArrowRight');
      expect(KeyboardKeys.HOME).toBe('Home');
      expect(KeyboardKeys.END).toBe('End');
    });
  });

  describe('工具函数', () => {
    describe('generateUniqueId', () => {
      it('应生成唯一 ID', () => {
        const id1 = generateUniqueId();
        const id2 = generateUniqueId();

        expect(id1).not.toBe(id2);
        expect(id1).toContain('a11y');
      });

      it('应支持自定义前缀', () => {
        const id = generateUniqueId('custom');
        expect(id).toContain('custom');
      });

      it('每次调用应递增计数器', () => {
        const id1 = generateUniqueId('test');
        const id2 = generateUniqueId('test');

        // 提取计数器部分（格式：prefix-counter-timestamp）
        const counter1 = parseInt(id1.split('-')[1], 10);
        const counter2 = parseInt(id2.split('-')[1], 10);

        expect(counter2).toBeGreaterThan(counter1);
      });
    });

    describe('SR_ONLY_CLASS', () => {
      it('应有正确的类名', () => {
        expect(SR_ONLY_CLASS).toBe('sr-only');
      });
    });
  });
});
