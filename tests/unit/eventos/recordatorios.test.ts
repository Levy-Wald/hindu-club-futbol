import { describe, it, expect } from 'vitest'
import {
  recordatorioDispara,
  inicioEventoMs,
} from '../../../modules/eventos/lib/recordatorios-logica'
import type { Recordatorio } from '../../../modules/eventos/lib/types'

const MIN = 60_000
const rec = (minutos_antes: number, habilitado = true): Recordatorio => ({
  minutos_antes,
  habilitado,
  notificacion_tipo: 'in_app',
})

describe('inicioEventoMs', () => {
  it('combina fecha + hora en hora local AR (-03:00)', () => {
    expect(inicioEventoMs('2026-07-01', '12:00:00')).toBe(Date.parse('2026-07-01T12:00:00-03:00'))
    expect(inicioEventoMs('2026-07-01', null)).toBe(Date.parse('2026-07-01T00:00:00-03:00'))
  })
})

describe('recordatorioDispara', () => {
  const start = inicioEventoMs('2026-07-01', '12:00:00')

  it('dispara cuando ahora está en la ventana [fire, fire+70min)', () => {
    const fire = start - 120 * MIN
    expect(recordatorioDispara(start, [rec(120)], fire + 5 * MIN)).toBe(true)
    expect(recordatorioDispara(start, [rec(120)], fire)).toBe(true) // borde inicio inclusivo
  })

  it('no dispara antes del fireTime', () => {
    const fire = start - 120 * MIN
    expect(recordatorioDispara(start, [rec(120)], fire - 1 * MIN)).toBe(false)
  })

  it('no dispara pasada la ventana de 70 min', () => {
    const fire = start - 120 * MIN
    expect(recordatorioDispara(start, [rec(120)], fire + 71 * MIN)).toBe(false)
  })

  it('no dispara si el evento ya empezó', () => {
    expect(recordatorioDispara(start, [rec(120)], start)).toBe(false)
    expect(recordatorioDispara(start, [rec(120)], start + 1 * MIN)).toBe(false)
  })

  it('ignora recordatorios deshabilitados', () => {
    const fire = start - 120 * MIN
    expect(recordatorioDispara(start, [rec(120, false)], fire + 5 * MIN)).toBe(false)
  })

  it('lista vacía -> no dispara', () => {
    expect(recordatorioDispara(start, [], start - 10 * MIN)).toBe(false)
  })

  it('startMs NaN -> no dispara', () => {
    expect(recordatorioDispara(NaN, [rec(60)], Date.now())).toBe(false)
  })
})
