import { describe, it, expect } from 'vitest'
import {
  clubCoreToGoogleEvent,
  googleEventToClubCore,
  computeEventHash,
  eventsEqual,
} from '../../../lib/calendar-sync/event-mapping'

const baseEvento = {
  id: '123',
  titulo: 'Entrenamiento Sub-20',
  descripcion: 'Sesion tactica',
  fecha_inicio: '2026-05-25',
  fecha_fin: '2026-05-25',
  hora_inicio: '18:00',
  hora_fin: '20:00',
  lugar_encuentro: 'Cancha 1',
  tipo_evento_slug: 'entrenamiento',
  updated_at: '2026-05-22T10:00:00Z',
}

describe('clubCoreToGoogleEvent', () => {
  it('converts timed event to Google format', () => {
    const result = clubCoreToGoogleEvent(baseEvento)
    expect(result.summary).toBe('Entrenamiento Sub-20')
    expect(result.description).toBe('Sesion tactica')
    expect(result.location).toBe('Cancha 1')
    expect(result.start?.dateTime).toBe('2026-05-25T18:00:00')
    expect(result.end?.dateTime).toBe('2026-05-25T20:00:00')
    expect(result.start?.timeZone).toBe('America/Argentina/Buenos_Aires')
  })

  it('converts all-day event (no hora_inicio)', () => {
    const allDay = { ...baseEvento, hora_inicio: null, hora_fin: null }
    const result = clubCoreToGoogleEvent(allDay)
    expect(result.start?.date).toBe('2026-05-25')
    // Google end date is exclusive, so +1 day
    expect(result.end?.date).toBe('2026-05-26')
    expect(result.start?.dateTime).toBeUndefined()
  })

  it('uses tipo_evento_slug as fallback summary', () => {
    const noTitle = { ...baseEvento, titulo: null }
    const result = clubCoreToGoogleEvent(noTitle)
    expect(result.summary).toBe('entrenamiento')
  })

  it('handles multi-day event', () => {
    const multiDay = { ...baseEvento, fecha_fin: '2026-05-27', hora_inicio: null, hora_fin: null }
    const result = clubCoreToGoogleEvent(multiDay)
    expect(result.start?.date).toBe('2026-05-25')
    expect(result.end?.date).toBe('2026-05-28') // exclusive
  })
})

describe('googleEventToClubCore', () => {
  it('converts timed Google event to ClubCore fields', () => {
    const result = googleEventToClubCore({
      id: 'g1',
      summary: 'Partido',
      start: { dateTime: '2026-05-25T18:00:00-03:00' },
      end: { dateTime: '2026-05-25T20:00:00-03:00' },
      location: 'Estadio',
    })
    expect(result.titulo).toBe('Partido')
    expect(result.fecha_inicio).toBe('2026-05-25')
    expect(result.hora_inicio).toBe('18:00')
    expect(result.hora_fin).toBe('20:00')
    expect(result.lugar_encuentro).toBe('Estadio')
  })

  it('converts all-day Google event', () => {
    const result = googleEventToClubCore({
      id: 'g2',
      summary: 'Torneo',
      start: { date: '2026-05-25' },
      end: { date: '2026-05-27' }, // exclusive
    })
    expect(result.fecha_inicio).toBe('2026-05-25')
    expect(result.fecha_fin).toBe('2026-05-26') // -1 day
    expect(result.hora_inicio).toBeNull()
    expect(result.hora_fin).toBeNull()
  })
})

describe('computeEventHash', () => {
  it('returns same hash for same event data', () => {
    const h1 = computeEventHash(baseEvento)
    const h2 = computeEventHash({ ...baseEvento })
    expect(h1).toBe(h2)
  })

  it('returns different hash for different data', () => {
    const h1 = computeEventHash(baseEvento)
    const h2 = computeEventHash({ ...baseEvento, titulo: 'Otro' })
    expect(h1).not.toBe(h2)
  })

  it('hash is 64-char hex (SHA-256)', () => {
    const h = computeEventHash(baseEvento)
    expect(h).toMatch(/^[a-f0-9]{64}$/)
  })
})

describe('eventsEqual', () => {
  it('returns true for matching hashes', () => {
    const h = computeEventHash(baseEvento)
    expect(eventsEqual(h, h)).toBe(true)
  })

  it('returns false for different hashes', () => {
    expect(eventsEqual('abc', 'def')).toBe(false)
  })
})
