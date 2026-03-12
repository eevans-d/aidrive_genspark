import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'
import { VitePWA } from 'vite-plugin-pwa'

const isProd = process.env.BUILD_MODE === 'prod'

function normalizeModuleId(id: string): string {
  return id.replace(/\\/g, '/')
}

function isNodeModule(id: string, pkg: string): boolean {
  return id.includes(`/node_modules/${pkg}/`)
}

export default defineConfig({
  plugins: [
    react(),
    sourceIdentifierPlugin({
      enabled: !isProd,
      attributePrefix: 'data-matrix',
      includeProps: true,
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Mini Market - Pocket Manager',
        short_name: 'Pocket',
        description: 'Gestión de depósito móvil',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/pocket',
        scope: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const moduleId = normalizeModuleId(id)
          if (!moduleId.includes('/node_modules/')) return

          // Keep heavy feature packs isolated to avoid re-downloading unrelated routes.
          if (isNodeModule(moduleId, '@zxing') || isNodeModule(moduleId, 'jsbarcode')) return 'scanner'
          if (isNodeModule(moduleId, '@supabase')) return 'supabase'
          if (isNodeModule(moduleId, 'recharts')) return 'charts'
          if (isNodeModule(moduleId, '@radix-ui')) return 'radix'
          if (isNodeModule(moduleId, '@tanstack')) return 'query'
          if (isNodeModule(moduleId, 'lucide-react')) return 'icons'
          if (isNodeModule(moduleId, 'react-router') || isNodeModule(moduleId, '@remix-run')) return 'router'

          // Only core React runtime stays here; avoid catching every `react-*` package.
          if (
            isNodeModule(moduleId, 'react') ||
            isNodeModule(moduleId, 'react-dom') ||
            isNodeModule(moduleId, 'scheduler')
          ) {
            return 'react-core'
          }
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
  },
})
