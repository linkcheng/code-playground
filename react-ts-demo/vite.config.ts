import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 使用 __dirname 解析绝对路径
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    host: true,
    port: 6000
  },
})
