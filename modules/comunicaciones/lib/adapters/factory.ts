import type { ComunicacionAdapter } from '../adapter'
import { MockAdapter } from './mock-adapter'

let cached: ComunicacionAdapter | null = null

export function resolveAdapter(): ComunicacionAdapter {
  if (cached) return cached

  const mode = process.env.COMUNICACIONES_MODE || 'mock'

  switch (mode) {
    case 'mock':
      cached = new MockAdapter()
      break
    default:
      throw new Error(`Adapter desconocido: ${mode}. Valores validos: mock`)
  }

  return cached
}
