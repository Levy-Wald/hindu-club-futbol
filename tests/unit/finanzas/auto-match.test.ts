import { describe, it, expect } from 'vitest'
import {
  esCandidato,
  findBestMatch,
  tiposCandidatos,
  normalizeMonto,
  normalizeDate,
  type FilaBancariaMatch,
  type MovimientoSistema,
  type MatchTolerancia,
} from '../../../modules/finanzas/lib/conciliacion-logic'

describe('tiposCandidatos', () => {
  it('monto positivo => ingreso o transferencia', () => {
    expect(tiposCandidatos(1000)).toEqual(['ingreso', 'transferencia'])
  })
  it('monto negativo => egreso o transferencia', () => {
    expect(tiposCandidatos(-500)).toEqual(['egreso', 'transferencia'])
  })
})

describe('esCandidato', () => {
  const tolerancia: MatchTolerancia = { toleranciaPesos: 0, toleranciaDias: 1 }

  it('match exacto por monto y fecha', () => {
    const fila: FilaBancariaMatch = { monto: 1000, fecha_operacion: '2026-05-10' }
    const mov: MovimientoSistema = { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-10' }
    expect(esCandidato(fila, mov, tolerancia)).toBe(true)
  })

  it('no matchea si tipo incompatible (monto positivo + egreso)', () => {
    const fila: FilaBancariaMatch = { monto: 1000, fecha_operacion: '2026-05-10' }
    const mov: MovimientoSistema = { id: 'm1', tipo: 'egreso', monto_neto: 1000, fecha: '2026-05-10' }
    expect(esCandidato(fila, mov, tolerancia)).toBe(false)
  })

  it('monto negativo matchea con egreso (sign-aware)', () => {
    const fila: FilaBancariaMatch = { monto: -500, fecha_operacion: '2026-05-10' }
    const mov: MovimientoSistema = { id: 'm1', tipo: 'egreso', monto_neto: 500, fecha: '2026-05-10' }
    expect(esCandidato(fila, mov, tolerancia)).toBe(true)
  })

  it('respeta tolerancia de dias', () => {
    const fila: FilaBancariaMatch = { monto: 1000, fecha_operacion: '2026-05-10' }
    const movCerca: MovimientoSistema = { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-11' }
    const movLejos: MovimientoSistema = { id: 'm2', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-15' }
    expect(esCandidato(fila, movCerca, tolerancia)).toBe(true)
    expect(esCandidato(fila, movLejos, tolerancia)).toBe(false)
  })
})

describe('findBestMatch', () => {
  const tolerancia: MatchTolerancia = { toleranciaPesos: 0, toleranciaDias: 1 }

  it('caso 1: extracto +1000 y mov ingreso 1000 => match alta confianza', () => {
    const fila: FilaBancariaMatch = { monto: 1000, fecha_operacion: '2026-05-10' }
    const movs: MovimientoSistema[] = [
      { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-10' },
    ]
    const result = findBestMatch(fila, movs, tolerancia)
    expect(result.confidence).toBe('alta')
    expect(result.match?.id).toBe('m1')
  })

  it('caso 2: extracto -500 y mov egreso 500 => match (sign-aware)', () => {
    const fila: FilaBancariaMatch = { monto: -500, fecha_operacion: '2026-05-10' }
    const movs: MovimientoSistema[] = [
      { id: 'm1', tipo: 'egreso', monto_neto: 500, fecha: '2026-05-10' },
    ]
    const result = findBestMatch(fila, movs, tolerancia)
    expect(result.confidence).toBe('alta')
    expect(result.match?.id).toBe('m1')
  })

  it('caso 3: tolerancia de monto permite match con diferencia menor', () => {
    const fila: FilaBancariaMatch = { monto: 1000.05, fecha_operacion: '2026-05-10' }
    const movs: MovimientoSistema[] = [
      { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-10' },
    ]
    const tolConMonto: MatchTolerancia = { toleranciaPesos: 0.10, toleranciaDias: 1 }
    const result = findBestMatch(fila, movs, tolConMonto)
    expect(result.confidence).toBe('alta')
    expect(result.match?.id).toBe('m1')
  })

  it('caso 4: multiples candidatos => media confianza, desempate por fecha', () => {
    const fila: FilaBancariaMatch = { monto: 1000, fecha_operacion: '2026-05-10' }
    const movs: MovimientoSistema[] = [
      { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-10' },
      { id: 'm2', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-11' },
      { id: 'm3', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-09' },
    ]
    const result = findBestMatch(fila, movs, tolerancia)
    expect(result.confidence).toBe('media')
    expect(result.candidatos).toHaveLength(3)
    expect(result.match?.id).toBe('m1') // exact date match wins
  })

  it('caso 5: extracto sin match => sin sugerencia', () => {
    const fila: FilaBancariaMatch = { monto: 9999, fecha_operacion: '2026-05-10' }
    const movs: MovimientoSistema[] = [
      { id: 'm1', tipo: 'ingreso', monto_neto: 1000, fecha: '2026-05-10' },
    ]
    const result = findBestMatch(fila, movs, tolerancia)
    expect(result.confidence).toBe('sin_match')
    expect(result.match).toBeNull()
    expect(result.candidatos).toHaveLength(0)
  })
})

describe('normalizeMonto', () => {
  it('formato argentino 1.234,56 => 1234.56', () => {
    expect(normalizeMonto('1.234,56')).toBeCloseTo(1234.56)
  })
  it('con signo $ y espacios', () => {
    expect(normalizeMonto('$ 5.000,00')).toBeCloseTo(5000)
  })
  it('vacio retorna NaN', () => {
    expect(normalizeMonto('')).toBeNaN()
  })
})

describe('normalizeDate', () => {
  it('YYYY-MM-DD pass-through', () => {
    expect(normalizeDate('2026-05-14')).toBe('2026-05-14')
  })
  it('DD/MM/YYYY => YYYY-MM-DD', () => {
    expect(normalizeDate('14/05/2026')).toBe('2026-05-14')
  })
  it('DD-MM-YYYY => YYYY-MM-DD', () => {
    expect(normalizeDate('1-3-2026')).toBe('2026-03-01')
  })
  it('vacio retorna null', () => {
    expect(normalizeDate('')).toBeNull()
  })
})
