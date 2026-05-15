import { describe, it, expect } from 'vitest'
import {
  validarTipoEspacio,
  calcularDeltasStock,
} from '../../../modules/pim/lib/stock-validacion'

describe('validarTipoEspacio', () => {
  it('entrada sin espacio destino => error', () => {
    const result = validarTipoEspacio({
      tipo: 'entrada', cantidad: 100,
      espacio_origen_id: null, espacio_destino_id: null,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('destino')
  })

  it('salida sin espacio origen => error', () => {
    const result = validarTipoEspacio({
      tipo: 'salida', cantidad: 30,
      espacio_origen_id: null, espacio_destino_id: null,
    })
    expect(result.valid).toBe(false)
    expect(result.error).toContain('origen')
  })

  it('transferencia requiere ambos espacios distintos', () => {
    expect(validarTipoEspacio({
      tipo: 'transferencia', cantidad: 50,
      espacio_origen_id: 'a', espacio_destino_id: 'b',
    }).valid).toBe(true)

    expect(validarTipoEspacio({
      tipo: 'transferencia', cantidad: 50,
      espacio_origen_id: 'a', espacio_destino_id: null,
    }).valid).toBe(false)

    expect(validarTipoEspacio({
      tipo: 'transferencia', cantidad: 50,
      espacio_origen_id: 'a', espacio_destino_id: 'a',
    }).valid).toBe(false)
  })

  it('ajuste sin espacio => error', () => {
    const result = validarTipoEspacio({
      tipo: 'ajuste', cantidad: 100,
      espacio_origen_id: null, espacio_destino_id: null,
    })
    expect(result.valid).toBe(false)
  })
})

describe('calcularDeltasStock', () => {
  it('caso 1: deposito vacio + entrada 100 => stock 100', () => {
    const result = calcularDeltasStock('entrada', 100, 0, 0)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nuevoDestino).toBe(100)
    }
  })

  it('caso 2: deposito con 100 + salida 30 => stock 70', () => {
    const result = calcularDeltasStock('salida', 30, 100, 0)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nuevoOrigen).toBe(70)
    }
  })

  it('caso 3: transferencia 50 de origen 100 a destino 0 => origen 50, destino 50', () => {
    const result = calcularDeltasStock('transferencia', 50, 100, 0)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nuevoOrigen).toBe(50)
      expect(result.nuevoDestino).toBe(50)
    }
  })

  it('caso 4: salida mayor al stock disponible => error', () => {
    const result = calcularDeltasStock('salida', 150, 100, 0)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Stock insuficiente')
    }
  })

  it('caso 4b: transferencia mayor al stock disponible => error', () => {
    const result = calcularDeltasStock('transferencia', 150, 100, 0)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Stock insuficiente')
    }
  })

  it('caso 5: cantidad negativa => error', () => {
    const result = calcularDeltasStock('entrada', -10, 0, 0)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('positiva')
    }
  })

  it('caso 6: ajuste setea valor absoluto', () => {
    const result = calcularDeltasStock('ajuste', 42, 0, 100)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.nuevoDestino).toBe(42)
    }
  })
})
