import { describe, it, expect } from 'vitest'
import {
  clubCoreToICloudEvent,
  icloudEventToClubCore,
  parseICalendarString,
  generateICalendarString,
} from '../../../lib/calendar-sync/icloud-event-mapping'

const baseEvento = {
  id: 'evt-123',
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

describe('clubCoreToICloudEvent', () => {
  it('converts timed event', () => {
    const result = clubCoreToICloudEvent(baseEvento)
    expect(result.uid).toBe('evt-123')
    expect(result.summary).toBe('Entrenamiento Sub-20')
    expect(result.isAllDay).toBe(false)
    expect(result.dtstart).toBe('2026-05-25T18:00:00')
    expect(result.dtend).toBe('2026-05-25T20:00:00')
    expect(result.location).toBe('Cancha 1')
  })

  it('converts all-day event', () => {
    const allDay = { ...baseEvento, hora_inicio: null, hora_fin: null }
    const result = clubCoreToICloudEvent(allDay)
    expect(result.isAllDay).toBe(true)
    expect(result.dtstart).toBe('2026-05-25')
    expect(result.dtend).toBe('2026-05-26') // exclusive end
  })

  it('uses tipo_evento_slug as fallback', () => {
    const noTitle = { ...baseEvento, titulo: null }
    const result = clubCoreToICloudEvent(noTitle)
    expect(result.summary).toBe('entrenamiento')
  })
})

describe('icloudEventToClubCore', () => {
  it('converts timed iCloud event', () => {
    const result = icloudEventToClubCore({
      uid: 'ic-1',
      summary: 'Partido',
      dtstart: '2026-05-25T18:00:00.000Z',
      dtend: '2026-05-25T20:00:00.000Z',
      isAllDay: false,
      location: 'Estadio',
    })
    expect(result.titulo).toBe('Partido')
    expect(result.fecha_inicio).toBe('2026-05-25')
    // hora depends on local timezone (Date parses UTC, toTimeString uses local)
    expect(result.hora_inicio).toBeTruthy()
    expect(result.hora_fin).toBeTruthy()
    expect(result.lugar_encuentro).toBe('Estadio')
  })

  it('converts all-day iCloud event', () => {
    const result = icloudEventToClubCore({
      uid: 'ic-2',
      summary: 'Torneo',
      dtstart: '2026-05-25',
      dtend: '2026-05-27',
      isAllDay: true,
    })
    expect(result.fecha_inicio).toBe('2026-05-25')
    expect(result.fecha_fin).toBe('2026-05-26') // -1 day
    expect(result.hora_inicio).toBeNull()
  })
})

describe('generateICalendarString', () => {
  it('generates valid .ics for timed event', () => {
    const event = clubCoreToICloudEvent(baseEvento)
    const ics = generateICalendarString(event)
    expect(ics).toContain('BEGIN:VCALENDAR')
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('UID:evt-123')
    expect(ics).toContain('SUMMARY:Entrenamiento Sub-20')
    expect(ics).toContain('LOCATION:Cancha 1')
    expect(ics).toContain('DTSTART:20260525T180000')
    expect(ics).toContain('DTEND:20260525T200000')
    expect(ics).toContain('END:VEVENT')
    expect(ics).toContain('END:VCALENDAR')
  })

  it('generates VALUE=DATE for all-day event', () => {
    const event = clubCoreToICloudEvent({ ...baseEvento, hora_inicio: null, hora_fin: null })
    const ics = generateICalendarString(event)
    expect(ics).toContain('DTSTART;VALUE=DATE:20260525')
    expect(ics).toContain('DTEND;VALUE=DATE:20260526')
  })

  it('escapes special characters', () => {
    const event = clubCoreToICloudEvent({ ...baseEvento, titulo: 'Test; with, special\nchars' })
    const ics = generateICalendarString(event)
    expect(ics).toContain('SUMMARY:Test\\; with\\, special\\nchars')
  })
})

describe('parseICalendarString', () => {
  it('parses a basic VCALENDAR with VEVENT', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:test-uid-123',
      'DTSTART:20260525T180000Z',
      'DTEND:20260525T200000Z',
      'SUMMARY:Entrenamiento',
      'LOCATION:Cancha 1',
      'DESCRIPTION:Sesion tactica',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = parseICalendarString(ics)
    expect(events).toHaveLength(1)
    expect(events[0].uid).toBe('test-uid-123')
    expect(events[0].summary).toBe('Entrenamiento')
    expect(events[0].location).toBe('Cancha 1')
    expect(events[0].isAllDay).toBe(false)
  })

  it('parses all-day event', () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      'UID:allday-1',
      'DTSTART;VALUE=DATE:20260525',
      'DTEND;VALUE=DATE:20260526',
      'SUMMARY:Torneo',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const events = parseICalendarString(ics)
    expect(events).toHaveLength(1)
    expect(events[0].isAllDay).toBe(true)
    expect(events[0].uid).toBe('allday-1')
  })

  it('returns empty array for invalid input', () => {
    const events = parseICalendarString('not valid ics')
    expect(events).toHaveLength(0)
  })
})
