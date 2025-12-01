import type { BrowserWindowConstructorOptions } from 'electron';

interface PlatformWindowConfigOptions {
  frameless?: boolean;
}

/**
 * 根据当前操作系统生成统一的窗口装饰配置，保证多窗口外观一致。
 */
export function getPlatformWindowConfig(
  options: PlatformWindowConfigOptions = {},
): Partial<BrowserWindowConstructorOptions> {
  const { frameless = false } = options;

  switch (process.platform) {
    case 'win32':
      return {
        backgroundMaterial: 'mica',
        titleBarStyle: 'hidden',
      };
    case 'darwin': {
      const base: Partial<BrowserWindowConstructorOptions> = {
        vibrancy: 'under-window',
        visualEffectState: 'active',
        transparent: false,
      };
      if (frameless) {
        return base;
      }
      return {
        ...base,
        titleBarStyle: 'hiddenInset',
        trafficLightPosition: { x: 16, y: 16 },
      };
    }
    case 'linux':
      return {
        transparent: false,
        backgroundColor: '#1c1e23',
      };
    default:
      return {};
  }
}
