import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugin/index': 'src/plugin/index.ts',
    'runtime/index': 'src/runtime/index.ts',
    'storage/index': 'src/storage/index.ts',
    'protocol/index': 'src/protocol/index.ts',
    'utils/index': 'src/utils/index.ts',
  },
  format: ['esm'],
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  skipNodeModulesBundle: true,
});
