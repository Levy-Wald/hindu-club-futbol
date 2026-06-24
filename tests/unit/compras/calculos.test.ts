import { describe, it, expect } from 'vitest'
import {
  totalItems,
  estadoOCPorRecepcion,
  excedePendiente,
} from '../../../app/admin/[tenant]/(troncal)/compras/_lib/calculos'

describe('totalItems', () => {
  it('suma cantidad × precio de cada ítem', () => {
    expect(totalItems([{ cantidad: 10, precio_unitario: 5000 }, { cantidad: 2, precio_unitario: 100 }])).toBe(50200)
  })

  it('lista vacía → 0', () => {
    expect(totalItems([])).toBe(0)
  })

  it('tolera valores no numéricos como 0', () => {
    expect(totalItems([{ cantidad: NaN as unknown as number, precio_unitario: 100 }])).toBe(0)
  })
})

describe('estadoOCPorRecepcion', () => {
  it('sin ítems → emitida', () => {
    expect(estadoOCPorRecepcion([])).toBe('emitida')
  })

  it('nada recibido → emitida', () => {
    expect(estadoOCPorRecepcion([{ cantidad: 5, cantidad_recibida: 0 }, { cantidad: 3, cantidad_recibida: 0 }])).toBe('emitida')
  })

  it('algo recibido pero falta → recibida_parcial', () => {
    expect(estadoOCPorRecepcion([{ cantidad: 5, cantidad_recibida: 2 }, { cantidad: 3, cantidad_recibida: 0 }])).toBe('recibida_parcial')
  })

  it('todos completos → recibida_total', () => {
    expect(estadoOCPorRecepcion([{ cantidad: 5, cantidad_recibida: 5 }, { cantidad: 3, cantidad_recibida: 3 }])).toBe('recibida_total')
  })

  it('recibido de más (>=) también cuenta como total', () => {
    expect(estadoOCPorRecepcion([{ cantidad: 5, cantidad_recibida: 6 }])).toBe('recibida_total')
  })
})

describe('excedePendiente', () => {
  it('recibir dentro de lo pendiente → false', () => {
    expect(excedePendiente({ cantidad: 10, cantidad_recibida: 3 }, 5)).toBe(false)
  })

  it('recibir exactamente lo pendiente → false', () => {
    expect(excedePendiente({ cantidad: 10, cantidad_recibida: 3 }, 7)).toBe(false)
  })

  it('recibir más de lo pendiente → true', () => {
    expect(excedePendiente({ cantidad: 10, cantidad_recibida: 3 }, 8)).toBe(true)
  })
})
