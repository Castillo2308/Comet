import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({

  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-192.png',
        'maskable-512.png',
        'screenshots/wide-1.png',
        'screenshots/mobile-1.png',
        'screenshots/mobile-2.png',
        'screenshots/mobile-3.png',
        'screenshots/mobile-4.png',
      ],
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module'
      },
      manifest: {
        name: 'COMET',
        short_name: 'COMET',
        description: 'App para reportar problemas cívicos y recibir noticias locales',
        theme_color: '#1e40af',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['utilities', 'productivity', 'news', 'social'],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshots/wide-1.png',
            sizes: '1600x900',
            type: 'image/png',
            form_factor: 'wide',
            label: 'Panel y noticias locales'
          },
          {
            src: 'screenshots/mobile-1.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Vista móvil y navegación'
          },
          {
            src: 'screenshots/mobile-2.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Vista móvil 2'
          },
          {
            src: 'screenshots/mobile-3.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Vista móvil 3'
          },
          {
            src: 'screenshots/mobile-4.png',
            sizes: '1080x1920',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'Vista móvil 4'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      }
    }
  }
});