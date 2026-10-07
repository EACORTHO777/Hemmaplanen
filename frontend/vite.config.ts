import react from '@vitejs/plugin-react'
import { configDefaults } from 'vitest/config'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // A new version is installed automatically the next time the app opens
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Hemmaplanen',
        short_name: 'Hemmaplanen',
        description: 'Handla, kalender, att göra och medicin för hela hushållet.',
        lang: 'sv',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f4f7',
        theme_color: '#f5f4f7',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The app shell (HTML, JS, CSS, fonts, icons) is cached so the app starts instantly.
        // Data from Supabase is never cached: it always comes live from the network.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/index.html',
        // Adds the push notification handlers to the generated service worker
        importScripts: ['push-sw.js'],
      },
    }),
    // Uploads source maps to Sentry so stack traces show real file names, then deletes them from dist
    sentryVitePlugin({
      org: 'lnu',
      project: 'javascript-react',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: { filesToDeleteAfterUpload: ['./dist/**/*.map'] },
    }),
  ],
  build: { sourcemap: 'hidden' },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Playwright runs the e2e folder, not Vitest
    exclude: [...configDefaults.exclude, 'e2e/**'],
  },
})
