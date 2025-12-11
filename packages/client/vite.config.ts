import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        // Shortcut of `build.lib.entry`.
        entry: 'electron/main.ts',
      },
      preload: {
        // Shortcut of `build.rollupOptions.input`.
        // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
        input: {
          preload: path.join(__dirname, 'electron/preload.ts'),
          'preload-tool': path.join(__dirname, 'electron/preload-tool.ts'),
        },
        vite: {
            build: {
                rollupOptions: {
                    output: {
                        inlineDynamicImports: false,
                    }
                }
            }
        }
      },
      // Ployfill the Electron and Node.js API for Renderer process.
      // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
      // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
      renderer: process.env.NODE_ENV === 'test'
        // https://github.com/electron-vite/vite-plugin-electron-renderer/issues/78#issuecomment-2053600808
        ? undefined
        : {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'),
      '@modules': path.resolve(__dirname, 'src/modules'),
      '@shared': path.resolve(__dirname, 'src/shared'),
    },
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    rollupOptions: {
      output: {
        // 手动代码分割优化
        manualChunks: (id) => {
          // React 核心库
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor';
          }
          
          // Framer Motion 动画库
          if (id.includes('node_modules/framer-motion')) {
            return 'animation-vendor';
          }
          
          // DnD Kit 拖拽库
          if (id.includes('node_modules/@dnd-kit')) {
            return 'dnd-vendor';
          }
          
          // Lucide 图标库
          if (id.includes('node_modules/lucide-react')) {
            return 'icons-vendor';
          }
          
          // 模块系统
          if (id.includes('src/renderer/contexts/module-context')) {
            return 'module-system';
          }
          
          // 其他大型 node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // 优化 chunk 命名
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    // 增大 chunk 警告阈值（适当调整）
    chunkSizeWarningLimit: 1000,
  },
})
