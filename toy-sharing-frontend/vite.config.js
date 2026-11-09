import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy /api và /socket.io sang backend khi chạy dev (http://localhost:5000).
// Nhờ vậy lời gọi đường dẫn tương đối luôn tới đúng backend, không phụ thuộc baseURL.
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
})
