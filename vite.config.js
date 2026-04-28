import { defineConfig } from 'vite'

export default defineConfig({
  base: '/Portfolio/',
  server: {
    host: true,
    port: 5173,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0
  }
})
