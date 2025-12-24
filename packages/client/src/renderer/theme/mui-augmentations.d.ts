import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeText {
    tertiary: string;
  }

  interface Palette {
    surfaceContainerLowest: string;
    surfaceContainerLow: string;
    surfaceContainer: string;
    surfaceContainerHigh: string;
    surfaceContainerHighest: string;
    primaryContainer: string;
    onPrimaryContainer: string;
  }

  interface PaletteOptions {
    surfaceContainerLowest?: string;
    surfaceContainerLow?: string;
    surfaceContainer?: string;
    surfaceContainerHigh?: string;
    surfaceContainerHighest?: string;
    primaryContainer?: string;
    onPrimaryContainer?: string;
  }
}

export {};
