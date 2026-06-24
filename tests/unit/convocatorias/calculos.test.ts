import { describe, it, expect } from 'vitest'
import {
  resumenConvocatoria,
  resumenRespuestas,
  esRespuestaValida,
  puedeResponderConvocatoria,
} from '../../../app/admin/[tenant]/(troncal)/convocatorias/_lib/calculos'

describe('resumenConvocatoria', () => {
  it('cuenta por estado y total de citados', () => {
    const r = resumenConvocatoria([
      { estado: 'titular' }, { estado: 'titular' },
      { estado: 'suplente' },
      { estado: 'convocado' },
      { estado: null }, { estado: null },
    ])
    expect(r).toEqual({ titulares: 2, suplentes: 1, convocados: 1, total: 4 })
  })

  it('plantel vacío → todo en cero', () => {
    expect(resumenConvocatoria([])).toEqual({ titulares: 0, suplentes: 0, convocados: 0, total: 0 })
  })

  it('no convocados no suman al total', () => {
    expect(resumenConvocatoria([{ estado: null }, { estado: null }]).total).toBe(0)
  })
})

describe('resumenRespuestas', () => {
  it('cuenta respuestas solo de los citados', () => {
    const r = resumenRespuestas([
      { estado: 'titular', respuesta: 'aceptado' },
      { estado: 'titular', respuesta: 'rechazado' },
      { estado: 'suplente', respuesta: 'tentativa' },
      { estado: 'convocado' }, // sin respuesta → pendiente
      { estado: null, respuesta: 'aceptado' }, // no citado → no cuenta
    ])
    expect(r).toEqual({ aceptados: 1, rechazados: 1, tentativa: 1, pendientes: 1, total: 4 })
  })

  it('citado sin respuesta cuenta como pendiente', () => {
    const r = resumenRespuestas([{ estado: 'titular' }, { estado: 'suplente' }])
    expect(r.pendientes).toBe(2)
    expect(r.total).toBe(2)
  })

  it('sin citados → todo en cero', () => {
    expect(resumenRespuestas([{ estado: null }])).toEqual({
      aceptados: 0, rechazados: 0, tentativa: 0, pendientes: 0, total: 0,
    })
  })
})

describe('esRespuestaValida', () => {
  it('acepta el vocabulario válido', () => {
    expect(esRespuestaValida('aceptado')).toBe(true)
    expect(esRespuestaValida('rechazado')).toBe(true)
    expect(esRespuestaValida('tentativa')).toBe(true)
    expect(esRespuestaValida('pendiente')).toBe(true)
  })
  it('rechaza valores inválidos', () => {
    expect(esRespuestaValida('aceptada')).toBe(false) // femenino, no es el vocabulario
    expect(esRespuestaValida('si')).toBe(false)
    expect(esRespuestaValida('')).toBe(false)
  })
})

describe('puedeResponderConvocatoria', () => {
  it('happy: citado y partido futuro', () => {
    expect(puedeResponderConvocatoria({ estado: 'titular', fechaInicio: '2026-07-01', hoyISO: '2026-06-24' }))
      .toEqual({ ok: true })
  })
  it('happy: partido es hoy', () => {
    expect(puedeResponderConvocatoria({ estado: 'suplente', fechaInicio: '2026-06-24', hoyISO: '2026-06-24' }).ok).toBe(true)
  })
  it('unhappy: no está convocado', () => {
    const r = puedeResponderConvocatoria({ estado: null, fechaInicio: '2026-07-01', hoyISO: '2026-06-24' })
    expect(r.ok).toBe(false)
    expect(r.motivo).toMatch(/no estás convocado/i)
  })
  it('unhappy: el partido ya pasó', () => {
    const r = puedeResponderConvocatoria({ estado: 'titular', fechaInicio: '2026-06-01', hoyISO: '2026-06-24' })
    expect(r.ok).toBe(false)
    expect(r.motivo).toMatch(/ya pasó/i)
  })
})
