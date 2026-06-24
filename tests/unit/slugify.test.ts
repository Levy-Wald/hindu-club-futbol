import { describe, it, expect } from 'vitest'
import { slugify } from '../../lib/slugify'

describe('slugify', () => {
  it('minúsculas + espacios a guion', () => {
    expect(slugify('Distribuidora Deportiva')).toBe('distribuidora-deportiva')
  })

  it('saca acentos', () => {
    expect(slugify('Almacén Río Paraná')).toBe('almacen-rio-parana')
  })

  it('colapsa separadores y recorta guiones colgantes', () => {
    expect(slugify('  Club  Atlético / River!! ')).toBe('club-atletico-river')
  })

  it('quita caracteres especiales', () => {
    expect(slugify('S.A. & Cía. #1')).toBe('s-a-cia-1')
  })

  it('string vacío → vacío', () => {
    expect(slugify('')).toBe('')
  })
})
