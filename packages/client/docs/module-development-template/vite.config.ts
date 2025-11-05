import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: './src/index.tsx',
      name: 'BooltoxModule',
      formats: ['iife'],
      fileName: () => 'module.js'
    },
    rollupOptions: {
      // 将 React 声明为外部依赖（由宿主应用提供）
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        },
        // 使用立即执行函数包装
        format: 'iife',
        // 导出到全局变量
        name: 'BooltoxModule'
      }
    },
    // 确保输出单个文件
    cssCodeSplit: false,
    // 启用代码压缩
    minify: 'terser'
  }
})
