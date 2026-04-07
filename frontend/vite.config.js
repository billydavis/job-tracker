import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Vite will pick the next free port if this one is in use.
    // Set to 5174 to match the currently running dev server.
    port: 5174,
    // When true, Vite will error instead of picking another port — helps avoid
    // accidental dev URL confusion during development.
    strictPort: true,
    proxy: {
      // Proxy API requests to the backend during development so cookies work
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },
    },
  }
})
