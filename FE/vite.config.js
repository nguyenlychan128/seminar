import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/admin/users': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/admin/exercises': { target: 'http://localhost:3003', changeOrigin: true },
      '/api/auth': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/users': { target: 'http://localhost:3002', changeOrigin: true, rewrite: (path) => path.replace(/^\/api\/users/, '') },
      '/api/workouts': { target: 'http://localhost:3003', changeOrigin: true },
      '/api/progress': { target: 'http://localhost:3004', changeOrigin: true },
      '/api/chatbot': { target: 'http://localhost:3005', changeOrigin: true },
      '/api/notifications': { target: 'http://localhost:3006', changeOrigin: true },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
})
