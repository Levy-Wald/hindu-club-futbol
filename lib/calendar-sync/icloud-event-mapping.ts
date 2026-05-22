import ICAL from 'ical.js'
import type { ICloudCalendarEvent } from './types'

type ClubCoreEvento = {
  id: string
  titulo: string | null
  descripcion: string | null
  fecha_inicio: string
  fecha_fin: string
  hora_inicio: string | null
  hora_fin: string | null
  lugar_encuentro: string | null
  tipo_evento_slug: string
  updated_at: string
}

/**
 * Maps a ClubCore evento to an ICloudCalendarEvent for CalDAV PUT.
 */
export function clubCoreToICloudEvent(evento: ClubCoreEvento): ICloudCalendarEvent {
  const isAllDay = !evento.hora_inicio

  let dtstart: string
  let dtend: string

  if (isAllDay) {
    dtstart = evento.fecha_inicio
    dtend = addDays(evento.fecha_fin, 1) // iCal end is exclusive for all-day
  } else {
    dtstart = `${evento.fecha_inicio}T${evento.hora_inicio}:00`
    const horaFin = evento.hora_fin ?? addHours(evento.hora_inicio!, 1)
    dtend = `${evento.fecha_fin}T${horaFin}:00`
  }

  return {
    uid: evento.id,
    summary: evento.titulo || evento.tipo_evento_slug,
    description: evento.descripcion ?? undefined,
    dtstart,
    dtend,
    isAllDay,
    location: evento.lugar_encuentro ?? undefined,
    lastModified: evento.updated_at,
  }
}

/**
 * Maps an ICloudCalendarEvent (parsed from iCal) to partial ClubCore evento.
 */
export function icloudEventToClubCore(event: ICloudCalendarEvent) {
  let fechaInicio: string
  let fechaFin: string
  let horaInicio: string | null = null
  let horaFin: string | null = null

  if (event.isAllDay) {
    fechaInicio = event.dtstart.split('T')[0]
    // iCal end is exclusive for all-day events
    fechaFin = addDays(event.dtend.split('T')[0], -1)
  } else {
    const startDT = new Date(event.dtstart)
    const endDT = new Date(event.dtend)
    fechaInicio = toDateString(startDT)
    fechaFin = toDateString(endDT)
    horaInicio = toTimeString(startDT)
    horaFin = toTimeString(endDT)
  }

  return {
    titulo: event.summary || null,
    descripcion: event.description || null,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    hora_inicio: horaInicio,
    hora_fin: horaFin,
    lugar_encuentro: event.location || null,
  }
}

/**
 * Parses an iCalendar (.ics) string into ICloudCalendarEvent[].
 */
export function parseICalendarString(icsData: string): ICloudCalendarEvent[] {
  const events: ICloudCalendarEvent[] = []

  try {
    const jcalData = ICAL.parse(icsData)
    const comp = new ICAL.Component(jcalData)
    const vevents = comp.getAllSubcomponents('vevent')

    for (const vevent of vevents) {
      const event = new ICAL.Event(vevent)
      const uid = event.uid
      if (!uid) continue

      const dtstart = event.startDate
      const dtend = event.endDate
      const isAllDay = dtstart.isDate

      events.push({
        uid,
        summary: event.summary || '',
        description: event.description || undefined,
        dtstart: isAllDay
          ? dtstart.toString() // YYYY-MM-DD
          : dtstart.toJSDate().toISOString(),
        dtend: isAllDay
          ? dtend.toString()
          : dtend.toJSDate().toISOString(),
        isAllDay,
        location: event.location || undefined,
        lastModified: (() => {
          const lm = vevent.getFirstPropertyValue('last-modified')
          return lm && typeof lm === 'object' && 'toJSDate' in lm
            ? (lm as ICAL.Time).toJSDate().toISOString()
            : undefined
        })(),
        status: vevent.getFirstPropertyValue('status') as string | undefined,
      })
    }
  } catch {
    // If parsing fails, return empty array
  }

  return events
}

/**
 * Generates an iCalendar (.ics) string from an ICloudCalendarEvent.
 */
export function generateICalendarString(event: ICloudCalendarEvent): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  let dtstart: string
  let dtend: string

  if (event.isAllDay) {
    // VALUE=DATE format: YYYYMMDD
    dtstart = `DTSTART;VALUE=DATE:${event.dtstart.replace(/-/g, '')}`
    dtend = `DTEND;VALUE=DATE:${event.dtend.replace(/-/g, '')}`
  } else {
    // With time: YYYYMMDDTHHMMSS
    const startFormatted = formatICalDateTime(event.dtstart)
    const endFormatted = formatICalDateTime(event.dtend)
    dtstart = `DTSTART:${startFormatted}`
    dtend = `DTEND:${endFormatted}`
  }

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ClubCore//CalendarSync//EN',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${now}`,
    dtstart,
    dtend,
    `SUMMARY:${escapeICalText(event.summary)}`,
  ]

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
  }
  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`)
  }

  lines.push(`LAST-MODIFIED:${now}`)
  lines.push('END:VEVENT')
  lines.push('END:VCALENDAR')

  return lines.join('\r\n') + '\r\n'
}

// ── Helpers ──

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

function addHours(timeStr: string, hours: number): string {
  const [h, m] = timeStr.split(':').map(Number)
  const newH = Math.min(h + hours, 23)
  return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

function toTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatICalDateTime(iso: string): string {
  // Convert ISO to iCal format: 20260525T180000
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').split('Z')[0]
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
}
