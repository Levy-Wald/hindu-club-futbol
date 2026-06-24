import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Config mínima: solo resuelve el alias '@' (igual que tsconfig: "@/*" -> "./*"),
// para que los tests puedan importar módulos que usan rutas '@/...'. Sin esto,
// vitest falla al resolver '@/lib/...' (p.ej. capabilities.test.ts).
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./', import.meta.url)),
    },
  },
})
