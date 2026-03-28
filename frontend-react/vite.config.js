import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://c1e30rr1se.execute-api.ca-central-1.amazonaws.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/receipt': {
        target: 'https://c1e30rr1se.execute-api.ca-central-1.amazonaws.com',
        changeOrigin: true,
      },
    },
  },
})
