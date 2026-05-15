import { describe, it, expect } from 'vitest'
import {
  resolverPrecioVigente,
  type PrecioConVigencia,
} from '../../../modules/pim/lib/precio-vigente'

describe('resolverPrecioVigente', () => {
  it('caso 1: un precio vigente desde 2026-01-01 => lo devuelve para fecha actual', () => {
    const precios: PrecioConVigencia[] = [
      { id: 'p1', precio: 5000, moneda: 'ARS', fecha_vigencia_desde: '2026-01-01', fecha_vigencia_hasta: null },
    ]
    const result = resolverPrecioVigente(precios, new Date('2026-05-14'))
    expect(result).not.toBeNull()
    expect(result!.id).toBe('p1')
    expect(result!.precio).toBe(5000)
  })

  it('caso 2: dos precios, el mas reciente gana', () => {
    const precios: PrecioConVigencia[] = [
      { id: 'p1', precio: 4000, moneda: 'ARS', fecha_vigencia_desde: '2026-01-01', fecha_vigencia_hasta: null },
      { id: 'p2', precio: 5500, moneda: 'ARS', fecha_vigencia_desde: '2026-03-01', fecha_vigencia_hasta: null },
    ]
    const result = resolverPrecioVigente(precios, new Date('2026-05-14'))
    expect(result!.id).toBe('p2')
    expect(result!.precio).toBe(5500)
  })

  it('caso 3: producto sin precio en lista => null', () => {
    const result = resolverPrecioVigente([], new Date('2026-05-14'))
    expect(result).toBeNull()
  })

  it('caso 4: precio con vigencia expirada => null', () => {
    const precios: PrecioConVigencia[] = [
      { id: 'p1', precio: 3000, moneda: 'ARS', fecha_vigencia_desde: '2026-01-01', fecha_vigencia_hasta: '2026-02-28' },
    ]
    const result = resolverPrecioVigente(precios, new Date('2026-05-14'))
    expect(result).toBeNull()
  })

  it('caso 5: precio futuro no aplica', () => {
    const precios: PrecioConVigencia[] = [
      { id: 'p1', precio: 6000, moneda: 'ARS', fecha_vigencia_desde: '2026-12-01', fecha_vigencia_hasta: null },
    ]
    const result = resolverPrecioVigente(precios, new Date('2026-05-14'))
    expect(result).toBeNull()
  })

  it('caso 6: precio sin fecha_vigencia_desde aplica siempre (con baja prioridad)', () => {
    const precios: PrecioConVigencia[] = [
      { id: 'fallback', precio: 1000, moneda: 'ARS', fecha_vigencia_desde: null, fecha_vigencia_hasta: null },
      { id: 'vigente', precio: 2000, moneda: 'ARS', fecha_vigencia_desde: '2026-03-01', fecha_vigencia_hasta: null },
    ]
    const result = resolverPrecioVigente(precios, new Date('2026-05-14'))
    expect(result!.id).toBe('vigente') // more recent wins
  })
})
