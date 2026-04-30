import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['job-hunter192x192.png', 'job-hunter512x512.png'],
      manifest: {
        name: 'Job Tracker',
        short_name: 'Job Tracker',
        description: 'Track job applications, companies, and notes',
        theme_color: '#0f172a',
        background_color: '#e2e8f0',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/job-hunter192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/job-hunter512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,webmanifest}'],
        // Main bundle exceeds Workbox default 2 MiB precache limit
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api'),
            handler: 'NetworkOnly',
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
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
  },
})
