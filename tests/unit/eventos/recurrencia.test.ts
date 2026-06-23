import { describe, it, expect } from 'vitest'
import {
  fechasDeRecurrencia,
  diaSemanaDe,
  sumarDias,
  duracionDias,
  MAX_INSTANCIAS_RECURRENCIA,
} from '../../../modules/eventos/lib/recurrencia'

describe('fechasDeRecurrencia', () => {
  it('no genera nada para periodicidades no recurrentes', () => {
    expect(fechasDeRecurrencia('2026-07-01', 'nunca', null, '2026-08-01')).toEqual([])
    expect(fechasDeRecurrencia('2026-07-01', 'sin_repeticion', null, '2026-08-01')).toEqual([])
  })

  it('diario: una fecha por día, sin incluir el inicio, acotado a fecha_fin', () => {
    const r = fechasDeRecurrencia('2026-07-01', 'diario', null, '2026-07-05')
    expect(r).toEqual(['2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'])
  })

  it('semanal: cada 7 días', () => {
    const r = fechasDeRecurrencia('2026-07-01', 'semanal', null, '2026-07-29')
    expect(r).toEqual(['2026-07-08', '2026-07-15', '2026-07-22', '2026-07-29'])
  })

  it('quincenal: cada 14 días', () => {
    const r = fechasDeRecurrencia('2026-07-01', 'quincenal', null, '2026-08-15')
    expect(r).toEqual(['2026-07-15', '2026-07-29', '2026-08-12'])
  })

  it('mensual: mismo día cada mes', () => {
    const r = fechasDeRecurrencia('2026-01-15', 'mensual', null, '2026-04-15')
    expect(r).toEqual(['2026-02-15', '2026-03-15', '2026-04-15'])
  })

  it('anual: misma fecha cada año', () => {
    const r = fechasDeRecurrencia('2026-03-10', 'anual', null, '2028-03-10')
    expect(r).toEqual(['2027-03-10', '2028-03-10'])
  })

  it('dias_semana: solo los días marcados (lun, mié, vie)', () => {
    // máscara: [lun, mar, mié, jue, vie, sáb, dom]
    const mask = [true, false, true, false, true, false, false]
    // 2026-07-01 es miércoles -> arranca al día siguiente
    const r = fechasDeRecurrencia('2026-07-01', 'dias_semana', mask, '2026-07-08')
    expect(r).toEqual(['2026-07-03', '2026-07-06', '2026-07-08']) // vie, lun, mié
  })

  it('dias_semana sin ningún día marcado -> vacío', () => {
    expect(fechasDeRecurrencia('2026-07-01', 'dias_semana', [false, false, false, false, false, false, false], '2026-08-01')).toEqual([])
  })

  it('sin fecha_fin: acota a 1 año', () => {
    const r = fechasDeRecurrencia('2026-07-01', 'mensual', null, null)
    expect(r.length).toBe(12) // ago..jul siguiente (12 instancias hijas)
    expect(r[r.length - 1]).toBe('2027-07-01')
  })

  it('respeta el tope de seguridad (cap)', () => {
    // diario sin fecha_fin -> ~365 pero capped
    const r = fechasDeRecurrencia('2026-07-01', 'diario', null, '2099-01-01')
    expect(r.length).toBe(MAX_INSTANCIAS_RECURRENCIA)
  })

  it('fecha_fin antes del inicio -> vacío', () => {
    expect(fechasDeRecurrencia('2026-07-01', 'diario', null, '2026-06-01')).toEqual([])
  })
})

describe('helpers de fecha', () => {
  it('diaSemanaDe: 1=lunes … 7=domingo', () => {
    expect(diaSemanaDe('2026-07-06')).toBe(1) // lunes
    expect(diaSemanaDe('2026-07-01')).toBe(3) // miércoles
    expect(diaSemanaDe('2026-07-05')).toBe(7) // domingo
  })

  it('sumarDias', () => {
    expect(sumarDias('2026-07-30', 3)).toBe('2026-08-02')
  })

  it('duracionDias', () => {
    expect(duracionDias('2026-07-01', '2026-07-04')).toBe(3)
    expect(duracionDias('2026-07-01', null)).toBe(0)
  })
})
