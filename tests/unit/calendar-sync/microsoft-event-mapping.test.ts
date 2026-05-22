import { describe, it, expect } from 'vitest'
import {
  clubCoreToMicrosoftEvent,
  microsoftEventToClubCore,
} from '../../../lib/calendar-sync/microsoft-event-mapping'

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

describe('clubCoreToMicrosoftEvent', () => {
  it('converts timed event to Microsoft format', () => {
    const result = clubCoreToMicrosoftEvent(baseEvento) as Record<string, unknown>
    expect(result.subject).toBe('Entrenamiento Sub-20')
    expect(result.isAllDay).toBe(false)
    const start = result.start as { dateTime: string; timeZone: string }
    const end = result.end as { dateTime: string; timeZone: string }
    expect(start.dateTime).toBe('2026-05-25T18:00:00')
    expect(end.dateTime).toBe('2026-05-25T20:00:00')
    expect(start.timeZone).toBe('Argentina Standard Time')
    const location = result.location as { displayName: string }
    expect(location.displayName).toBe('Cancha 1')
  })

  it('converts all-day event', () => {
    const allDay = { ...baseEvento, hora_inicio: null, hora_fin: null }
    const result = clubCoreToMicrosoftEvent(allDay) as Record<string, unknown>
    expect(result.isAllDay).toBe(true)
    const start = result.start as { dateTime: string }
    const end = result.end as { dateTime: string }
    expect(start.dateTime).toBe('2026-05-25T00:00:00')
    // Microsoft end is exclusive for all-day
    expect(end.dateTime).toBe('2026-05-26T00:00:00')
  })

  it('uses tipo_evento_slug as fallback subject', () => {
    const noTitle = { ...baseEvento, titulo: null }
    const result = clubCoreToMicrosoftEvent(noTitle) as Record<string, unknown>
    expect(result.subject).toBe('entrenamiento')
  })

  it('includes body when descripcion exists', () => {
    const result = clubCoreToMicrosoftEvent(baseEvento) as Record<string, unknown>
    const body = result.body as { contentType: string; content: string }
    expect(body.contentType).toBe('text')
    expect(body.content).toBe('Sesion tactica')
  })
})

describe('microsoftEventToClubCore', () => {
  it('converts timed Microsoft event', () => {
    const result = microsoftEventToClubCore({
      id: 'm1',
      subject: 'Partido',
      start: { dateTime: '2026-05-25T18:00:00', timeZone: 'Argentina Standard Time' },
      end: { dateTime: '2026-05-25T20:00:00', timeZone: 'Argentina Standard Time' },
      isAllDay: false,
      location: { displayName: 'Estadio' },
    })
    expect(result.titulo).toBe('Partido')
    expect(result.fecha_inicio).toBe('2026-05-25')
    expect(result.hora_inicio).toBe('18:00')
    expect(result.hora_fin).toBe('20:00')
    expect(result.lugar_encuentro).toBe('Estadio')
  })

  it('converts all-day Microsoft event', () => {
    const result = microsoftEventToClubCore({
      id: 'm2',
      subject: 'Torneo',
      start: { dateTime: '2026-05-25T00:00:00.0000000', timeZone: 'UTC' },
      end: { dateTime: '2026-05-27T00:00:00.0000000', timeZone: 'UTC' },
      isAllDay: true,
    })
    expect(result.fecha_inicio).toBe('2026-05-25')
    expect(result.fecha_fin).toBe('2026-05-26') // -1 day (exclusive end)
    expect(result.hora_inicio).toBeNull()
    expect(result.hora_fin).toBeNull()
  })

  it('handles missing location', () => {
    const result = microsoftEventToClubCore({
      id: 'm3',
      subject: 'Test',
      start: { dateTime: '2026-05-25T10:00:00', timeZone: 'UTC' },
      end: { dateTime: '2026-05-25T11:00:00', timeZone: 'UTC' },
    })
    expect(result.lugar_encuentro).toBeNull()
  })
})
