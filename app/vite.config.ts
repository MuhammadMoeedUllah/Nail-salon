import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    tailwindcss(),
    sveltekit(),
    SvelteKitPWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      manifest: {
        name: 'Salon Pay Records',
        short_name: 'Salon Pay',
        description: 'Clock-in, ticket log and weekly pay records for nail salons',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#ffffff',
        theme_color: '#0f766e',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      },
      workbox: {
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/kiosk'),
            handler: 'NetworkFirst',
            options: { cacheName: 'kiosk-pages', networkTimeoutSeconds: 4 }
          }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'node'
  }
});
