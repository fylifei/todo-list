import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { quasar, transformAssetUrls } from '@quasar/vite-plugin'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: '我的待办清单',
        short_name: '待办清单',
        description: '一个现代化的待办事项管理应用',
        theme_color: '#1976D2',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        scope: './'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [{
          urlPattern: new RegExp('/*'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'todo-cache',
            networkTimeoutSeconds: 5
          }
        }]
      }
    })
  ],
  server: {
    host: true,
    port: 5173
  },
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src')
    }
  }
})
