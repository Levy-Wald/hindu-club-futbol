import { describe, it, expect } from 'vitest'
import {
  totalRendicion,
  transicionValida,
  puedeEditarItems,
} from '../../../app/admin/[tenant]/(troncal)/finanzas/rendiciones/_lib/calculos'

describe('totalRendicion', () => {
  it('suma los montos', () => {
    expect(totalRendicion([{ monto: 1500 }, { monto: 320.5 }])).toBe(1820.5)
  })
  it('vacío → 0', () => {
    expect(totalRendicion([])).toBe(0)
  })
})

describe('transicionValida', () => {
  it('borrador → presentada OK', () => {
    expect(transicionValida('borrador', 'presentada')).toBe(true)
  })
  it('presentada → aprobada/rechazada OK', () => {
    expect(transicionValida('presentada', 'aprobada')).toBe(true)
    expect(transicionValida('presentada', 'rechazada')).toBe(true)
  })
  it('aprobada → liquidada OK', () => {
    expect(transicionValida('aprobada', 'liquidada')).toBe(true)
  })
  it('no se puede saltar de borrador a aprobada', () => {
    expect(transicionValida('borrador', 'aprobada')).toBe(false)
  })
  it('liquidada es terminal', () => {
    expect(transicionValida('liquidada', 'borrador')).toBe(false)
  })
  it('rechazada vuelve a borrador para corregir', () => {
    expect(transicionValida('rechazada', 'borrador')).toBe(true)
  })
})

describe('puedeEditarItems', () => {
  it('solo en borrador', () => {
    expect(puedeEditarItems('borrador')).toBe(true)
    expect(puedeEditarItems('presentada')).toBe(false)
    expect(puedeEditarItems('aprobada')).toBe(false)
  })
})
