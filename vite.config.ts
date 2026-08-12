import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

// Default: HTTP (no cert errors on localhost).
// Mobile camera / remote devices: npm run dev:https
const useHttps = process.env.VITE_HTTPS === 'true'
const base = process.env.VITE_BASE || '/'

export default defineConfig({
  base,
  plugins: [react(), tailwindcss(), ...(useHttps ? [basicSsl()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(rootDir, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  optimizeDeps: {
    exclude: ['mind-ar'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    commonjsOptions: {
      include: [/mind-ar/, /node_modules/],
    },
  },
})
