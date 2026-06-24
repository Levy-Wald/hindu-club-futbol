import { describe, it, expect } from 'vitest'
import { resumenConvocatoria } from '../../../app/admin/[tenant]/(troncal)/convocatorias/_lib/calculos'

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
