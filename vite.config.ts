import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/senior_voicedata/',

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@igraph': path.resolve(__dirname, './src/lib/igraph'),
      '@igraph-source': path.resolve(__dirname, './vendor/igraph-source'),
    },
  },

  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8011',
      '/health': 'http://127.0.0.1:8011',
      '/integrations': 'http://127.0.0.1:8011',
    },
  },

  assetsInclude: ['**/*.svg', '**/*.csv'],
})
