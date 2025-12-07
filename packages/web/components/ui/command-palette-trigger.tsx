'use client';

// 全局状态，用于外部触发命令面板
let commandPaletteOpener: (() => void) | null = null;

export function registerCommandPaletteOpener(opener: () => void) {
  commandPaletteOpener = opener;
}

export function openCommandPalette() {
  if (commandPaletteOpener) {
    commandPaletteOpener();
  }
}
