import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    // `describe`, `it` y `expect` disponibles sin importarlos en cada archivo.
    globals: true,
    // Los componentes necesitan DOM: jsdom lo simula en Node.
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
